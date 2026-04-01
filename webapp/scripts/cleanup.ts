/**
 * Cleanup script — deletes expired SeenItem and ScanLog rows.
 *
 * Expired SeenItem rows are deleted daily
 * Expired ScanLog rows are deleted daily
 * Cleanup job outputs deletion count
 *
 * Environment variables:
 *   SEEN_ITEM_RETENTION_DAYS  — days to retain SeenItem rows (default: 30)
 *   SCAN_LOG_RETENTION_DAYS   — days to retain ScanLog rows (default: 7)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const seenItemRetentionDays = parseInt(process.env.SEEN_ITEM_RETENTION_DAYS ?? '30', 10)
  const scanLogRetentionDays = parseInt(process.env.SCAN_LOG_RETENTION_DAYS ?? '7', 10)

  const now = new Date()

  const seenItemCutoff = new Date(now.getTime() - seenItemRetentionDays * 24 * 60 * 60 * 1000)
  const scanLogCutoff = new Date(now.getTime() - scanLogRetentionDays * 24 * 60 * 60 * 1000)

  // Delete expired SeenItem rows
  const seenItemResult = await prisma.seenItem.deleteMany({
    where: { firstSeen: { lt: seenItemCutoff } },
  })
  console.log(`[cleanup] SeenItem: deleted ${seenItemResult.count} rows older than ${seenItemRetentionDays} days`)

  // Delete expired ScanLog rows (excluding the 'global' singleton row)
  const scanLogResult = await prisma.scanLog.deleteMany({
    where: {
      id: { not: 'global' },
      scannedAt: { lt: scanLogCutoff },
    },
  })
  console.log(`[cleanup] ScanLog: deleted ${scanLogResult.count} rows older than ${scanLogRetentionDays} days`)

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error('[cleanup] Error:', err)
  process.exit(1)
})
