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
    include: {
      user: {
        include: {
          notificationSetting: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Map to a clean API shape
  const result = keywords.map((kw) => ({
    id: kw.id,
    userId: kw.userId,
    keyword: kw.keyword,
    platforms: kw.platforms,
    minPrice: kw.minPrice,
    maxPrice: kw.maxPrice,
    blocklist: kw.blocklist,
    notificationSetting: kw.user.notificationSetting
      ? {
          discordWebhookUrl: kw.user.notificationSetting.discordWebhookUrl,
          discordUserId: kw.user.notificationSetting.discordUserId,
          emailAddress: kw.user.notificationSetting.emailAddress,
        }
      : null,
  }))

  return NextResponse.json(result)
}
