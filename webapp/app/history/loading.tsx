import { Skeleton } from '@/components/ui/skeleton'

export default function HistoryLoading() {
  return (
    <>
      <div className="mb-6">
        <Skeleton className="h-8 w-28 rounded" />
        <Skeleton className="mt-1 h-4 w-48 rounded" />
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <Skeleton className="h-40 w-full rounded-none" />
            <div className="p-3 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
