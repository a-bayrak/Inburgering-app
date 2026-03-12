import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ResultsClient } from './ResultsClient';
import type { ExamSession } from '@/types';

interface Props { params: Promise<{ sessionId: string }> }

export default async function ResultsPage({ params }: Props) {
  const { sessionId } = await params;
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: session } = await supabase
    .from('exam_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single();

  if (!session) redirect('/home');

  const { data: profile } = await supabase
    .from('users')
    .select('subscription_status')
    .eq('id', user.id)
    .single();

  const isPremium = profile?.subscription_status === 'premium' || profile?.subscription_status === 'trial';

  return <ResultsClient session={session as ExamSession} isPremium={isPremium} />;
}
