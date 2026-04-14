import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import ScanLogSection from '@/components/ScanLogSection'
import KeywordSection from '@/components/KeywordSection'
import NotificationStatus from '@/components/NotificationStatus'
import DashboardStats from '@/components/DashboardStats'
import DashboardCharts from '@/components/DashboardCharts'
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">監控儀表板</h1>
          <Suspense fallback={
            <span className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700 inline-block" />
          }>
            <ScanLogSection />
          </Suspense>
        </div>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          管理你的關鍵字，即時掌握新品上架
        </p>
      </div>

      {/* Stat cards */}
      <section>
        <Suspense fallback={<SkeletonCard count={3} />}>
          <DashboardStats userId={userId} />
        </Suspense>
      </section>

      {/* Notification warning */}
      <Suspense fallback={null}>
        <NotificationStatus userId={userId} />
      </Suspense>

      {/* Charts */}
      <section>
        <Suspense fallback={<SkeletonCard count={2} />}>
          <DashboardCharts userId={userId} />
        </Suspense>
      </section>

      <hr className="border-gray-100 dark:border-gray-800" />

      {/* Keyword list */}
      <section>
        <Suspense fallback={<KeywordSectionSkeleton />}>
          <KeywordSection userId={userId} />
        </Suspense>
      </section>
    </div>
  )
}

function KeywordSectionSkeleton() {
  return <SkeletonRow count={3} />
}
