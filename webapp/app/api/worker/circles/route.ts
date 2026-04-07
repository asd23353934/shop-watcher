import { verifyWorkerToken } from '@/lib/worker-auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

/**
 * GET /api/worker/circles
 * Returns all active CircleFollow records across all users.
 * Protected by WORKER_SECRET Bearer token.
 *
 * Worker scans CircleFollow new-arrival pages each cycle
 */
export async function GET(request: Request) {
  const authError = verifyWorkerToken(request)
  if (authError) return authError

  const follows = await prisma.circleFollow.findMany({
    where: { active: true },
    orderBy: { createdAt: 'asc' },
  })

  // Shape: worker needs userId for SeenItem dedup, plus all circle metadata
  const result = follows.map((f) => ({
    id: f.id,
    userId: f.userId,
    platform: f.platform,
    circleId: f.circleId,
    circleName: f.circleName,
    webhookUrl: f.webhookUrl,
  }))

  return NextResponse.json(result)
}
