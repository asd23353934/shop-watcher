import { prisma } from '@/lib/prisma'
import { cn } from '@/lib/utils'
import { PLATFORM_LABELS } from '@/constants/platform'

interface Props {
  userId: string
}

function formatRelativeTime(date: Date | null): string {
  if (!date) return '尚無記錄'
  const diffMs  = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1)  return '剛剛'
  if (diffMin < 60) return `${diffMin} 分鐘前`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24)  return `${diffHr} 小時前`
  return `${Math.floor(diffHr / 24)} 天前`
}

type Status = 'normal' | 'warning' | 'error'

function getStatus(failCount: number, lastSuccess: Date | null): Status {
  if (failCount >= 3) return 'error'
  if (failCount > 0)  return 'warning'
  if (!lastSuccess)   return 'warning'
  const diffMin = (Date.now() - lastSuccess.getTime()) / 60000
  if (diffMin > 240)  return 'error'
  if (diffMin > 60)   return 'warning'
  return 'normal'
}

export default async function PlatformScanHealthSection({ userId }: Props) {
  const statuses = await prisma.platformScanStatus.findMany({
    where: { userId },
    orderBy: { platform: 'asc' },
  })

  // Only show platforms that have been scanned at least once (i.e., user has keywords for them).
  // Platforms with no record are irrelevant to this user — showing them would always be 'warning'.
  const platformData = statuses.map((record) => {
    const label      = PLATFORM_LABELS[record.platform] ?? record.platform
    const failCount  = record.failCount
    const lastSuccess = record.lastSuccess
    const status     = getStatus(failCount, lastSuccess)
    return { platform: record.platform, label, failCount, lastSuccess, status, lastError: record.lastError }
  })

  const normalCount  = platformData.filter((p) => p.status === 'normal').length
  const warningCount = platformData.filter((p) => p.status === 'warning').length
  const errorCount   = platformData.filter((p) => p.status === 'error').length

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-green-50 dark:bg-green-950 p-4 text-center">
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{normalCount}</p>
          <p className="text-sm text-green-600 dark:text-green-400 mt-1">正常 · 平台</p>
        </div>
        <div className="rounded-xl bg-yellow-50 dark:bg-yellow-950 p-4 text-center">
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{warningCount}</p>
          <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">注意 · 平台</p>
        </div>
        <div className="rounded-xl bg-red-50 dark:bg-red-950 p-4 text-center">
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">{errorCount}</p>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">異常 · 平台</p>
        </div>
      </div>

      {/* Status table */}
      {platformData.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-8">尚無掃描記錄，請先新增關鍵字並等待 Worker 執行</p>
      ) : (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50">
              <th className="text-xs font-medium text-gray-500 uppercase tracking-wider text-left px-4 py-3">平台</th>
              <th className="text-xs font-medium text-gray-500 uppercase tracking-wider text-left px-4 py-3">上次成功掃描</th>
              <th className="text-xs font-medium text-gray-500 uppercase tracking-wider text-left px-4 py-3">連續失敗</th>
              <th className="text-xs font-medium text-gray-500 uppercase tracking-wider text-left px-4 py-3">狀態</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {platformData.map(({ platform, label, failCount, lastSuccess, status, lastError }) => (
              <tr key={platform} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={cn('w-2 h-2 rounded-full flex-shrink-0',
                      status === 'normal'  ? 'bg-green-500'
                      : status === 'warning' ? 'bg-yellow-500'
                      : 'bg-red-500'
                    )} />
                    <span className="text-sm text-gray-900 dark:text-gray-100">{label}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {lastSuccess ? formatRelativeTime(lastSuccess) : <span className="text-gray-400">從未</span>}
                </td>
                <td className="px-4 py-3 text-sm">
                  {failCount === 0 ? (
                    <span className="text-gray-300 dark:text-gray-600">—</span>
                  ) : failCount >= 3 ? (
                    <span className="text-red-600 font-bold">{failCount}</span>
                  ) : (
                    <span className="text-yellow-600">{failCount}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {status === 'normal' && (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
                      ✓ 正常
                    </span>
                  )}
                  {status === 'warning' && (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400"
                      title={lastError ?? undefined}>
                      ⚠ 注意
                    </span>
                  )}
                  {status === 'error' && (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                      title={lastError ?? undefined}>
                      ✕ 異常
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        平台狀態由 Worker 自動回報，若持續顯示異常請檢查 GitHub Actions 執行記錄
      </p>
    </div>
  )
}
