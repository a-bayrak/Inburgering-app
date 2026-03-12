import { createServiceSupabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/health — used by uptime monitor (MDC §2.F.3)
export async function GET() {
  const start = Date.now();
  let dbOk = false;

  try {
    const supabase = createServiceSupabase();
    const { error } = await supabase.from('app_settings').select('key').limit(1);
    dbOk = !error;
  } catch {
    dbOk = false;
  }

  const latencyMs = Date.now() - start;

  return NextResponse.json({
    status: dbOk ? 'ok' : 'degraded',
    db: dbOk ? 'ok' : 'error',
    latency_ms: latencyMs,
    version: process.env.NEXT_PUBLIC_APP_VERSION,
    timestamp: new Date().toISOString(),
  }, {
    status: dbOk ? 200 : 503,
  });
}
