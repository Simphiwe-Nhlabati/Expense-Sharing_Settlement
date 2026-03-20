/**
 * Payment Provider Integration Service
 * 
 * NOTE: Payment integration is currently disabled (Coming Soon)
 * 
 * Future: Paystack, Peach Payments, or Stripe will be added
 * once compliance and business registration is complete.
 */

import { SubscriptionTier } from "../db/schema";

interface CheckoutSession {
  url: string;
  sessionId: string;
  reference: string;
}

interface SubscriptionStatus {
  status: string;
  currentPeriodEnd?: Date;
}

/**
 * Error thrown when payment features are accessed
 */
export class PaymentNotAvailableError extends Error {
  constructor(message = "Payment features are not available yet") {
    super(message);
    this.name = "PaymentNotAvailableError";
  }
}

/**
 * Get tier price in cents (ZAR)
 */
export function getTierPriceCents(tier: SubscriptionTier): number {
  const prices: Record<SubscriptionTier, number> = {
    BRAAI: 0,
    HOUSEHOLD: 4900, // R49.00
    AGENT: 29900, // R299.00
  };
  return prices[tier];
}

/**
 * Get tier price in ZAR (Rands)
 */
export function getTierPriceZar(tier: SubscriptionTier): number {
  return getTierPriceCents(tier) / 100;
}

/**
 * Get formatted tier price (e.g., "R49.00")
 */
export function formatTierPrice(tier: SubscriptionTier): string {
  const price = getTierPriceZar(tier);
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(price);
}

/**
 * Create a checkout session for subscription upgrade
 * 
 * NOTE: This is disabled until payment provider integration is complete
 */
export async function createCheckoutSession(
  _userId: string,
  _userEmail: string,
  _tier: SubscriptionTier,
  _successUrl: string
): Promise<CheckoutSession> {
  throw new PaymentNotAvailableError(
    "Subscription upgrades are not available yet. We're working on bringing you premium features soon!"
  );
}

/**
 * Verify payment webhook signature
 * 
 * NOTE: This is disabled until payment provider integration is complete
 */
export async function verifyWebhookSignature(_rawBody: string | Buffer, _signature: string): Promise<boolean> {
  throw new PaymentNotAvailableError(
    "Payment webhooks are not available yet"
  );
}

/**
 * Verify payment transaction reference
 * 
 * NOTE: This is disabled until payment provider integration is complete
 */
export async function verifyTransaction(_reference: string): Promise<{
  status: boolean;
  paid: boolean;
  amount: number;
  email: string;
  metadata: unknown;
}> {
  throw new PaymentNotAvailableError(
    "Payment verification is not available yet"
  );
}

/**
 * Get subscription status from payment provider
 * 
 * NOTE: This is disabled until payment provider integration is complete
 */
export async function getSubscriptionStatus(_subscriptionId: string): Promise<SubscriptionStatus> {
  throw new PaymentNotAvailableError(
    "Subscription status checks are not available yet"
  );
}
