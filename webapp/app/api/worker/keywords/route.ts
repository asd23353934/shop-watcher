import { verifyWorkerToken } from '@/lib/worker-auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

/**
 * GET /api/worker/keywords
 * Returns all active keywords with user notification settings.
 * Protected by WORKER_SECRET Bearer token.
 *
 * GET /api/worker/keywords returns all active keywords with user notification settings
 * No active keywords returns empty array
 */
export async function GET(request: Request) {
  const authError = verifyWorkerToken(request)
  if (authError) return authError

  const keywords = await prisma.keyword.findMany({
    where: { active: true },
    orderBy: { createdAt: 'asc' },
  })

  // Map to a clean API shape — includes new fields for seller filtering, webhook routing, and rate limiting
  // Notification settings (Discord/email) are resolved server-side in /api/worker/notify/batch
  const result = keywords.map((kw) => ({
    id: kw.id,
    userId: kw.userId,
    keyword: kw.keyword,
    platforms: kw.platforms,
    minPrice: kw.minPrice,
    maxPrice: kw.maxPrice,
    blocklist: kw.blocklist,
    mustInclude: kw.mustInclude,
    matchMode: kw.matchMode,
    sellerBlocklist: kw.sellerBlocklist,
    discordWebhookUrl: kw.discordWebhookUrl,
    maxNotifyPerScan: kw.maxNotifyPerScan,
  }))

  return NextResponse.json(result)
}
