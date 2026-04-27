import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center border border-dashed border-border/60 px-6 py-16 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center border border-border/60 text-muted-foreground">
          <div className="h-5 w-5">{icon}</div>
        </div>
      )}
      <p className="label-mono text-muted-foreground mb-2">{title}</p>
      {description && (
        <p className="mb-6 max-w-sm text-sm text-muted-foreground leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
