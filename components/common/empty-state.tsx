import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <div className="h-8 w-8 text-primary/60">{icon}</div>
        </div>
      )}

      <h3 className="heading-subsection mb-2 text-foreground">{title}</h3>

      {description && (
        <p className="mb-6 max-w-sm text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}

      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
