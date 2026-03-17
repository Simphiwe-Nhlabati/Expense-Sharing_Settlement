import { cn } from "@/lib/utils";

type SubscriptionTier = "BRAAI" | "HOUSEHOLD" | "AGENT";

interface TierBadgeProps {
  tier: SubscriptionTier;
  showLabel?: boolean;
  className?: string;
}

const tierConfig: Record<SubscriptionTier, { bg: string; text: string; label: string }> = {
  BRAAI: {
    bg: "bg-yellow-500/20 border-yellow-500/30",
    text: "text-yellow-700 dark:text-yellow-400",
    label: "Braai (Free)",
  },
  HOUSEHOLD: {
    bg: "bg-blue-500/20 border-blue-500/30",
    text: "text-blue-700 dark:text-blue-400",
    label: "Household",
  },
  AGENT: {
    bg: "bg-purple-500/20 border-purple-500/30",
    text: "text-purple-700 dark:text-purple-400",
    label: "Agent",
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
