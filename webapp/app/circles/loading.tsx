import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonRow } from '@/components/ui/SkeletonCard'

export default function CirclesLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-32 rounded" />
        <Skeleton className="mt-1 h-4 w-72 rounded" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SkeletonRow count={3} />
        </div>
        <div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
