import Stripe from 'stripe';
import config from '../config';
import { logger } from '../shared/logger';

const isStripeConfigured = !!config.stripe.stripe_secret_key;

const client = isStripeConfigured
  ? new Stripe(config.stripe.stripe_secret_key as string)
  : null;

export type ChargeResult = {
  // Client hasn't provided Stripe credentials yet — dev mode marks the
  // charge as immediately "succeeded" so the Virtual Card flow can be
  // built/tested end-to-end. Once STRIPE_SECRET_KEY is set, isStripeConfigured
  // flips true and this switches to a real PaymentIntent automatically.
  status: 'succeeded' | 'requires_action';
  paymentIntentId: string;
  clientSecret?: string;
};

// amount is in whole currency units (e.g. USD), not cents.
const chargeForLoad = async (
  amountUsd: number,
  metadata: Record<string, string>
): Promise<ChargeResult> => {
  if (!client) {
    logger.info(
      `[DEV STRIPE] Charging $${amountUsd} (no real payment taken) — metadata: ${JSON.stringify(
        metadata
      )}`
    );
    return {
      status: 'succeeded',
      paymentIntentId: `dev_${Date.now()}`,
    };
  }

  const paymentIntent = await client.paymentIntents.create({
    amount: Math.round(amountUsd * 100),
    currency: 'usd',
    metadata,
    automatic_payment_methods: { enabled: true },
    confirm: false,
  });

  return {
    status:
      paymentIntent.status === 'succeeded' ? 'succeeded' : 'requires_action',
    paymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret ?? undefined,
  };
};

const refund = async (paymentIntentId: string, amountUsd: number) => {
  if (!client || paymentIntentId.startsWith('dev_')) {
    logger.info(
      `[DEV STRIPE] Refunding $${amountUsd} for ${paymentIntentId} (no real refund issued)`
    );
    return;
  }

  await client.refunds.create({
    payment_intent: paymentIntentId,
    amount: Math.round(amountUsd * 100),
  });
};

export const stripeHelper = {
  isStripeConfigured,
  chargeForLoad,
  refund,
};
