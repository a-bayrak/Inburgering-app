import { createServerSupabase } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/exam/start
// Creates an exam session and returns shuffled questions (WITHOUT correct_answer).
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { exam_id } = await request.json();

  // Check for existing in-progress session (cross-device conflict — PRD §1.C.8)
  const { data: existingSession } = await supabase
    .from('exam_sessions')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'in_progress')
    .single();

  if (existingSession) {
    return NextResponse.json({ error: 'You have an exam in progress on another device.' }, { status: 409 });
  }

  // Get the exam
  const { data: exam } = await supabase
    .from('exams')
    .select('*')
    .eq('id', exam_id)
    .eq('is_active', true)
    .single();

  if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });

  // Fetch approved questions via the client-safe view (no correct_answer)
  const { data: examQuestions } = await supabase
    .from('exam_questions')
    .select(`
      display_order,
      question:questions_client (
        id, category_id, question_nl, option_a, option_b, option_c,
        difficulty, media_id, audio_media_id, theme_group_id,
        media:content_media!media_id (media_type, storage_path, mime_type, alt_text_nl),
        audio_media:content_media!audio_media_id (media_type, storage_path, mime_type)
      )
    `)
    .eq('exam_id', exam_id);

  const questions = (examQuestions ?? [])
    .map((eq) => eq.question)
    .filter(Boolean);

  // Verify minimum question count (PRD §1.C.3)
  if (questions.length < 40) {
    return NextResponse.json({ error: 'Exam temporarily unavailable' }, { status: 503 });
  }

  // Shuffle questions (PRD §1.C.1 — randomised order)
  const shuffled = [...questions].sort(() => Math.random() - 0.5).slice(0, 40);
  const questionOrder = shuffled.map((q: { id: string }) => q.id);

  // Create session
  const { data: session, error: sessionError } = await supabase
    .from('exam_sessions')
    .insert({
      user_id: user.id,
      exam_id,
      status: 'in_progress',
      instruction_started_at: new Date().toISOString(),
      question_order: questionOrder,
    })
    .select('id')
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }

  // Pre-create answer slots (one per question)
  await supabase.from('exam_session_answers').insert(
    shuffled.map((q: { id: string }) => ({
      session_id: session.id,
      question_id: q.id,
    }))
  );

  return NextResponse.json({ session_id: session.id, questions: shuffled });
}
