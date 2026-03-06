"use client";

export default function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden bg-[var(--background-card)] border border-[var(--border)]">
      <div className="aspect-[3/4] shimmer" />
      <div className="p-3 space-y-2">
        <div className="h-4 shimmer rounded w-3/4" />
        <div className="h-3 shimmer rounded w-1/2" />
        <div className="flex gap-1">
          <div className="h-4 w-12 shimmer rounded" />
          <div className="h-4 w-14 shimmer rounded" />
        </div>
      </div>
    </div>
  );
}
