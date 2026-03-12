import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ExamStartClient } from './ExamStartClient';

export default async function ExamStartPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  // Get active exam
  const { data: exam } = await supabase
    .from('exams')
    .select('*')
    .eq('is_active', true)
    .eq('exam_type', 'knm_full')
    .single();

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <p className="text-2xl">⚠️</p>
          <p className="font-bold text-gray-900">Exam temporarily unavailable</p>
          <p className="text-gray-500 text-sm">Please try again later.</p>
          <a href="/home" className="text-brand-primary text-sm">← Back to home</a>
        </div>
      </div>
    );
  }

  // Check if user has an in-progress session on another device
  const { data: activeSession } = await supabase
    .from('exam_sessions')
    .select('id, created_at')
    .eq('user_id', user.id)
    .eq('status', 'in_progress')
    .single();

  return <ExamStartClient exam={exam} existingSession={activeSession} userId={user.id} />;
}
