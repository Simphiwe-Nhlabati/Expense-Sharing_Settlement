import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db";
import { users, SubscriptionTier } from "../db/schema";
import { eq } from "drizzle-orm";
import {
  getSubscriptionDetails,
  upgradeUserSubscription,
  cancelUserSubscription,
  getUserSubscriptionTier,
  getTierLimits,
} from "../services/subscription";
import { SUBSCRIPTION_TIERS } from "../db/schema";
import { createCheckoutSession, formatTierPrice, verifyWebhookSignature, verifyTransaction } from "../services/payment";
import { logAudit } from "../services/audit";
import { HonoEnv } from "../types";

const app = new Hono<HonoEnv>();

// Helper to get user email
async function getUserEmail(userId: string): Promise<string> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { email: true },
  });
  return user?.email || "";
}

// Schema for upgrading subscription
const upgradeSchema = z.object({
  tier: z.enum(["BRAAI", "HOUSEHOLD", "AGENT"]),
  paymentProviderSubscriptionId: z.string().optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

// GET /subscription - Get current subscription details
app.get("/", async (c) => {
  const userId = c.get("userId");

  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const details = await getSubscriptionDetails(userId);
  const currentTier = await getUserSubscriptionTier(userId);

  return c.json({
    ...details.subscription,
    availableTiers: Object.entries(SUBSCRIPTION_TIERS).map(([tier, limits]) => ({
      tier,
      ...limits,
      isCurrent: tier === currentTier,
    })),
  });
});

// POST /subscription/upgrade - Upgrade subscription tier
app.post("/upgrade", zValidator("json", upgradeSchema), async (c) => {
  const userId = c.get("userId");

  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { tier, paymentProviderSubscriptionId, successUrl, cancelUrl } = c.req.valid("json");
  const currentTier = await getUserSubscriptionTier(userId);

  if (tier === currentTier) {
    return c.json({ error: "Already on this tier", message: `You're already on the ${tier} tier` }, 400);
  }

  // If no paymentProviderSubscriptionId, create checkout session
  if (!paymentProviderSubscriptionId) {
    if (!successUrl || !cancelUrl) {
      return c.json(
        {
          error: "Missing URLs",
          message: "successUrl and cancelUrl are required for checkout",
        },
        400
      );
    }

    const userEmail = await getUserEmail(userId);
    
    if (!userEmail) {
      return c.json({ error: "User email required", message: "Please set your email before upgrading" }, 400);
    }

    const checkoutSession = await createCheckoutSession(userId, userEmail, tier, successUrl, cancelUrl);

    return c.json({
      success: true,
      message: "Checkout session created",
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.sessionId,
      reference: checkoutSession.reference,
      tier,
      price: formatTierPrice(tier),
    });
  }

  // Verify payment with Paystack if reference provided
  try {
    const verification = await verifyTransaction(paymentProviderSubscriptionId);
    
    if (!verification.paid) {
      return c.json({ error: "Payment not completed", message: "Transaction verification failed" }, 400);
    }

    // Check metadata for tier
    const paidTier = verification.metadata?.subscription_tier as SubscriptionTier | undefined;
    if (paidTier && paidTier !== tier) {
      return c.json({ error: "Tier mismatch", message: `Paid for ${paidTier} but requested ${tier}` }, 400);
    }
  } catch (error) {
    return c.json({ error: "Payment verification failed", message: error instanceof Error ? error.message : "Unknown error" }, 400);
  }

  const updated = await upgradeUserSubscription(userId, tier, paymentProviderSubscriptionId);

  await logAudit({
    userId,
    action: "UPGRADE_SUBSCRIPTION",
    entityType: "subscriptions",
    entityId: updated.id,
    metadata: {
      ip: c.req.header("x-forwarded-for"),
      userAgent: c.req.header("user-agent"),
      fromTier: currentTier,
      toTier: tier,
      paymentReference: paymentProviderSubscriptionId,
    },
    changes: { before: currentTier, after: tier },
  });

  const limits = getTierLimits(tier);

  return c.json(
    {
      success: true,
      message: `Successfully upgraded to ${tier.charAt(0) + tier.slice(1).toLowerCase()} tier!`,
      subscription: {
        ...updated,
        limits,
      },
    },
    200
  );
});

// POST /subscription/cancel - Cancel subscription (at period end)
app.post("/cancel", async (c) => {
  const userId = c.get("userId");

  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const currentTier = await getUserSubscriptionTier(userId);

  if (currentTier === "BRAAI") {
    return c.json({ error: "Cannot cancel free tier", message: "You're on the free Braai tier" }, 400);
  }

  const updated = await cancelUserSubscription(userId);

  await logAudit({
    userId,
    action: "CANCEL_SUBSCRIPTION",
    entityType: "subscriptions",
    entityId: updated.id,
    metadata: {
      ip: c.req.header("x-forwarded-for"),
      userAgent: c.req.header("user-agent"),
      tier: currentTier,
    },
    changes: { before: { cancelAtPeriodEnd: false }, after: { cancelAtPeriodEnd: true } },
  });

  return c.json(
    {
      success: true,
      message: `Your ${currentTier.charAt(0) + currentTier.slice(1).toLowerCase()} subscription will remain active until ${updated.currentPeriodEnd?.toISOString()}. You won't be charged after that date.`,
      subscription: updated,
    },
    200
  );
});

// POST /subscription/webhook - Paystack webhook handler
// Configure this URL in your Paystack dashboard: Settings > API Settings & Webhooks
app.post("/webhook", async (c) => {
  // IMPORTANT: Get raw body text BEFORE calling c.req.json()
  // Paystack signature is computed on the raw body string
  const rawBody = await c.req.text();
  
  // Verify Paystack webhook signature
  const signature = c.req.header("x-paystack-signature");
  
  if (!signature) {
    return c.json({ error: "Missing x-paystack-signature header" }, 400);
  }

  const isValid = await verifyWebhookSignature(rawBody, signature);
  if (!isValid) {
    return c.json({ error: "Invalid webhook signature" }, 401);
  }

  // Now parse the JSON body (after signature verification)
  const body = await c.req.json().catch(() => null);

  if (!body) {
    return c.json({ error: "Invalid webhook payload" }, 400);
  }

  // Paystack webhook events
  // https://paystack.com/docs/payments/webhooks/
  const eventType = body.event || "";
  const data = body.data || {};

  if (!eventType) {
    return c.json({ error: "Missing event type" }, 400);
  }

  try {
    const { processPaymentWebhook } = await import("../services/subscription");

    // Map Paystack events to subscription actions
    switch (eventType) {
      case "charge.success":
        // One-time payment successful
        if (data.metadata?.subscription_tier) {
          const userId = data.metadata.user_id;
          if (userId) {
            await upgradeUserSubscription(
              userId,
              data.metadata.subscription_tier,
              data.reference
            );
          }
        }
        break;

      case "subscription.create":
        await processPaymentWebhook("customer.subscription.created", data.subscription_code, "ACTIVE");
        break;

      case "subscription.update":
        await processPaymentWebhook("customer.subscription.updated", data.subscription_code, data.status);
        break;

      case "subscription.disable":
        await processPaymentWebhook("customer.subscription.deleted", data.subscription_code, "CANCELLED");
        break;

      case "invoice.overdue":
        await processPaymentWebhook("invoice.payment_failed", data.subscription_code, "PAST_DUE");
        break;
    }

    return c.json({
      success: true,
      message: "Webhook processed successfully",
      event: eventType,
    });
  } catch (error) {
    console.error("Webhook processing failed:", error);
    return c.json({ error: "Webhook processing failed", message: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});

// GET /subscription/tiers - List all available tiers
app.get("/tiers", async (c) => {
  const userId = c.get("userId");
  const currentTier = userId ? await getUserSubscriptionTier(userId) : null;

  const tiers = Object.entries(SUBSCRIPTION_TIERS).map(([tier, limits]) => ({
    tier,
    name: tier.charAt(0) + tier.slice(1).toLowerCase(),
    ...limits,
    isCurrent: tier === currentTier,
    popular: tier === "HOUSEHOLD",
  }));

  return c.json({ tiers });
});

export default app;
