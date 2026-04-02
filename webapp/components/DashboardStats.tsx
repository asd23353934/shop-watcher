import { prisma } from '@/lib/prisma'

interface Props {
  userId: string
}

// Dashboard stat cards — keyword count and today's notification count (UTC+8)
export default async function DashboardStats({ userId }: Props) {
  // Count all keywords for this user
  const keywordCount = await prisma.keyword.count({ where: { userId } })

  // Count today's notifications (seenItems first seen today in UTC+8)
  const utc8Now = new Date(Date.now() + 8 * 60 * 60 * 1000)
  const todayDateStr = utc8Now.toISOString().slice(0, 10) // YYYY-MM-DD in UTC+8
  const startOfTodayUtc = new Date(todayDateStr + 'T00:00:00+08:00')
  const endOfTodayUtc = new Date(todayDateStr + 'T23:59:59.999+08:00')

  const todayNotifyCount = await prisma.seenItem.count({
    where: {
      userId,
      firstSeen: { gte: startOfTodayUtc, lte: endOfTodayUtc },
    },
  })

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <p className="text-3xl font-bold text-gray-900">{keywordCount}</p>
        <p className="mt-1 text-sm text-gray-500">監控關鍵字</p>
      </div>
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <p className="text-3xl font-bold text-indigo-600">{todayNotifyCount}</p>
        <p className="mt-1 text-sm text-gray-500">今日通知</p>
      </div>
    </div>
  )
}
