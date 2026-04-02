import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import ScanLogSection from '@/components/ScanLogSection'
import KeywordSection from '@/components/KeywordSection'
import NotificationStatus from '@/components/NotificationStatus'
import DashboardStats from '@/components/DashboardStats'
import { SkeletonCard, SkeletonRow } from '@/components/ui/SkeletonCard'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">監控儀表板</h1>
          {/* Dashboard shows last scan time — streamed independently */}
          <Suspense fallback={
            <span className="h-4 w-32 animate-pulse rounded bg-gray-200 inline-block" />
          }>
            <ScanLogSection />
          </Suspense>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          管理你的關鍵字，即時掌握新品上架
        </p>
      </div>

      {/* Stats block */}
      <section>
        <Suspense fallback={<SkeletonCard count={2} />}>
          <DashboardStats userId={userId} />
        </Suspense>
      </section>

      <hr className="border-gray-100" />

      {/* Dashboard warns user when no notification method is configured */}
      <Suspense fallback={null}>
        <NotificationStatus userId={userId} />
      </Suspense>

      {/* KeywordSection fetches keywords, KeywordClientSection handles grid + state */}
      <section>
        <Suspense fallback={<KeywordSectionSkeleton />}>
          <KeywordSection userId={userId} />
        </Suspense>
      </section>
    </div>
  )
}

function KeywordSectionSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <SkeletonRow count={3} />
      </div>
      <div>
        <div className="h-96 w-full animate-pulse rounded-xl bg-gray-100" />
      </div>
    </div>
  )
}
