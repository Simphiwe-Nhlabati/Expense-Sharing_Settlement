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
  const amountColor = {
    primary: "text-white",
    debt:    "text-red-300",
    credit:  "text-emerald-300",
    neutral: "text-white",
  }[colorScheme];

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-white/5 hover:bg-white/8 transition-colors p-5 md:p-6",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="label-mono text-white/40">{label}</span>
        {icon && <span className="text-white/30 h-4 w-4">{icon}</span>}
      </div>

      <p className={cn("currency text-2xl md:text-3xl font-bold mb-1", amountColor)}>
        {typeof amount === "number" ? amount.toLocaleString("en-ZA") : amount}
      </p>

      {description && (
        <p className="text-xs text-white/30">{description}</p>
      )}

      {trend && (
        <div className="mt-2">
          {trend === "up"      && <span className="text-xs text-emerald-300">↑ Increasing</span>}
          {trend === "down"    && <span className="text-xs text-red-300">↓ Decreasing</span>}
          {trend === "neutral" && <span className="text-xs text-white/40">→ Stable</span>}
        </div>
      )}
    </div>
  );
}
