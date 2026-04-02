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

      <section>
        <SkeletonCard count={2} />
      </section>

      <hr className="border-gray-100" />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SkeletonRow count={3} />
        </div>
        <div>
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}
