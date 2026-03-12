import { createBrowserClient } from '@supabase/ssr';

// Used in client components and hooks.
// Uses anon key only — RLS enforced.
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
