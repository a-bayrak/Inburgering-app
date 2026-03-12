import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import crypto from 'crypto';
import type { Language, AnswerOption } from '@/types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /api/ai/pause-and-learn
// Checks cache first. Enforces daily caps. AI safety guardrails applied.
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { question_id, selected_option, language } = await request.json() as {
    question_id: string;
    selected_option: AnswerOption | null;
    language: Language;
  };

  // Validate inputs
  if (!question_id || !language) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (selected_option && !['A', 'B', 'C'].includes(selected_option)) {
    return NextResponse.json({ error: 'Invalid answer option' }, { status: 400 });
  }

  // Check user has AI consent (PRD §22)
  const { data: profile } = await supabase
    .from('users')
    .select('ai_consent_granted, injection_flagged, subscription_status')
    .eq('id', user.id)
    .single();

  if (!profile?.ai_consent_granted) {
    return NextResponse.json({ error: 'AI consent required' }, { status: 403 });
  }
  if (profile?.injection_flagged) {
    return NextResponse.json({ error: 'AI access restricted' }, { status: 403 });
  }
  if (!['premium', 'trial'].includes(profile?.subscription_status)) {
    return NextResponse.json({ error: 'Premium required' }, { status: 403 });
  }

  // Check daily caps (PRD §1.C.7 — 100 pause_and_learn calls per day)
  const today = new Date().toISOString().split('T')[0];
  const { data: usage } = await supabase
    .from('ai_daily_usage')
    .select('*')
    .eq('user_id', user.id)
    .eq('usage_date', today)
    .single();

  if ((usage?.pause_and_learn_count ?? 0) >= 100) {
    return NextResponse.json({ error: 'Daily AI limit reached' }, { status: 429 });
  }

  // Check circuit breaker (PRD §20.3)
  const { data: circuitBreaker } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'ai_circuit_breaker_active')
    .single();

  if (circuitBreaker?.value === true || circuitBreaker?.value === 'true') {
    return getStaticFallback(question_id, language, supabase);
  }

  // Cache lookup (PRD §1.C.5 / §20.1)
  const cacheKey = crypto
    .createHash('sha256')
    .update(`${question_id}:${language}:${selected_option ?? 'correct'}`)
    .digest('hex');

  const { data: cached } = await supabase
    .from('ai_cache')
    .select('response_text, id')
    .eq('cache_key', cacheKey)
    .single();

  if (cached) {
    // Increment hit count
    await supabase
      .from('ai_cache')
      .update({ hit_count: cached.hit_count + 1 })
      .eq('id', cached.id);

    return NextResponse.json({
      explanation: cached.response_text,
      language,
      from_cache: true,
      tokens_used: 0,
    });
  }

  // Get question details (using service role to get Dutch text)
  const serviceSupabase = createServiceSupabase();
  const { data: question } = await serviceSupabase
    .from('questions')
    .select('question_nl, option_a, option_b, option_c, correct_answer, explanation_nl')
    .eq('id', question_id)
    .single();

  if (!question) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 });
  }

  // AI Safety: check for prompt injection in the question (PRD §19)
  const safeQuestion = sanitizeInput(question.question_nl);

  // Build prompt
  const langName: Record<Language, string> = {
    nl: 'Dutch', ar: 'Arabic', en: 'English', fa: 'Persian (Farsi)', tr: 'Turkish',
  };

  const selectedText = selected_option === 'A' ? question.option_a
    : selected_option === 'B' ? question.option_b
    : selected_option === 'C' ? question.option_c : null;

  const correctText = question.correct_answer ===
