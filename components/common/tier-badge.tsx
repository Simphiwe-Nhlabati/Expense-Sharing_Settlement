import { cn } from "@/lib/utils";

type SubscriptionTier = "BRAAI" | "HOUSEHOLD" | "AGENT";

interface TierBadgeProps {
  tier: SubscriptionTier;
  showLabel?: boolean;
  className?: string;
}

const tierConfig: Record<SubscriptionTier, { bg: string; text: string; label: string; comingSoon?: boolean }> = {
  BRAAI: {
    bg: "bg-green-500/20 border-green-500/30",
    text: "text-green-700 dark:text-green-400",
    label: "Free",
  },
  HOUSEHOLD: {
    bg: "bg-blue-500/20 border-blue-500/30",
    text: "text-blue-700 dark:text-blue-400",
    label: "Household (Coming Soon)",
    comingSoon: true,
  },
  AGENT: {
    bg: "bg-purple-500/20 border-purple-500/30",
    text: "text-purple-700 dark:text-purple-400",
    label: "Agent (Coming Soon)",
    comingSoon: true,
  },
};

export function TierBadge({
  tier,
  showLabel = true,
  className,
}: TierBadgeProps) {
  const config = tierConfig[tier];

  return (
    <div
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold",
        config.bg,
        config.text,
        className
      )}
    >
      {showLabel ? config.label : tier}
    </div>
  );
}
