import { cn } from "@/lib/utils";
import { formatCurrency, formatDateZA } from "@/lib/utils";

interface TransactionRowProps {
  id: string;
  date: Date | string;
  type: "expense" | "settlement";
  direction: "paid" | "received" | "settled";
  amount: number; // in cents
  description: string;
  otherParty: string;
  group: string;
  onSelect?: (id: string) => void;
}

export function TransactionRow({
  id,
  date,
  type,
  direction,
  amount,
  description,
  otherParty,
  group,
  onSelect,
}: TransactionRowProps) {
  const isDebit = direction === "paid";
  const isSentiment = isDebit ? "debt" : "credit";

  return (
    <div
      onClick={() => onSelect?.(id)}
      className={cn(
        "flex items-center justify-between rounded-lg border border-border/50 p-4 transition-all duration-200 hover:bg-muted/50 cursor-pointer",
        "accent-line",
        isSentiment === "debt" && "accent-line-debt",
        isSentiment === "credit" && "accent-line-credit"
      )}
    >
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground">{description}</p>
          <span className="label-mono text-muted-foreground text-xs">
            {type === "expense" ? "Expense" : "Settlement"}
          </span>
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{otherParty}</span>
          <span>•</span>
          <span>{group}</span>
          <span>•</span>
          <span>{formatDateZA(date)}</span>
        </div>
      </div>

      <div className="text-right">
        <p
          className={cn(
            "currency font-bold text-lg",
            isDebit
              ? "text-red-500 dark:text-red-400"
              : "text-emerald-500 dark:text-emerald-400"
          )}
        >
          {isDebit ? "−" : "+"}{formatCurrency(amount)}
        </p>
      </div>
    </div>
  );
}
