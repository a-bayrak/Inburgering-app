import { createServerSupabase, createServiceSupabase } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { Language } from '@/types';

// GET /api/ai/static-explanation?question_id=...&language=...
// Returns the pre-written multilingual explanation from the questions table.
// Used as fallback when AI is unavailable (PRD §1.C.5).
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const questionId = searchParams.get('question_id');
  const language = (searchParams.get('language') ?? 'nl') as Language;

  if (!questionId) return NextResponse.json({ error: 'Missing question_id' }, { status: 400 });

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Uses service role — needs to read explanation fields
  const serviceSupabase = createServiceSupabase();
  const { data: question } = await serviceSupabase
    .from('questions')
    .select('explanation_nl, explanation_en, explanation_ar, explanation_fa, explanation_tr')
    .eq('id', questionId)
    .single();

  if (!question) return NextResponse.json({ explanation: null });

  // Fallback chain: requested language → Dutch → English → null
  const explanation =
    question[`explanation_${language}` as keyof typeof question] ??
    question.explanation_nl ??
    question.explanation_en ??
    null;

  return NextResponse.json({ explanation, language, from_static: true });
}
