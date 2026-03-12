import { createServerSupabase } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' });

// GET /api/stripe/create-checkout?plan=trial|monthly
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/register', request.url));

  const { searchParams } = new URL(request.url);
  const plan = searchParams.get('plan') ?? 'monthly';

  const { data: profile } = await supabase
    .from('users')
    .select('email, display_name, subscription_status')
    .eq('id', user.id)
    .single();

  // Don't create new checkout if already premium
  if (profile?.subscription_status === 'premium') {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://inburgering.app';

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card', 'ideal'], // iDEAL for Dutch users (PRD §7.3)
    mode: 'subscription',
    customer_email: profile?.email ?? undefined,
    metadata: { user_id: user.id },
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Inburgering App Premium',
            description: 'Unlimited KNM practice exams + AI explanations',
          },
          unit_amount: 999, // €9.99 in cents (PRD §7.2)
          recurring: { interval: 'month' },
        },
        quantity: 1,
      },
    ],
    subscription_data:
      plan === 'trial'
        ? { trial_period_days: 3, metadata: { user_id: user.id } }
        : { metadata: { user_id: user.id } },
    success_url: `${appUrl}/home?subscription=success`,
    cancel_url: `${appUrl}/trial?cancelled=true`,
    locale: 'nl', // Dutch-language checkout (PRD §7.3)
  });

  return NextResponse.redirect(session.url!);
}
