import { cn } from "@/lib/utils";
import { formatCurrency, formatDateZA } from "@/lib/utils";

interface TransactionRowProps {
  id: string;
  date: Date | string;
  type: "expense" | "settlement";
  direction: "paid" | "received" | "settled";
  amount: number;
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

  return (
    <div
      onClick={() => onSelect?.(id)}
      className={cn(
        "flex items-center justify-between p-4 border-b border-border/60 hover:bg-secondary/40 transition-colors cursor-pointer",
        "accent-line",
        isDebit ? "accent-line-debt" : "accent-line-credit"
      )}
    >
      <div className="flex-1 space-y-0.5 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{description}</p>
          <span className="label-mono text-muted-foreground flex-shrink-0">
            {type === "expense" ? "Expense" : "Settlement"}
          </span>
        </div>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span>{otherParty}</span>
          <span>·</span>
          <span>{group}</span>
          <span>·</span>
          <span>{formatDateZA(date)}</span>
        </div>
      </div>

      <p
        className={cn(
          "currency font-bold text-base flex-shrink-0 ml-4",
          isDebit ? "text-red-500 dark:text-red-400" : "text-emerald-500 dark:text-emerald-400"
        )}
      >
        {isDebit ? "−" : "+"}{formatCurrency(amount)}
      </p>
    </div>
  );
}
