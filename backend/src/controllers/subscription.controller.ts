import { Response } from 'express';
import Stripe from 'stripe';
import db from '../config/database';
import { AuthRequest } from '../types';
import { sendSubscriptionConfirmation } from '../utils/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

const PLANS: Record<string, { priceId: string; durationDays: number; amount: number }> = {
  monthly: {
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID!,
    durationDays: 30,
    amount: 9.99,
  },
  yearly: {
    priceId: process.env.STRIPE_YEARLY_PRICE_ID!,
    durationDays: 365,
    amount: 89.99,
  },
};

// ── Create Checkout Session ───────────────────────────────────────────────────
export const createCheckoutSession = async (req: AuthRequest, res: Response): Promise<void> => {
  const { plan } = req.body;
  const planConfig = PLANS[plan];
  if (!planConfig) {
    res.status(400).json({ success: false, message: 'Invalid plan' });
    return;
  }

  const user = await db('users').where({ id: req.user!.userId }).first();
  let customerId = user.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, name: user.display_name });
    customerId = customer.id;
    await db('users').where({ id: user.id }).update({ stripe_customer_id: customerId });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: planConfig.priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/subscription/cancel`,
    metadata: { userId: user.id, plan },
  });

  res.json({ success: true, data: { url: session.url, sessionId: session.id } });
};

// ── Stripe Webhook ────────────────────────────────────────────────────────────
export const handleWebhook = async (req: AuthRequest, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      (req as any).rawBody || req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    return;
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const { userId, plan } = session.metadata || {};
      if (userId && plan) {
        const planConfig = PLANS[plan];
        const startsAt = new Date();
        const expiresAt = new Date(Date.now() + planConfig.durationDays * 24 * 3600 * 1000);
        await db('subscriptions').insert({
          user_id: userId,
          plan,
          status: 'active',
          stripe_subscription_id: session.subscription as string,
          amount: planConfig.amount,
          starts_at: startsAt,
          expires_at: expiresAt,
        });
        await db('users').where({ id: userId }).update({
          subscription_type: plan,
          subscription_expires_at: expiresAt,
        });
        const user = await db('users').where({ id: userId }).first();
        if (user) await sendSubscriptionConfirmation(user.email, plan, expiresAt).catch(() => {});
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const subscription = await db('subscriptions')
        .where({ stripe_subscription_id: sub.id }).first();
      if (subscription) {
        await db('subscriptions').where({ id: subscription.id }).update({ status: 'cancelled', cancelled_at: db.fn.now() });
        await db('users').where({ id: subscription.user_id }).update({
          subscription_type: 'free',
          subscription_expires_at: null,
        });
      }
      break;
    }
  }
  res.json({ received: true });
};

// ── Get Subscription ──────────────────────────────────────────────────────────
export const getSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  const sub = await db('subscriptions')
    .where({ user_id: req.user!.userId, status: 'active' })
    .orderBy('created_at', 'desc')
    .first();
  const user = await db('users').where({ id: req.user!.userId }).select('subscription_type', 'subscription_expires_at').first();
  res.json({ success: true, data: { subscription: sub || null, ...user } });
};

// ── Cancel Subscription ───────────────────────────────────────────────────────
export const cancelSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  const sub = await db('subscriptions')
    .where({ user_id: req.user!.userId, status: 'active' })
    .orderBy('created_at', 'desc').first();
  if (!sub?.stripe_subscription_id) {
    res.status(404).json({ success: false, message: 'No active subscription' });
    return;
  }
  await stripe.subscriptions.cancel(sub.stripe_subscription_id);
  res.json({ success: true, message: 'Subscription cancelled. Access until end of billing period.' });
};
