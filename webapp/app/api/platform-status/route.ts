import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

interface PlatformStatusResponse {
  id: string
  userId: string
  platform: string
  lastSuccess: Date | null
  lastError: string | null
  failCount: number
  updatedAt: Date
  canaryHealthState: 'healthy' | 'unhealthy'
  canaryUnhealthyReason: 'dom_broken' | 'empty_canary' | null
  canaryLastRunAt: Date | null
}

/**
 * GET /api/platform-status
 *
 * Returns all PlatformScanStatus records for the authenticated user, joined
 * with the system-wide PlatformCanaryStatus by platform identifier.
 * Platforms without a canary row are reported as healthy by default.
 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授權' }, { status: 401 })
  }

  const [statuses, canaries] = await Promise.all([
    prisma.platformScanStatus.findMany({
      where: { userId: session.user.id },
      orderBy: { platform: 'asc' },
    }),
    prisma.platformCanaryStatus.findMany(),
  ])

  const canaryByPlatform = new Map(canaries.map((c) => [c.platform, c]))

  const response: PlatformStatusResponse[] = statuses.map((s) => {
    const canary = canaryByPlatform.get(s.platform)
    return {
      ...s,
      canaryHealthState: (canary?.healthState as 'healthy' | 'unhealthy') ?? 'healthy',
      canaryUnhealthyReason: (canary?.unhealthyReason as 'dom_broken' | 'empty_canary' | null) ?? null,
      canaryLastRunAt: canary?.lastRunAt ?? null,
    }
  })

  return NextResponse.json(response)
}
