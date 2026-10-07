import React from "react";
import { cn } from "@/lib/utils";

/** Pink-tinted shimmer block. */
export const Shimmer: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <div aria-hidden className={cn("skeleton-pink rounded-lg", className)} style={style} />
);

/** Skeleton shaped like a campaign / list card. */
export const CardSkeleton: React.FC<{ lines?: number; className?: string }> = ({ lines = 3, className }) => (
  <div className={cn("bg-card rounded-[18px] border border-border p-4 flex flex-col gap-2.5", className)}>
    <Shimmer className="h-3 w-1/3" />
    <Shimmer className="h-4 w-3/4" />
    {Array.from({ length: Math.max(0, lines - 2) }).map((_, i) => (
      <Shimmer key={i} className="h-3 w-full" />
    ))}
  </div>
);

export const ListSkeleton: React.FC<{ count?: number; lines?: number }> = ({ count = 3, lines }) => (
  <>
    {Array.from({ length: count }).map((_, i) => <CardSkeleton key={i} lines={lines} />)}
  </>
);
