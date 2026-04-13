import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { CACHE_CONTROL_PRIVATE_SWR_60 } from '@/lib/utils'
import { NextResponse } from 'next/server'

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
  const cursor = searchParams.get('cursor')

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
