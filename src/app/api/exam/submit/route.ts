import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/exam/submit
// Triggers server-side scoring. Client NEVER sees correct_answer. (PRD §1.C.9)
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { session_id, auto_submitted, time_remaining } = await request.json();

  // Verify session belongs to this user
  const { data: session } = await supabase
    .from('exam_sessions')
    .select('*')
    .eq('id', session_id)
    .eq('user_id', user.id)
    .single();

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  if (session.status === 'completed') {
    return NextResponse.json({ session_id }); // Already scored
  }

  // Use service role to access correct_answer (⛔ never in client code)
  const serviceSupabase = createServiceSupabase();

  // Get all submitted answers
  const { data: answers } = await serviceSupabase
    .from('exam_session_answers')
    .select('question_id, selected_option')
    .eq('session_id', session_id);

  // Get correct answers (service_role bypasses RLS)
  const questionIds = (answers ?? []).map((a: { question_id: string }) => a.question_id);
  const { data: questions } = await serviceSupabase
    .from('questions')
    .select('id, category_id, correct_answer')
    .in('id', questionIds);

  // Server-side scoring (PRD §1.C.9)
  const correctMap: Record<string, { correct_answer: string; category_id: string }> = {};
  (questions ?? []).forEach((q: { id: string; correct_answer: string; category_id: string }) => {
    correctMap[q.id] = { correct_answer: q.correct_answer, category_id: q.category_id };
  });

  let scoreRaw = 0;
  const categoryScores: Record<string, { correct: number; total: number; percentage: number }> = {};

  (answers ?? []).forEach((answer: { question_id: string; selected_option: string | null }) => {
    const q = correctMap[answer.question_id];
    if (!q) return;

    if (!categoryScores[q.category_id]) {
      categoryScores[q.category_id] = { correct: 0, total: 0, percentage: 0 };
    }
    categoryScores[q.category_id].total++;

    if (answer.selected_option === q.correct_answer) {
      scoreRaw++;
      categoryScores[q.category_id].correct++;
    }
  });

  // Compute percentages
  Object.keys(categoryScores).forEach((cat) => {
    const s = categoryScores[cat];
    s.percentage = Math.round((s.correct / s.total) * 100);
  });

  // Grade formula: round((score_raw/40)*10, 1) — PRD §1.A.6
  const scorePct = (scoreRaw / 40) * 100;
  const grade = Math.round((scoreRaw / 40) * 10 * 10) / 10;
  const passed = grade >= 6.0; // PRD §1.A.6

  const completedAt = new Date().toISOString();

  // Update session with results
  await serviceSupabase
    .from('exam_sessions')
    .update({
      status: auto_submitted ? 'auto_submitted' : 'completed',
      completed_at: completedAt,
      time_remaining_sec: time_remaining ?? 0,
      score_raw: scoreRaw,
      score_pct: scorePct,
      grade,
      passed,
      category_scores: categoryScores,
    })
    .eq('id', session_id);

  return NextResponse.json({ session_id, score_raw: scoreRaw, grade, passed });
}
