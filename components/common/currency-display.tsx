import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

interface CurrencyDisplayProps {
  amount: number; // in cents
  label?: string;
  variant?: "default" | "large" | "small";
  type?: "balance" | "debt" | "credit"; // determines color
  className?: string;
  showLabel?: boolean;
}

export function CurrencyDisplay({
  amount,
  label,
  variant = "default",
  type = "balance",
  className,
  showLabel = true,
}: CurrencyDisplayProps) {
  const sizeClasses = {
    small: "text-lg",
    default: "text-2xl",
    large: "text-4xl",
  };

  const typeClasses = {
    balance: "text-foreground",
    debt: "text-red-500 dark:text-red-400",
    credit: "text-emerald-500 dark:text-emerald-400",
  };

  const typeLabels = {
    balance: "Balance",
    debt: "You Owe",
    credit: "Owed to You",
  };

  return (
    <div className={className}>
      {showLabel && (
        <p className="label-mono mb-1 text-muted-foreground">
          {label || typeLabels[type]}
        </p>
      )}
      <p className={cn("font-bold currency", sizeClasses[variant], typeClasses[type])}>
        {formatCurrency(amount)}
      </p>
    </div>
  );
}
