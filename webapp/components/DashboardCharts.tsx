import { prisma } from '@/lib/prisma'
import { PLATFORM_LABELS } from '@/constants/platform'
import ChartsRow from '@/components/ChartsRow'

interface Props {
  userId: string
}

export default async function DashboardCharts({ userId }: Props) {
  const utc8Now = new Date(Date.now() + 8 * 60 * 60 * 1000)

  const sevenDaysAgo = new Date(utc8Now.getTime() - 7 * 86400000)
  const todayStr = utc8Now.toISOString().slice(0, 10)
  const startToday = new Date(todayStr + 'T00:00:00+08:00')
  const endToday   = new Date(todayStr + 'T23:59:59.999+08:00')

  const [recentItems, todayItems] = await Promise.all([
    prisma.seenItem.findMany({
      where: { userId, firstSeen: { gte: sevenDaysAgo } },
      select: { firstSeen: true, platform: true },
      orderBy: { firstSeen: 'asc' },
    }),
    prisma.seenItem.findMany({
      where: { userId, firstSeen: { gte: startToday, lte: endToday } },
      select: { platform: true },
    }),
  ])

  const dayMap = new Map<string, number>()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(utc8Now.getTime() - i * 86400000)
    const label = `${d.getMonth() + 1}/${d.getDate()}`
    dayMap.set(label, 0)
  }
  for (const item of recentItems) {
    const d = new Date(item.firstSeen.getTime() + 8 * 60 * 60 * 1000)
    const label = `${d.getMonth() + 1}/${d.getDate()}`
    if (dayMap.has(label)) dayMap.set(label, (dayMap.get(label) ?? 0) + 1)
  }
  const lineData = Array.from(dayMap.entries()).map(([date, count]) => ({ date, count }))

  const platMap = new Map<string, number>()
  for (const item of todayItems) {
    platMap.set(item.platform, (platMap.get(item.platform) ?? 0) + 1)
  }
  const barData = Array.from(platMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([platform, count]) => ({
      platform: PLATFORM_LABELS[platform] ?? platform,
      count,
    }))

  return <ChartsRow lineData={lineData} barData={barData} />
}
