import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
  count?: number;
}

export function SkeletonCard({ className, count = 1 }: SkeletonCardProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "rounded-2xl bg-muted overflow-hidden animate-shimmer",
            className || "h-32 w-full"
          )}
        />
      ))}
    </>
  );
}
