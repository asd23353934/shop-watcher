import Link from 'next/link'
import { prisma } from '@/lib/prisma'

interface Props {
  userId: string
}

export default async function PlatformScanHealthBadge({ userId }: Props) {
  const [statuses, canaries] = await Promise.all([
    prisma.platformScanStatus.findMany({
      where: { userId },
      select: { platform: true, failCount: true },
    }),
    prisma.platformCanaryStatus.findMany({
      where: { healthState: 'unhealthy' },
      select: { platform: true },
    }),
  ])

  const userPlatforms = new Set(statuses.map((s) => s.platform))
  const canaryUnhealthyCount = canaries.filter((c) => userPlatforms.has(c.platform)).length

  const warningCount = statuses.filter((s) => s.failCount >= 3).length
  const minorFailCount = statuses.filter((s) => s.failCount > 0 && s.failCount < 3).length

  return (
    <div className="flex items-center justify-between rounded-lg border bg-white px-4 py-3 shadow-sm">
      <span className="text-sm font-medium text-gray-700">平台掃描狀態</span>
      <Link
        href="/status"
        className="flex items-center gap-2 text-sm hover:opacity-80"
      >
        {warningCount > 0 ? (
          <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700">
            ⚠️ {warningCount} 個異常
          </span>
        ) : minorFailCount > 0 ? (
          <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700">
            {minorFailCount} 個警告
          </span>
        ) : canaryUnhealthyCount === 0 ? (
          <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
            ✓ 全部正常
          </span>
        ) : null}
        {canaryUnhealthyCount > 0 && (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700" title="canary 偵測到平台異常">
            🐤 {canaryUnhealthyCount} 平台 canary 異常
          </span>
        )}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-4 w-4 text-gray-400"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </Link>
    </div>
  )
}
