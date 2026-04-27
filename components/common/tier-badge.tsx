import { cn } from "@/lib/utils";

type SubscriptionTier = "BRAAI" | "HOUSEHOLD" | "AGENT";

interface TierBadgeProps {
  tier: SubscriptionTier;
  showLabel?: boolean;
  className?: string;
}

const tierConfig: Record<SubscriptionTier, { border: string; text: string; label: string; comingSoon?: boolean }> = {
  BRAAI: {
    border: "border-accent/40",
    text:   "text-accent",
    label:  "Free",
  },
  HOUSEHOLD: {
    border: "border-blue-500/30",
    text:   "text-blue-500",
    label:  "Household (Coming Soon)",
    comingSoon: true,
  },
  AGENT: {
    border: "border-orange-500/30",
    text:   "text-orange-500",
    label:  "Agent (Coming Soon)",
    comingSoon: true,
  },
};

export function TierBadge({ tier, showLabel = true, className }: TierBadgeProps) {
  const config = tierConfig[tier];
  return (
    <div
      className={cn(
        "inline-flex items-center px-2.5 py-1 border label-mono",
        config.border,
        config.text,
        className
      )}
    >
      {showLabel ? config.label : tier}
    </div>
  );
}
