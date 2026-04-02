import { prisma } from '@/lib/prisma'

// Dashboard shows last scan time — async Server Component streamed via Suspense
export default async function ScanLogSection() {
  const scanLog = await prisma.scanLog.findUnique({ where: { id: 'global' } })

  const lastScanLabel = (() => {
    if (!scanLog?.scannedAt) return '尚未掃描'
    return new Date(scanLog.scannedAt).toLocaleString('zh-TW', {
      timeZone: 'Asia/Taipei',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  })()

  return (
    <span className="text-xs text-gray-400">上次掃描：{lastScanLabel}</span>
  )
}
