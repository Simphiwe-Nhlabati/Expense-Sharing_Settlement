import { db } from "../db";
import { subscriptions, groupMembers, groups, SubscriptionTier, SUBSCRIPTION_TIERS } from "../db/schema";
import { eq, and, count } from "drizzle-orm";

/**
 * Get or create a user's subscription
 * Defaults to BRAAI tier if no subscription exists
 */
export async function getOrCreateUserSubscription(userId: string) {
  const existing = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  });

  if (existing) {
    return existing;
  }

  // Create default BRAAI tier subscription
  const [newSubscription] = await db.insert(subscriptions).values({
    userId,
    tier: "BRAAI",
    status: "ACTIVE",
  }).returning();

  return newSubscription;
}

/**
 * Get user's current subscription tier
 */
export async function getUserSubscriptionTier(userId: string): Promise<SubscriptionTier> {
  const subscription = await getOrCreateUserSubscription(userId);
  return subscription.tier as SubscriptionTier;
}

/**
 * Get tier limits and features for a given tier
 */
export function getTierLimits(tier: SubscriptionTier) {
  return SUBSCRIPTION_TIERS[tier];
}

/**
 * Check if user has a specific feature based on their tier
 */
export async function userHasFeature(userId: string, feature: string): Promise<boolean> {
  const tier = await getUserSubscriptionTier(userId);
  const limits = getTierLimits(tier);
  return limits.features.includes(feature);
}

/**
 * Count active groups for a user
 */
export async function countUserGroups(userId: string): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(groupMembers)
    .innerJoin(groups, eq(groups.id, groupMembers.groupId))
    .where(and(
      eq(groupMembers.userId, userId),
      eq(groups.deletedAt, null)
    ));

  return result[0]?.count ?? 0;
}

/**
 * Check if user can create a new group based on their tier limits
 */
export async function canUserCreateGroup(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  currentCount: number;
  maxAllowed: number;
}> {
  const tier = await getUserSubscriptionTier(userId);
  const limits = getTierLimits(tier);
  const currentCount = await countUserGroups(userId);

  // -1 means unlimited
  if (limits.maxGroups === -1) {
    return { allowed: true, currentCount, maxAllowed: -1 };
  }

  if (currentCount >= limits.maxGroups) {
    return {
      allowed: false,
      reason: `You've reached your ${currentCount}-group limit on the ${tier.charAt(0) + tier.slice(1).toLowerCase()} Tier. Upgrade to unlock more groups.`,
      currentCount,
      maxAllowed: limits.maxGroups,
    };
  }

  return { allowed: true, currentCount, maxAllowed: limits.maxGroups };
}

/**
 * Check if group can have more members based on tier limits
 */
export async function canUserAddMemberToGroup(groupId: string, userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  currentCount: number;
  maxAllowed: number;
}> {
  const tier = await getUserSubscriptionTier(userId);
  const limits = getTierLimits(tier);

  const result = await db
    .select({ count: count() })
    .from(groupMembers)
    .where(eq(groupMembers.groupId, groupId));

  const currentCount = result[0]?.count ?? 0;

  if (limits.maxMembersPerGroup === -1) {
    return { allowed: true, currentCount, maxAllowed: -1 };
  }

  if (currentCount >= limits.maxMembersPerGroup) {
    return {
      allowed: false,
      reason: `This group has reached the ${limits.maxMembersPerGroup}-member limit for your ${tier.charAt(0) + tier.slice(1).toLowerCase()} Tier.`,
      currentCount,
      maxAllowed: limits.maxMembersPerGroup,
    };
  }

  return { allowed: true, currentCount, maxAllowed: limits.maxMembersPerGroup };
}

/**
 * Check if user can access historical data beyond the tier limit
 */
export async function getHistoryCutoffDate(userId: string): Promise<Date | null> {
  const tier = await getUserSubscriptionTier(userId);
  const limits = getTierLimits(tier);

  // -1 means lifetime history
  if (limits.historyDays === -1) {
    return null;
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - limits.historyDays);
  return cutoffDate;
}

/**
 * Upgrade user's subscription tier
 */
export async function upgradeUserSubscription(
  userId: string,
  newTier: SubscriptionTier,
  paymentProviderSubscriptionId?: string
) {
  await getOrCreateUserSubscription(userId);

  const [updated] = await db.update(subscriptions)
    .set({
      tier: newTier,
      status: "ACTIVE",
      stripeSubscriptionId: paymentProviderSubscriptionId,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.userId, userId))
    .returning();

  return updated;
}

/**
 * Cancel user's subscription (at period end)
 */
export async function cancelUserSubscription(userId: string) {
  await getOrCreateUserSubscription(userId);

  const [updated] = await db.update(subscriptions)
    .set({
      cancelAtPeriodEnd: true,
      status: existing.status === "ACTIVE" ? "ACTIVE" : existing.status,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.userId, userId))
    .returning();

  return updated;
}

/**
 * Process webhook event from payment provider
 * Updates subscription status based on payment events
 */
export async function processPaymentWebhook(
  eventType: string,
  subscriptionId: string,
  status: string,
  endDate?: Date
) {
  const existing = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.stripeSubscriptionId, subscriptionId),
  });

  if (!existing) {
    throw new Error(`Subscription not found: ${subscriptionId}`);
  }

  let newStatus: string = existing.status;
  const cancelAtPeriodEnd = existing.cancelAtPeriodEnd;

  switch (eventType) {
    case "customer.subscription.created":
      newStatus = "ACTIVE";
      break;
    case "customer.subscription.updated":
      newStatus = status.toUpperCase();
      break;
    case "customer.subscription.deleted":
      newStatus = "CANCELLED";
      break;
    case "invoice.payment_failed":
      newStatus = "PAST_DUE";
      break;
    case "invoice.payment_succeeded":
      newStatus = "ACTIVE";
      break;
  }

  const [updated] = await db.update(subscriptions)
    .set({
      status: newStatus,
      cancelAtPeriodEnd,
      currentPeriodEnd: endDate,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, subscriptionId))
    .returning();

  return updated;
}

/**
 * Get subscription details with user info
 */
export async function getSubscriptionDetails(userId: string) {
  const subscription = await getOrCreateUserSubscription(userId);
  const tierLimits = getTierLimits(subscription.tier as SubscriptionTier);

  return {
    subscription: {
      ...subscription,
      limits: tierLimits,
    },
  };
}
