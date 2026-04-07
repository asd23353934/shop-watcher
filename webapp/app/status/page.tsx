import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import PlatformScanHealthSection from '@/components/PlatformScanHealthSection'
import { SkeletonCard } from '@/components/ui/SkeletonCard'

export default async function StatusPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">平台掃描狀態</h1>
        <p className="mt-1 text-sm text-gray-500">各平台最近一次成功掃描時間與失敗紀錄</p>
      </div>
      <Suspense fallback={<SkeletonCard count={1} />}>
        <PlatformScanHealthSection userId={session.user.id} />
      </Suspense>
    </div>
  )
}
