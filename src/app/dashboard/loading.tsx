import { Skeleton } from "@/components/ui/skeleton";

/** Shown while a dashboard screen loads its workspace data. */
export default function DashboardLoading() {
  return (
    <div role="status" aria-label="Loading" className="w-full">
      <div className="page-header flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2.5">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="mt-6 overflow-hidden rounded-lg border border-border bg-card">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-border px-4 py-3.5 last:border-b-0"
          >
            <Skeleton className="size-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5" style={{ width: `${55 - i * 5}%` }} />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="hidden h-6 w-20 rounded-full sm:block" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
