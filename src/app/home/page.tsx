import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { HomeClient } from './HomeClient';
import type { User, UserAnalytics } from '@/types';

export default async function HomePage() {
  const supabase = await createServerSupabase();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) redirect('/');

  const [{ data: profile }, { data: analytics }] = await Promise.all([
    supabase.from('users').select('*').eq('id', authUser.id).single(),
    supabase.from('user_analytics').select('*').eq('user_id', authUser.id).single(),
  ]);

  return <HomeClient user={profile as User} analytics={analytics as UserAnalytics | null} />;
}
