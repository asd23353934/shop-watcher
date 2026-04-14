import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { CACHE_CONTROL_PRIVATE_SWR_60 } from '@/lib/utils'
import { PLATFORM_LABELS } from '@/constants/platform'
import { NextResponse } from 'next/server'

const VALID_PLATFORMS = new Set(Object.keys(PLATFORM_LABELS))

/**
 * GET /api/history
 * Returns the current user's notification history (SeenItems), newest first, 50 per page.
 *
 * Query params:
 *   ?keywordId=<id>    filter by keyword (includes circle:{name} via the keyword field)
 *   ?platform=<name>   filter by platform
 *   ?cursor=<id>       cursor-based pagination (ID of last item from previous page)
 *
 * Returns: { items: SeenItem[], nextCursor: string | null }
 *
 * History pagination loads next 50 items
 * History supports filtering by keyword
 * History supports filtering by platform
 */
export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const keywordId = searchParams.get('keywordId')
  const platform = searchParams.get('platform')
  const rawCursor = searchParams.get('cursor')

  const CUID_RE = /^c[a-z0-9]{24}$/
  if (rawCursor && !CUID_RE.test(rawCursor)) {
    return NextResponse.json({ error: '無效的 cursor 格式' }, { status: 400 })
  }
  const cursor = rawCursor || null

  const PAGE_SIZE = 50

  // Build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { userId: session.user.id }

  if (keywordId) {
    // keywordId can be a Prisma keyword record ID, or a special "circle:*" label stored in .keyword field
    if (keywordId.startsWith('circle:')) {
      where.keyword = keywordId
      where.keywordId = null
    } else {
      where.keywordId = keywordId
    }
  }

  if (platform) {
    if (!VALID_PLATFORMS.has(platform)) {
      return NextResponse.json({ error: '無效的平台' }, { status: 400 })
    }
    where.platform = platform
  }

  // Cursor pagination: skip items with id <= cursor (using cursor on createdAt desc)
  const items = await prisma.seenItem.findMany({
    where,
    orderBy: { firstSeen: 'desc' },
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  })

  const hasMore = items.length > PAGE_SIZE
  const pageItems = hasMore ? items.slice(0, PAGE_SIZE) : items
  const nextCursor = hasMore ? pageItems[pageItems.length - 1].id : null

  return NextResponse.json(
    { items: pageItems, nextCursor },
    { headers: { 'Cache-Control': CACHE_CONTROL_PRIVATE_SWR_60 } }
  )
}

/**
 * DELETE /api/history
 * Permanently deletes all SeenItems for the authenticated user.
 * Resets notification history so future scans will re-notify for the same items.
 */
export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await prisma.seenItem.deleteMany({ where: { userId: session.user.id } })

  return NextResponse.json({ ok: true })
}
