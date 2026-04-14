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

      {/* Two-column grid: keywords left, stats+charts right.
          On mobile the grid collapses to 1 col — keywords stay first in DOM so they render first. */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] lg:items-start gap-6">

        {/* LEFT — Keyword list (first in DOM = first on mobile) */}
        <section>
          <Suspense fallback={<KeywordSectionSkeleton />}>
            <KeywordSection userId={userId} />
          </Suspense>
        </section>

        {/* RIGHT — Stats + notification warning + charts */}
        <div className="space-y-6">
          <section>
            <Suspense fallback={<SkeletonCard count={3} />}>
              <DashboardStats userId={userId} compact />
            </Suspense>
          </section>

          <Suspense fallback={null}>
            <NotificationStatus userId={userId} />
          </Suspense>

          <section>
            <Suspense fallback={<SkeletonCard count={2} />}>
              <DashboardCharts userId={userId} compact />
            </Suspense>
          </section>
        </div>

      </div>
    </div>
  )
}

function KeywordSectionSkeleton() {
  return <SkeletonRow count={3} />
}
