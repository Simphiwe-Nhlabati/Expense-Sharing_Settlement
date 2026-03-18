/**
 * Payment Provider Integration Service
 * Currently supports: Paystack (South Africa)
 * 
 * Future: Peach Payments and Stripe will be added
 * 
 * Configure via PAYSTACK_* environment variables
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
 * Create a checkout session for subscription upgrade using Paystack
 */
export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  tier: SubscriptionTier,
  successUrl: string
): Promise<CheckoutSession> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    throw new Error("PAYSTACK_SECRET_KEY not configured");
  }

  const amount = getTierPriceCents(tier);
  const reference = `zar_ledger_${userId}_${Date.now()}`;

  try {
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: userEmail,
        amount,
        reference,
        callback: successUrl,
        metadata: {
          user_id: userId,
          tier,
          custom_fields: [
            {
              display_name: "Subscription Tier",
              variable_name: "subscription_tier",
              value: tier,
            },
          ],
        },
      }),
    });

    const data = await response.json();

    if (!data.status) {
      throw new Error(data.message || "Failed to initialize Paystack transaction");
    }

    return {
      url: data.data.authorization_url,
      sessionId: data.data.reference,
      reference: data.data.reference,
    };
  } catch (error) {
    console.error("Paystack checkout initialization failed:", error);
    throw new Error("Failed to create checkout session");
  }
}

/**
 * Verify Paystack webhook signature
 * Paystack uses your Secret Key to hash the request body
 * 
 * @param rawBody - The raw request body (string or Buffer) - MUST be the raw body before JSON parsing
 * @param signature - The signature from x-paystack-signature header
 * @returns true if signature matches
 */
export async function verifyWebhookSignature(rawBody: string | Buffer, signature: string): Promise<boolean> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    throw new Error("PAYSTACK_SECRET_KEY not configured");
  }

  try {
    // Convert to string if Buffer
    const bodyString = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf-8');
    
    // Hash the raw body using Secret Key
    const hash = await crypto.subtle.digest(
      "SHA-512",
      new TextEncoder().encode(bodyString + secretKey)
    );
    const computedSignature = Buffer.from(hash).toString("hex");
    
    return computedSignature === signature;
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return false;
  }
}

/**
 * Verify Paystack transaction reference
 */
export async function verifyTransaction(reference: string): Promise<{
  status: boolean;
  paid: boolean;
  amount: number;
  email: string;
  metadata: unknown;
}> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    throw new Error("PAYSTACK_SECRET_KEY not configured");
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!data.status) {
      throw new Error(data.message || "Failed to verify transaction");
    }

    return {
      status: data.data.status === "success",
      paid: data.data.status === "success",
      amount: data.data.amount,
      email: data.data.customer.email,
      metadata: data.data.metadata,
    };
  } catch (error) {
    console.error("Paystack transaction verification failed:", error);
    throw new Error("Failed to verify transaction");
  }
}

/**
 * Get subscription status from Paystack (for recurring subscriptions)
 * Note: Paystack uses charges for one-time payments
 * For subscriptions, you would use Paystack's Subscription API
 */
export async function getSubscriptionStatus(subscriptionId: string): Promise<SubscriptionStatus> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    throw new Error("PAYSTACK_SECRET_KEY not configured");
  }

  try {
    const response = await fetch(`https://api.paystack.co/subscription/${subscriptionId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!data.status) {
      throw new Error(data.message || "Failed to fetch subscription");
    }

    return {
      status: data.data.status,
      currentPeriodEnd: data.data.next_payment_date ? new Date(data.data.next_payment_date) : undefined,
    };
  } catch (error) {
    console.error("Paystack subscription status fetch failed:", error);
    throw new Error("Failed to fetch subscription status");
  }
}
