import { prisma } from '@/lib/prisma'

function formatRelativeTime(scannedAt: Date): string {
  const diffMs = Math.max(0, Date.now() - scannedAt.getTime())
  const diffMins = Math.floor(diffMs / 60_000)
  if (diffMins < 1) return '剛剛'
  if (diffMins < 60) return `${diffMins} 分鐘前`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} 小時前`
  return `${Math.floor(diffHours / 24)} 天前`
}

// Dashboard shows last scan time — async Server Component streamed via Suspense
export default async function ScanLogSection() {
  const scanLog = await prisma.scanLog.findUnique({ where: { id: 'global' } })

  const lastScanLabel = scanLog?.scannedAt
    ? formatRelativeTime(new Date(scanLog.scannedAt))
    : '尚未掃描'

  return (
    <span className="text-xs text-gray-400">上次掃描：{lastScanLabel}</span>
  )
}
