import { verifyWorkerToken } from '@/lib/worker-auth'
import { prisma } from '@/lib/prisma'
import { sendDiscordBatchNotification } from '@/lib/discord'
import { sendEmailBatchNotification } from '@/lib/email'
import { NextResponse } from 'next/server'

interface BatchItem {
  platform: string
  item_id: string
  name: string
  price: number | null
  url: string
  image_url: string | null
  seller_name: string | null
}

interface BatchPayload {
  keyword_id: string
  items: BatchItem[]
}

/**
 * POST /api/worker/notify/batch
 * Receives a batch of scraped items, deduplicates, and triggers grouped notifications.
 *
 * POST /api/worker/notify/batch accepts a batch of items and sends grouped notifications
 */
export async function POST(request: Request) {
  const authError = verifyWorkerToken(request)
  if (authError) return authError

  let body: BatchPayload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { keyword_id, items } = body

  if (!keyword_id || !Array.isArray(items)) {
    return NextResponse.json(
      { error: 'keyword_id and items array are required' },
      { status: 400 }
    )
  }

  if (items.length === 0) {
    return NextResponse.json({ new: 0, duplicate: 0 })
  }

  // Unknown keyword_id returns 404
  const keyword = await prisma.keyword.findUnique({
    where: { id: keyword_id },
    include: {
      user: {
        include: { notificationSetting: true },
      },
    },
  })

  if (!keyword) {
    return NextResponse.json({ error: 'Keyword not found' }, { status: 404 })
  }

  const userId = keyword.userId

  // Step 1: Find which items are already seen (deduplication check)
  const existingRecords = await prisma.seenItem.findMany({
    where: {
      userId,
      OR: items.map((item) => ({
        platform: item.platform,
        itemId: item.item_id,
      })),
    },
    select: { platform: true, itemId: true },
  })

  const existingSet = new Set(
    existingRecords.map((e) => `${e.platform}:${e.itemId}`)
  )

  const newItems = items.filter(
    (item) => !existingSet.has(`${item.platform}:${item.item_id}`)
  )
  const duplicateCount = items.length - newItems.length

  // Step 2: Insert new SeenItem records
  if (newItems.length > 0) {
    await prisma.seenItem.createMany({
      data: newItems.map((item) => ({
        userId,
        platform: item.platform,
        itemId: item.item_id,
        keyword: keyword.keyword,
        keywordId: keyword_id,
      })),
      skipDuplicates: true,
    })
  }

  // Step 3: Send grouped notifications for new items only
  if (newItems.length > 0) {
    const notificationSetting = keyword.user.notificationSetting
    await Promise.all([
      sendDiscordBatchNotification(
        notificationSetting?.discordWebhookUrl ?? null,
        notificationSetting?.discordUserId ?? null,
        newItems,
        keyword.keyword
      ),
      sendEmailBatchNotification(
        notificationSetting?.emailAddress ?? null,
        newItems,
        keyword.keyword
      ),
    ])
  }

  return NextResponse.json({ new: newItems.length, duplicate: duplicateCount })
}
