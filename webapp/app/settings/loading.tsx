import { Skeleton } from '@/components/ui/skeleton'

export default function SettingsLoading() {
  return (
    <>
      <div className="mb-6">
        <Skeleton className="h-8 w-24 rounded" />
        <Skeleton className="mt-1 h-4 w-64 rounded" />
      </div>
      <div className="space-y-4 rounded-xl border bg-white p-6 shadow-sm">
        <Skeleton className="h-5 w-36 rounded" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-5 w-36 rounded" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>
    </>
  )
}
