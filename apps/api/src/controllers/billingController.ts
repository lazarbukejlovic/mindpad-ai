import Stripe from 'stripe';
import { config } from '../config/env';
import { PLAN_CONFIG, Plan, PlanError } from '../config/plans';
import { User } from '../models/User';
import { Task } from '../models/Task';

function getStripe() {
  if (!config.stripeSecretKey) return null;
  return new Stripe(config.stripeSecretKey as string, { apiVersion: '2024-06-20' as any });
}

function priceIdForPlan(plan: 'pro' | 'team'): string {
  if (plan === 'pro') return config.stripePriceProMonthly;
  return config.stripePriceTeamMonthly;
}

function planFromPriceId(priceId: string): 'pro' | 'team' | null {
  if (config.stripePriceProMonthly && priceId === config.stripePriceProMonthly) return 'pro';
  if (config.stripePriceTeamMonthly && priceId === config.stripePriceTeamMonthly) return 'team';
  return null;
}

export async function getBillingStatus(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const plan = (user.plan as Plan) || 'free';
  const entitlements = PLAN_CONFIG[plan];

  const activeTasks = await Task.countDocuments({ userId, completed: false });

  const today = new Date().toDateString();
  const lastDate = user.dailyExtractionsUsedDate?.toDateString();
  const dailyExtractionsUsed = lastDate === today ? (user.dailyExtractionsUsed || 0) : 0;

  const canManageBilling = !!(user.stripeCustomerId && config.stripeSecretKey);

  return {
    plan,
    subscriptionStatus: user.subscriptionStatus ?? null,
    currentPeriodEnd: user.currentPeriodEnd ? user.currentPeriodEnd.toISOString() : null,
    cancelAtPeriodEnd: user.cancelAtPeriodEnd ?? false,
    trialEnd: user.trialEnd ? user.trialEnd.toISOString() : null,
    canceledAt: user.canceledAt ? user.canceledAt.toISOString() : null,
    canManageBilling,
    stripeConfigured: !!config.stripeSecretKey,
    entitlements,
    usage: {
      activeTasks,
      dailyExtractionsUsed,
    },
  };
}

export async function createCheckoutSession(userId: string, plan: 'pro' | 'team') {
  const stripe = getStripe();
  if (!stripe) throw new PlanError('Billing not configured', 'BILLING_NOT_CONFIGURED');

  const priceId = priceIdForPlan(plan);
  if (!priceId) throw new Error(`Price for plan "${plan}" is not configured`);

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email });
    customerId = customer.id;
    user.stripeCustomerId = customerId;
    await user.save();
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { userId, plan },
    success_url: `${config.clientUrl}/settings?billing=success`,
    cancel_url: `${config.clientUrl}/settings?billing=canceled`,
  });

  return { url: session.url };
}

export async function createPortalSession(userId: string) {
  const stripe = getStripe();
  if (!stripe) throw new PlanError('Billing not configured', 'BILLING_NOT_CONFIGURED');

  const user = await User.findById(userId);
  if (!user || !user.stripeCustomerId) throw new Error('No billing account found');

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${config.clientUrl}/settings?billing=return`,
  });

  return { url: session.url };
}

export async function syncBilling(userId: string) {
  const stripe = getStripe();
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  if (!stripe || !user.stripeSubscriptionId) {
    return getBillingStatus(userId);
  }

  try {
    const sub: any = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    const priceId = sub.items?.data[0]?.price?.id;
    const derivedPlan = priceId ? planFromPriceId(priceId) : null;
    const isActive = sub.status === 'active' || sub.status === 'trialing';

    const update: Record<string, unknown> = {
      subscriptionStatus: sub.status,
      currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
      trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
    };

    if (derivedPlan) {
      update.plan = isActive ? derivedPlan : 'free';
    } else if (!isActive) {
      update.plan = 'free';
    }

    if (sub.status === 'canceled') {
      update.canceledAt = user.canceledAt ?? new Date();
    }

    await User.findByIdAndUpdate(userId, update);
  } catch {
    // Stripe fetch failed — return current local state without throwing
  }

  return getBillingStatus(userId);
}

export async function handleStripeWebhook(payload: Buffer, signature: string) {
  const stripe = getStripe();
  if (!stripe) throw new Error('Billing not configured');

  let event: any;

  if (config.stripeWebhookSecret) {
    event = stripe.webhooks.constructEvent(payload, signature, config.stripeWebhookSecret);
  } else {
    console.warn('[MindPad AI] Stripe webhook secret not set — skipping signature verification (dev only)');
    event = JSON.parse(payload.toString());
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const plan = (session.metadata?.plan as 'pro' | 'team') || 'pro';
      if (session.mode === 'subscription' && session.customer && session.subscription) {
        await User.findOneAndUpdate(
          { stripeCustomerId: String(session.customer) },
          {
            plan,
            stripeSubscriptionId: String(session.subscription),
            subscriptionStatus: 'active',
          }
        );
      }
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const priceId = sub.items?.data[0]?.price?.id;
      const derivedPlan = priceId ? planFromPriceId(priceId) : null;
      const isActive = sub.status === 'active' || sub.status === 'trialing';

      const update: Record<string, unknown> = {
        stripeSubscriptionId: sub.id,
        subscriptionStatus: sub.status,
        currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
        cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
        trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
      };

      if (derivedPlan) {
        update.plan = isActive ? derivedPlan : 'free';
      } else if (!isActive) {
        update.plan = 'free';
      }

      await User.findOneAndUpdate({ stripeCustomerId: String(sub.customer) }, update);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      await User.findOneAndUpdate(
        { stripeCustomerId: String(sub.customer) },
        {
          plan: 'free',
          subscriptionStatus: 'canceled',
          stripeSubscriptionId: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          canceledAt: new Date(),
        }
      );
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      if (invoice.subscription) {
        await User.findOneAndUpdate(
          { stripeSubscriptionId: String(invoice.subscription) },
          { subscriptionStatus: 'active' }
        );
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      if (invoice.subscription) {
        await User.findOneAndUpdate(
          { stripeSubscriptionId: String(invoice.subscription) },
          { subscriptionStatus: 'past_due' }
        );
      }
      break;
    }

    default:
      break;
  }

  return { received: true };
}
