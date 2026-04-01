import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

/**
 * GET /api/history
 * Returns the current user's notification history (SeenItems), newest first, max 50.
 *
 * User can view notification history
 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const items = await prisma.seenItem.findMany({
    where: { userId: session.user.id },
    orderBy: { firstSeen: 'desc' },
    take: 50,
  })

  return NextResponse.json(items)
}
