import { createServerSupabase, createServiceSupabase } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/user/delete
// Marks user for deletion. Actual deletion happens async within 72 hours (PRD §22 / GDPR Art.17)
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const serviceSupabase = createServiceSupabase();

  // Mark for deletion — actual hard delete within 72h via scheduled job
  await serviceSupabase.from('users').update({
    data_deletion_requested: true,
    data_deletion_requested_at: new Date().toISOString(),
    email: `DELETED_${user.id}@deleted.invalid`, // Anonymise email immediately
    display_name: 'Deleted User',
  }).eq('id', user.id);

  // Sign user out
  await supabase.auth.signOut();

  return NextResponse.json({ success: true, message: 'Account deletion scheduled within 72 hours.' });
}
