import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AnalyticsClient } from './AnalyticsClient';
import type { UserAnalytics, User } from '@/types';

export default async function AnalyticsPage() {
  const supabase = await createServerSupabase();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect('/');

  const [{ data: profile }, { data: analytics }] = await Promise.all([
    supabase.from('users').select('*').eq('id', authUser.id).single(),
    supabase.from('user_analytics').select('*').eq('user_id', authUser.id).single(),
  ]);

  const isPremium = ['premium', 'trial'].includes(profile?.subscription_status);

  return (
    <AnalyticsClient
      analytics={analytics as UserAnalytics | null}
      isPremium={isPremium}
      user={profile as User}
    />
  );
}
