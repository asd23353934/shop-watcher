import { verifyWorkerToken } from '@/lib/worker-auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'

interface PlatformStatusPayload {
  userId: string
  platform: string
  success: boolean
  error?: string
}

/**
 * PATCH /api/worker/platform-status
 *
 * Upserts PlatformScanStatus for a given userId + platform combination.
 * - success=true: updates lastSuccess to now, resets failCount to 0, clears lastError
 * - success=false: increments failCount, records lastError, leaves lastSuccess unchanged
 *
 * Requires WORKER_SECRET Bearer token authentication.
 */
export async function PATCH(request: Request) {
  const authError = verifyWorkerToken(request)
  if (authError) return authError

  let body: PlatformStatusPayload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { userId, platform, success, error } = body

  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }
  if (!platform || typeof platform !== 'string') {
    return NextResponse.json({ error: 'platform is required' }, { status: 400 })
  }
  if (typeof success !== 'boolean') {
    return NextResponse.json({ error: 'success (boolean) is required' }, { status: 400 })
  }

  try {
    const updated = await prisma.platformScanStatus.upsert({
      where: { userId_platform: { userId, platform } },
      create: {
        userId,
        platform,
        lastSuccess: success ? new Date() : null,
        lastError: success ? null : (error ?? 'Unknown error'),
        failCount: success ? 0 : 1,
      },
      update: success
        ? {
            lastSuccess: new Date(),
            lastError: null,
            failCount: 0,
          }
        : {
            failCount: { increment: 1 },
            lastError: error ?? 'Unknown error',
          },
    })

    return NextResponse.json({ ok: true, failCount: updated.failCount })
  } catch (err: unknown) {
    // P2003: FK violation — userId does not reference an existing user
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    console.error('platform-status PATCH error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
