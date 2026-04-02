import { auth } from '@/auth'
import { Suspense } from 'react'
import ScanLogSection from '@/components/ScanLogSection'
import KeywordSection from '@/components/KeywordSection'
import NotificationStatus from '@/components/NotificationStatus'

export default async function DashboardPage() {
  // layout.tsx already redirects unauthenticated users; no duplicate redirect needed
  const session = await auth()
  const userId = session!.user!.id!

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">關鍵字監控</h1>
          {/* Dashboard shows last scan time — streamed independently */}
          <Suspense fallback={
            <span className="h-4 w-32 animate-pulse rounded bg-gray-200 inline-block" />
          }>
            <ScanLogSection />
          </Suspense>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          管理您的商品監控關鍵字，發現新商品時即時通知
        </p>
      </div>

      {/* Dashboard warns user when no notification method is configured */}
      <Suspense fallback={null}>
        <NotificationStatus userId={userId} />
      </Suspense>

      {/* KeywordSection fetches keywords, KeywordClientSection handles grid + state */}
      <Suspense fallback={<KeywordSectionSkeleton />}>
        <KeywordSection userId={userId} />
      </Suspense>
    </div>
  )
}

function KeywordSectionSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 w-full animate-pulse rounded-xl bg-gray-100" />
      ))}
    </div>
  )
}
