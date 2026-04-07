import Link from 'next/link'
import { prisma } from '@/lib/prisma'

interface Props {
  userId: string
}

// Dashboard stat cards — keyword count, today's notification count (UTC+8), platform scan health
export default async function DashboardStats({ userId }: Props) {
  const keywordCount = await prisma.keyword.count({ where: { userId } })

  const utc8Now = new Date(Date.now() + 8 * 60 * 60 * 1000)
  const todayDateStr = utc8Now.toISOString().slice(0, 10)
  const startOfTodayUtc = new Date(todayDateStr + 'T00:00:00+08:00')
  const endOfTodayUtc = new Date(todayDateStr + 'T23:59:59.999+08:00')

  const [todayNotifyCount, platformStatuses] = await Promise.all([
    prisma.seenItem.count({
      where: { userId, firstSeen: { gte: startOfTodayUtc, lte: endOfTodayUtc } },
    }),
    prisma.platformScanStatus.findMany({
      where: { userId },
      select: { failCount: true },
    }),
  ])

  const warningCount = platformStatuses.filter((s) => s.failCount >= 3).length
  const minorFailCount = platformStatuses.filter((s) => s.failCount > 0 && s.failCount < 3).length

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <p className="text-3xl font-bold text-gray-900">{keywordCount}</p>
        <p className="mt-1 text-sm text-gray-500">監控關鍵字</p>
      </div>
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <p className="text-3xl font-bold text-indigo-600">{todayNotifyCount}</p>
        <p className="mt-1 text-sm text-gray-500">今日通知</p>
      </div>
      <Link href="/status" className="rounded-xl border bg-white p-5 shadow-sm hover:bg-gray-50 block">
        {warningCount > 0 ? (
          <p className="text-3xl font-bold text-orange-500">{warningCount}</p>
        ) : minorFailCount > 0 ? (
          <p className="text-3xl font-bold text-yellow-500">{minorFailCount}</p>
        ) : (
          <p className="text-3xl font-bold text-green-500">✓</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          {warningCount > 0 ? '平台異常' : minorFailCount > 0 ? '平台警告' : '平台正常'}
        </p>
      </Link>
    </div>
  )
}
