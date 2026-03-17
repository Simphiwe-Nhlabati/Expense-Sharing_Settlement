import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  amount: number | string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  description?: string;
  className?: string;
  colorScheme?: "primary" | "debt" | "credit" | "neutral";
}

export function StatCard({
  label,
  amount,
  icon,
  trend,
  description,
  className,
  colorScheme = "primary",
}: StatCardProps) {
  const colorClasses = {
    primary: "bg-white/10 hover:bg-white/15",
    debt: "bg-red-500/10 hover:bg-red-500/15",
    credit: "bg-emerald-500/10 hover:bg-emerald-500/15",
    neutral: "bg-slate-500/10 hover:bg-slate-500/15",
  };

  const amountColorClasses = {
    primary: "text-white",
    debt: "text-red-200",
    credit: "text-emerald-300",
    neutral: "text-white",
  };

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 backdrop-blur-sm",
        colorClasses[colorScheme],
        className
      )}
    >
      <div className="relative z-10 space-y-3">
        {/* Header with icon and label */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white/80">{label}</span>
          {icon && <div className="h-5 w-5 text-white/70">{icon}</div>}
        </div>

        {/* Amount */}
        <div>
          <p className={cn("text-3xl font-bold currency", amountColorClasses[colorScheme])}>
            {typeof amount === "number" ? amount.toLocaleString("en-ZA") : amount}
          </p>
        </div>

        {/* Description */}
        {description && (
          <p className="text-xs text-white/60 pt-1">{description}</p>
        )}

        {/* Trend indicator */}
        {trend && (
          <div className="pt-2">
            {trend === "up" && (
              <span className="text-xs font-medium text-emerald-300">↑ Increasing</span>
            )}
            {trend === "down" && (
              <span className="text-xs font-medium text-red-300">↓ Decreasing</span>
            )}
            {trend === "neutral" && (
              <span className="text-xs font-medium text-slate-300">→ Stable</span>
            )}
          </div>
        )}
      </div>

      {/* Background accent */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5 blur-2xl group-hover:bg-white/10 transition-colors" />
    </div>
  );
}
