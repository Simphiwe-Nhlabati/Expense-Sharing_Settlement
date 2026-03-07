import { SubscriptionTier } from "./db/schema";

export type Variables = {
  requestId: string;
  authId: string;
  userId: string;
  userEmail?: string;
  sanitizedBody: Record<string, unknown>;
  subscriptionTier?: SubscriptionTier;
  subscriptionLimits?: {
    maxGroups: number;
    maxMembersPerGroup: number;
    historyDays: number;
    features: string[];
    priceZar: number;
  };
  subscriptionGroupCount?: number;
  subscriptionGroupLimit?: number;
};

export type HonoEnv = {
  Variables: Variables;
};
