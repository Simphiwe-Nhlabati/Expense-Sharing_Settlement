import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import {
  getSubscriptionDetails,
  getUserSubscriptionTier,
} from "../services/subscription";
import { SUBSCRIPTION_TIERS } from "../db/schema";
import { HonoEnv } from "../types";

const app = new Hono<HonoEnv>();

// Error message for coming soon
const COMING_SOON_ERROR = {
  error: "Coming Soon",
  message: "Subscription upgrades are not available yet. We're working on bringing you premium features soon!",
};

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

// POST /subscription/upgrade - Upgrade subscription tier (Coming Soon)
app.post("/upgrade", zValidator("json", z.object({
  tier: z.enum(["BRAAI", "HOUSEHOLD", "AGENT"]),
  paymentProviderSubscriptionId: z.string().optional(),
  successUrl: z.string().url().optional(),
})), async (c) => {
  return c.json(COMING_SOON_ERROR, 503);
});

// POST /subscription/cancel - Cancel subscription (Coming Soon)
app.post("/cancel", async (c) => {
  const userId = c.get("userId");

  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const currentTier = await getUserSubscriptionTier(userId);

  if (currentTier === "BRAAI") {
    return c.json({ 
      success: true,
      message: "You're on the free Braai tier. No cancellation needed.",
    });
  }

  // Return coming soon error for paid tiers
  return c.json(COMING_SOON_ERROR, 503);
});

// POST /subscription/webhook - Webhook handler (Disabled - Coming Soon)
app.post("/webhook", async (c) => {
  return c.json(COMING_SOON_ERROR, 503);
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
