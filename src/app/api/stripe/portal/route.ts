import { createServerSupabase } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' });

// GET /api/stripe/portal
// Opens Stripe Customer Portal for subscription management (PRD §7.3)
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/register', request.url));

  const { data: profile } = await supabase
    .from('users')
    .select('email')
    .eq('id', user.id)
    .single();

  // Find Stripe customer by email
  const customers = await stripe.customers.list({ email: profile?.email ?? '' });
  const customer = customers.data[0];

  if (!customer) {
    return NextResponse.redirect(new URL('/settings', request.url));
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://inburgering.app';
  const session = await stripe.billingPortal.sessions.create({
    customer: customer.id,
    return_url: `${appUrl}/settings`,
  });

  return NextResponse.redirect(session.url);
}
