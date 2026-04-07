import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

/**
 * GET /api/platform-status
 *
 * Returns all PlatformScanStatus records for the authenticated user.
 * Used by the Dashboard to display per-platform scan health.
 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const statuses = await prisma.platformScanStatus.findMany({
    where: { userId: session.user.id },
    orderBy: { platform: 'asc' },
  })

  return NextResponse.json(statuses)
}
