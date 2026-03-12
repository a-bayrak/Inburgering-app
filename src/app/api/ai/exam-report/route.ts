import { createServerSupabase, createServiceSupabase } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { Language } from '@/types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /api/ai/exam-report
// Generates personalised post-exam report. Premium only. Max 5/day. (PRD §1.D.4)
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { session_id } = await request.json();

  // Gate checks
  const { data: profile } = await supabase
    .from('users')
    .select('ai_consent_granted, injection_flagged, subscription_status, preferred_language')
    .eq('id', user.id)
    .single();

  if (!profile?.ai_consent_granted) return NextResponse.json({ error: 'AI consent required' }, { status: 403 });
  if (profile?.injection_flagged) return NextResponse.json({ error: 'AI access restricted' }, { status: 403 });
  if (!['premium', 'trial'].includes(profile?.subscription_status)) {
    return NextResponse.json({ error: 'Premium required' }, { status: 403 });
  }

  // Daily cap — 5 exam reports per day (PRD §1.C.7)
  const today = new Date().toISOString().split('T')[0];
  const { data: usage } = await supabase
    .from('ai_daily_usage')
    .select('exam_report_count, total_tokens')
    .eq('user_id', user.id)
    .eq('usage_date', today)
    .single();

  if ((usage?.exam_report_count ?? 0) >= 5) {
    return NextResponse.json({ error: 'Daily exam report limit reached' }, { status: 429 });
  }

  // Circuit breaker
  const { data: circuitBreaker } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'ai_circuit_breaker_active')
    .single();

  if (circuitBreaker?.value === true || circuitBreaker?.value === 'true') {
    return NextResponse.json({ error: 'AI temporarily unavailable' }, { status: 503 });
  }

  // Get session
  const { data: session } = await supabase
    .from('exam_sessions')
    .select('*')
    .eq('id', session_id)
    .eq('user_id', user.id)
    .single();

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

  const language = (profile.preferred_language ?? 'nl') as Language;
  const langNames: Record<Language, string> = {
    nl: 'Dutch', ar: 'Arabic', en: 'English', fa: 'Persian (Farsi)', tr: 'Turkish',
  };

  const categoryScores = session.category_scores ?? {};
  const weakAreas = Object.entries(categoryScores)
    .filter(([, s]: [string, unknown]) => {
      const score = s as { correct: number; total: number };
      return score.total > 0 && (score.correct / score.total) < 0.65;
    })
    .map(([id]) => id);

  const KNM_NAMES: Record<string, string> = {
    'KNM-01': 'Work & Income',
    'KNM-02': 'Customs, Values & Norms',
    'KNM-03': 'Living in the Netherlands',
    'KNM-04': 'Health & Healthcare',
    'KNM-05': 'History & Geography',
    'KNM-06': 'Public Institutions',
    'KNM-07': 'Government & Rule of Law',
    'KNM-08': 'Education',
  };

  const scoreSummary = Object.entries(categoryScores)
    .map(([id, s]: [string, unknown]) => {
      const score = s as { correct: number; total: number };
      return `${KNM_NAMES[id] ?? id}: ${score.correct}/${score.total}`;
    })
    .join(', ');

  const systemPrompt = `You are a supportive civic integration exam coach.
You ONLY discuss Dutch KNM exam results and study advice.
Respond ONLY in ${langNames[language]}.
Be warm, encouraging, and specific. Keep total response under 200 words.
Return valid JSON in this exact shape:
{"summary": "1-2 sentence performance summary", "weak_areas": ["KNM-XX", ...], "recommendations": ["tip1", "tip2", "tip3"]}`;

  const userPrompt = `Student exam result:
- Grade: ${session.grade?.toFixed(1)} (${session.passed ? 'PASSED' : 'NOT PASSED'})
- Score: ${session.score_raw}/40 (${session.score_pct?.toFixed(0)}%)
- Category scores: ${scoreSummary}
Provide personalised analysis and 3 specific study tips.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 350,
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const tokensUsed = completion.usage?.total_tokens ?? 0;
    const costEur = (tokensUsed / 1_000_000) * 0.15;

    let parsed: { summary: string; weak_areas: string[]; recommendations: string[] };
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { summary: raw, weak_areas: weakAreas, recommendations: [] };
    }

    // Update daily usage
    await supabase.from('ai_daily_usage').upsert({
      user_id: user.id,
      usage_date: today,
      exam_report_count: (usage?.exam_report_count ?? 0) + 1,
      total_tokens: (usage?.total_tokens ?? 0) + tokensUsed,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,usage_date' });

    // Cost log
    await supabase.from('ai_cost_log').insert({
      user_id: user.id,
      feature: 'exam_report',
      model: 'gpt-4o-mini',
      input_tokens: completion.usage?.prompt_tokens ?? 0,
      output_tokens: completion.usage?.completion_tokens ?? 0,
      cost_eur: costEur,
      cache_hit: false,
      language,
    });

    return NextResponse.json({
      summary: parsed.summary ?? '',
      weak_areas: parsed.weak_areas ?? weakAreas,
      recommendations: parsed.recommendations ?? [],
      tokens_used: tokensUsed,
    });

  } catch (error) {
    console.error('OpenAI exam report error:', error);
    // Static fallback report
    return NextResponse.json({
      summary: `You scored ${session.score_raw}/40 (grade ${session.grade?.toFixed(1)}). ${session.passed ? 'Congratulations, you passed!' : 'Keep practising!'}`,
      weak_areas: weakAreas,
      recommendations: [
        'Review questions from your weakest categories.',
        'Practice daily for at least 20 minutes.',
        'Use Section Practice to focus on specific topics.',
      ],
      from_static: true,
    });
  }
}
