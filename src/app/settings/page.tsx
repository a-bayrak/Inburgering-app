import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SettingsClient } from './SettingsClient';
import type { User } from '@/types';

export default async function SettingsPage() {
  const supabase = await createServerSupabase();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect('/');
  const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single();
  return <SettingsClient user={profile as User} />;
}
