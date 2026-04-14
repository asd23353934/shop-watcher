import Link from 'next/link'
import { Search, Bell, Activity, ArrowUp } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { PLATFORM_LABELS } from '@/constants/platform'

interface Props {
  userId: string
  compact?: boolean
}

export default async function DashboardStats({ userId, compact = false }: Props) {
  const utc8Now = new Date(Date.now() + 8 * 60 * 60 * 1000)
  const todayStr  = utc8Now.toISOString().slice(0, 10)
  const yesterdayUtc8 = new Date(Date.now() + 8 * 60 * 60 * 1000 - 86400000)
  const yesterdayStr  = yesterdayUtc8.toISOString().slice(0, 10)

  const startToday     = new Date(todayStr + 'T00:00:00+08:00')
  const endToday       = new Date(todayStr + 'T23:59:59.999+08:00')
  const startYesterday = new Date(yesterdayStr + 'T00:00:00+08:00')
  const endYesterday   = new Date(yesterdayStr + 'T23:59:59.999+08:00')

  const [keywordCount, activeCount, todayCount, yesterdayCount, platformStatuses] = await Promise.all([
    prisma.keyword.count({ where: { userId } }),
    prisma.keyword.count({ where: { userId, active: true } }),
    prisma.seenItem.count({ where: { userId, firstSeen: { gte: startToday, lte: endToday } } }),
    prisma.seenItem.count({ where: { userId, firstSeen: { gte: startYesterday, lte: endYesterday } } }),
    prisma.platformScanStatus.findMany({ where: { userId }, select: { failCount: true } }),
  ])

  const errorCount  = platformStatuses.filter((s) => s.failCount >= 3).length
  const warnCount   = platformStatuses.filter((s) => s.failCount > 0 && s.failCount < 3).length
  const totalPlatforms = Object.keys(PLATFORM_LABELS).length
  const okCount     = totalPlatforms - errorCount - warnCount

  const notifyDiff  = todayCount - yesterdayCount

  const platformHealthLabel =
    errorCount > 0 ? `${errorCount} 個平台異常`
    : warnCount > 0 ? `${warnCount} 個平台警告`
    : '所有平台正常'

  const platformHealthIcon =
    errorCount > 0 ? 'text-red-500'
    : warnCount > 0 ? 'text-yellow-500'
    : 'text-green-500'

  const platformHealthValue = (errorCount > 0 || warnCount > 0)
    ? `${okCount}/${totalPlatforms}`
    : `${totalPlatforms}/${totalPlatforms}`

  return (
    <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3'}`}>
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
            <Search className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{keywordCount}</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">個關鍵字監控中</span>
            </div>
            <p className="text-xs mt-1 text-gray-500">
              {activeCount} 個啟用中 · {keywordCount - activeCount} 個已暫停
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
            <Bell className="h-5 w-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{todayCount}</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">筆新品通知（今日）</span>
            </div>
            {notifyDiff !== 0 && (
              <p className={`text-xs mt-1 flex items-center gap-1 ${notifyDiff > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                {notifyDiff > 0 && <ArrowUp className="h-3 w-3" />}
                比昨日 {notifyDiff > 0 ? `+${notifyDiff}` : notifyDiff}
              </p>
            )}
            {notifyDiff === 0 && (
              <p className="text-xs mt-1 text-gray-400">與昨日相同</p>
            )}
          </div>
        </div>
      </div>

      <Link
        href="/status"
        className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors block"
      >
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
            <Activity className={`h-5 w-5 ${platformHealthIcon}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${platformHealthIcon}`}>{platformHealthValue}</span>
            </div>
            <p className="text-xs mt-1 text-gray-500">{platformHealthLabel}</p>
          </div>
        </div>
      </Link>
    </div>
  )
}
