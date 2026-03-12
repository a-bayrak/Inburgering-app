import { createServerSupabase } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/user/export-data
// Returns all user data as JSON file download (GDPR Art.20 — data portability)
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Collect all user data
  const [
    { data: profile },
    { data: sessions },
    { data: analytics },
    { data: bookmarks },
    { data: gdprLog },
  ] = await Promise.all([
    supabase.from('users').select('id, email, display_name, preferred_language, subscription_status, streak_days, created_at').eq('id', user.id).single(),
    supabase.from('exam_sessions').select('id, status, score_raw, score_pct, grade, passed, category_scores, created_at, completed_at').eq('user_id', user.id),
    supabase.from('user_analytics').select('*').eq('user_id', user.id).single(),
    supabase.from('user_bookmarks').select('question_id, created_at').eq('user_id', user.id),
    supabase.from('gdpr_consent_log').select('consent_type, granted, created_at').eq('user_id', user.id),
  ]);

  const exportData = {
    export_date: new Date().toISOString(),
    gdpr_basis: 'GDPR Article 20 — Right to Data Portability',
    profile,
    exam_history: sessions ?? [],
    analytics: analytics ?? {},
    bookmarks: bookmarks ?? [],
    consent_history: gdprLog ?? [],
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="inburgering-data-${user.id.slice(0, 8)}.json"`,
    },
  });
}
