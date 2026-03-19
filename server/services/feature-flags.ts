import { userHasFeature } from "../services/subscription";
import { SubscriptionTier, SUBSCRIPTION_TIERS } from "../db/schema";

/**
 * Feature flags for subscription tiers
 * Use these to gate features in your routes
 */

/**
 * Check if user can export to PDF
 */
export async function canUserExportPdf(userId: string): Promise<boolean> {
  return userHasFeature(userId, "pdf_export");
}

/**
 * Check if user can export to CSV/Xero
 */
export async function canUserExportCsv(userId: string): Promise<boolean> {
  return userHasFeature(userId, "csv_xero_export");
}

/**
 * Check if user can create recurring expenses
 */
export async function canUserCreateRecurringExpenses(userId: string): Promise<boolean> {
  return userHasFeature(userId, "recurring_expenses");
}

/**
 * Check if user has access to white-labeling
 */
export async function canUserWhiteLabel(userId: string): Promise<boolean> {
  return userHasFeature(userId, "white_labeling");
}

/**
 * Check if user has access to settlement reminders
 */
export async function canUserSettlementReminders(userId: string): Promise<boolean> {
  return userHasFeature(userId, "settlement_reminders");
}

/**
 * Check if user has priority support
 */
export async function canUserPrioritySupport(userId: string): Promise<boolean> {
  return userHasFeature(userId, "priority_support");
}

/**
 * Get user's tier badge for UI display
 */
export function getTierBadge(tier: SubscriptionTier): string {
  switch (tier) {
    case "BRAAI":
      return "Free";
    case "HOUSEHOLD":
      return "Pro";
    case "AGENT":
      return "Business";
    default:
      return "Free";
  }
}

/**
 * Get upgrade recommendation based on usage patterns
 */
export function getUpgradeRecommendation(
  currentTier: SubscriptionTier,
  groupCount: number,
  needsFeature?: string
): { shouldUpgrade: boolean; recommendedTier?: SubscriptionTier; reason?: string } {
  const limits = SUBSCRIPTION_TIERS[currentTier];

  // Check if approaching group limit
  if (limits.maxGroups !== -1 && groupCount >= limits.maxGroups * 0.8) {
    return {
      shouldUpgrade: true,
      recommendedTier: "HOUSEHOLD",
      reason: `You're using ${groupCount}/${limits.maxGroups} groups. Upgrade to unlock unlimited groups.`,
    };
  }

  // Check if specific feature is needed
  if (needsFeature && !limits.features.includes(needsFeature)) {
    const householdLimits = SUBSCRIPTION_TIERS.HOUSEHOLD;
    const agentLimits = SUBSCRIPTION_TIERS.AGENT;
    
    const targetTier = householdLimits.features.includes(needsFeature)
      ? "HOUSEHOLD"
      : agentLimits.features.includes(needsFeature)
        ? "AGENT"
        : currentTier;

    return {
      shouldUpgrade: true,
      recommendedTier: targetTier,
      reason: `Upgrade to access ${needsFeature.replace("_", " ")} feature.`,
    };
  }

  return { shouldUpgrade: false };
}
