import { createBrowserClient } from '@supabase/ssr';

// Client-side Supabase instance — used in Client Components and hooks
// ⛔ Never access service_role key here. Anon key only.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
