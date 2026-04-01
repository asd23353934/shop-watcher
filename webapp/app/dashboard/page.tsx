import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import KeywordList from '@/components/KeywordList'
import KeywordFormWrapper from '@/components/KeywordFormWrapper'
import NotificationBanner from '@/components/NotificationBanner'

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  // Authenticated user can create a keyword, Authenticated user can edit an existing keyword,
  // Authenticated user can delete a keyword
  const [keywords, notificationSetting, scanLog] = await Promise.all([
    prisma.keyword.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    }),
    // Dashboard warns user when no notification method is configured
    prisma.notificationSetting.findUnique({
      where: { userId: session.user.id },
    }),
    // Dashboard shows last scan time
    prisma.scanLog.findUnique({ where: { id: 'global' } }),
  ])

  const hasNotification =
    !!notificationSetting?.discordWebhookUrl || !!notificationSetting?.emailAddress

  // Format relative time for last scan
  const lastScanLabel = (() => {
    if (!scanLog?.scannedAt) return '尚未掃描'
    const diffMs = Date.now() - new Date(scanLog.scannedAt).getTime()
    const diffMin = Math.floor(diffMs / 60_000)
    if (diffMin < 1) return '剛剛'
    if (diffMin < 60) return `${diffMin} 分鐘前`
    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24) return `${diffHr} 小時前`
    return `${Math.floor(diffHr / 24)} 天前`
  })()

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">關鍵字監控</h1>
          <span className="text-xs text-gray-400">上次掃描：{lastScanLabel}</span>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          管理您的商品監控關鍵字，發現新商品時即時通知
        </p>
      </div>

      {!hasNotification && <NotificationBanner />}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <KeywordList initialKeywords={JSON.parse(JSON.stringify(keywords))} />
        </div>
        <div>
          <KeywordFormWrapper />
        </div>
      </div>
    </div>
  )
}
