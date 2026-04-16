import { SkeletonCard, SkeletonRow } from '@/components/ui/SkeletonCard'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40 rounded" />
          <Skeleton className="h-4 w-32 rounded" />
        </div>
        <Skeleton className="mt-1 h-4 w-48 rounded" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] lg:items-start gap-6">
        <section>
          <SkeletonRow count={3} />
        </section>

        <div className="space-y-6">
          <section>
            <SkeletonCard count={3} />
          </section>
          <section>
            <SkeletonCard count={2} />
          </section>
        </div>
      </div>
    </div>
  )
}
