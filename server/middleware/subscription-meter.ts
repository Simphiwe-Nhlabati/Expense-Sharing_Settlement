import { createMiddleware } from "hono/factory";
import { canUserCreateGroup, canUserAddMemberToGroup, getUserSubscriptionTier, getTierLimits } from "../services/subscription";

/**
 * Subscription Tier Middleware
 * Checks if user's subscription allows them to perform the requested action
 * 
 * Usage:
 * - subscriptionMeter("CREATE_GROUP") - checks if user can create a new group
 * - subscriptionMeter("ADD_MEMBER") - checks if user can add members to a group
 * - subscriptionMeter("FEATURE", "pdf_export") - checks if user has access to a specific feature
 */
export const subscriptionMeter = (action: "CREATE_GROUP" | "ADD_MEMBER" | "FEATURE", featureName?: string) =>
  createMiddleware(async (c, next) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized", message: "User ID not found in context" }, 401);
    }

    switch (action) {
      case "CREATE_GROUP": {
        const result = await canUserCreateGroup(userId);

        if (!result.allowed) {
          return c.json(
            {
              error: "Subscription limit reached",
              message: result.reason,
              currentCount: result.currentCount,
              maxAllowed: result.maxAllowed,
              upgradeRequired: true,
            },
            403
          );
        }

        // Store in context for later use
        c.set("subscriptionGroupCount", result.currentCount);
        c.set("subscriptionGroupLimit", result.maxAllowed);

        break;
      }

      case "ADD_MEMBER": {
        const groupId = c.req.param("id") || c.req.query("groupId") || c.req.json?.().then((b) => b.groupId).catch(() => null);

        if (!groupId) {
          // If we can't determine the group, skip the check (let group-auth handle it)
          await next();
          return;
        }

        const result = await canUserAddMemberToGroup(groupId.toString(), userId);

        if (!result.allowed) {
          return c.json(
            {
              error: "Subscription limit reached",
              message: result.reason,
              currentCount: result.currentCount,
              maxAllowed: result.maxAllowed,
              upgradeRequired: true,
            },
            403
          );
        }

        break;
      }

      case "FEATURE": {
        if (!featureName) {
          return c.json({ error: "Internal error", message: "Feature name required" }, 500);
        }

        const tier = await getUserSubscriptionTier(userId);
        const limits = getTierLimits(tier);

        if (!limits.features.includes(featureName)) {
          return c.json(
            {
              error: "Feature not available",
              message: `The "${featureName}" feature is not available in your ${tier.charAt(0) + tier.slice(1).toLowerCase()} tier.`,
              currentTier: tier,
              requiredFeature: featureName,
              upgradeRequired: true,
            },
            403
          );
        }

        break;
      }
    }

    await next();
  });

/**
 * Attach subscription context to all authenticated requests
 * Makes tier info available in responses and for frontend display
 */
export const attachSubscriptionContext = () =>
  createMiddleware(async (c, next) => {
    const userId = c.get("userId");

    if (!userId) {
      await next();
      return;
    }

    const tier = await getUserSubscriptionTier(userId);
    const limits = getTierLimits(tier);

    c.set("subscriptionTier", tier);
    c.set("subscriptionLimits", limits);

    await next();
  });
