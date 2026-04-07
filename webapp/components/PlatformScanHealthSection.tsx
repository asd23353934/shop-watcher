import { prisma } from '@/lib/prisma'

interface Props {
  userId: string
}

const PLATFORM_LABELS: Record<string, string> = {
  ruten: '露天拍賣',
  pchome: 'PChome 24h',
  momo: 'momo 購物',
  animate: 'Animate Online',
  'yahoo-auction': 'Yahoo! 拍賣',
  mandarake: 'Mandarake',
  myacg: 'MyACG',
  kingstone: '金石堂',
  booth: 'BOOTH',
  dlsite: 'DLsite',
  toranoana: '虎之穴',
  melonbooks: 'Melonbooks',
}

function formatRelativeTime(date: Date | null): string {
  if (!date) return '尚無掃描記錄'
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return '剛剛'
  if (diffMin < 60) return `${diffMin} 分鐘前`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} 小時前`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay} 天前`
}

export default async function PlatformScanHealthSection({ userId }: Props) {
  const statuses = await prisma.platformScanStatus.findMany({
    where: { userId },
    orderBy: { platform: 'asc' },
  })

  const statusMap = Object.fromEntries(statuses.map((s) => [s.platform, s]))

  const allPlatforms = Object.keys(PLATFORM_LABELS)

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-gray-700">平台掃描狀態</h2>
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">平台</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">上次成功</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">狀態</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {allPlatforms.map((platform) => {
              const record = statusMap[platform]
              const failCount = record?.failCount ?? 0
              const lastSuccess = record?.lastSuccess ?? null
              const lastError = record?.lastError ?? null
              const isWarning = failCount >= 3

              return (
                <tr key={platform} className={isWarning ? 'bg-orange-50' : ''}>
                  <td className="px-4 py-2 font-medium text-gray-800">
                    {PLATFORM_LABELS[platform] ?? platform}
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    {formatRelativeTime(lastSuccess)}
                  </td>
                  <td className="px-4 py-2">
                    {!record ? (
                      <span className="text-gray-400 text-xs">尚無掃描記錄</span>
                    ) : isWarning ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700"
                        title={lastError ?? undefined}
                      >
                        ⚠️ 連續失敗 {failCount} 次
                      </span>
                    ) : failCount > 0 ? (
                      <span className="text-xs text-yellow-600">失敗 {failCount} 次</span>
                    ) : (
                      <span className="text-xs text-green-600">✓ 正常</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
