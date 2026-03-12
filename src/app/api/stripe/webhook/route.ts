import { createServiceSupabase } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' });

// POST /api/stripe/webhook
// Handles subscription lifecycle events → updates users table
export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature') ?? '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServiceSupabase();

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.user_id;
      if (!userId) break;

      const status = sub.status === 'trialing' ? 'trial'
        : sub.status === 'active' ? 'premium'
        : 'free';

      await supabase.from('users').update({
        subscription_status: status,
        subscription_tier: 'monthly',
        subscription_platform: 'stripe',
        subscription_expiry: new Date(sub.current_period_end * 1000).toISOString(),
        trial_activated_at: sub.trial_start
          ? new Date(sub.trial_start * 1000).toISOString()
          : undefined,
      }).eq('id', userId);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.user_id;
      if (!userId) break;

      await supabase.from('users').update({
        subscription_status: 'cancelled',
        subscription_expiry: new Date().toISOString(),
      }).eq('id', userId);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
      if (!subId) break;

      const sub = await stripe.subscriptions.retrieve(subId);
      const userId = sub.metadata?.user_id;
      if (!userId) break;

      await supabase.from('users').update({
        subscription_status: 'expired',
      }).eq('id', userId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
