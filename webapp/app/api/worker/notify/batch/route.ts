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
  price_text?: string | null
  url: string
  image_url: string | null
  seller_name: string | null
}

interface BatchPayload {
  keyword_id: string
  items: BatchItem[]
}

export interface NotifyItem extends BatchItem {
  isPriceDrop?: boolean
  originalPrice?: number
}

/**
 * POST /api/worker/notify/batch
 * Receives a batch of scraped items, deduplicates, detects price drops,
 * and triggers grouped notifications.
 *
 * POST /api/worker/notify/batch accepts a batch of items and sends grouped notifications
 * Price drop on a known item triggers a re-notification
 * Already-seen item with price drop triggers re-notification
 * Item with null price does not trigger price drop
 * POST /api/worker/notify receives a scraped item and triggers deduplication and notifications
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
    return NextResponse.json({ new: 0, price_drop: 0, duplicate: 0 })
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

  // Load existing SeenItem records for deduplication and price-drop detection
  const existingRecords = await prisma.seenItem.findMany({
    where: {
      userId,
      OR: items.map((item) => ({
        platform: item.platform,
        itemId: item.item_id,
      })),
    },
    select: { platform: true, itemId: true, lastPrice: true },
  })

  const existingMap = new Map(
    existingRecords.map((e) => [`${e.platform}:${e.itemId}`, e])
  )

  const newItems: NotifyItem[] = []
  const priceDropItems: NotifyItem[] = []
  let duplicateCount = 0

  for (const item of items) {
    const key = `${item.platform}:${item.item_id}`
    const existing = existingMap.get(key)

    if (!existing) {
      // Brand new item — create SeenItem with lastPrice
      await prisma.seenItem.create({
        data: {
          userId,
          platform: item.platform,
          itemId: item.item_id,
          keyword: keyword.keyword,
          keywordId: keyword_id,
          lastPrice: item.price ?? null,
        },
      })
      newItems.push(item)
    } else {
      // Already seen — check for price drop
      // Item with null price does not trigger price drop
      if (
        item.price !== null &&
        item.price !== undefined &&
        existing.lastPrice !== null &&
        existing.lastPrice !== undefined &&
        item.price < existing.lastPrice
      ) {
        // Price drop detected — update lastPrice and add to notify list
        await prisma.seenItem.update({
          where: {
            userId_platform_itemId: {
              userId,
              platform: item.platform,
              itemId: item.item_id,
            },
          },
          data: { lastPrice: item.price },
        })
        priceDropItems.push({
          ...item,
          isPriceDrop: true,
          originalPrice: existing.lastPrice,
        })
      } else {
        // Not a price drop (null price or price >= lastPrice) — duplicate, skip
        duplicateCount++
      }
    }
  }

  // Send notifications for new items and price-drop items
  const notifyItems: NotifyItem[] = [...newItems, ...priceDropItems]

  if (notifyItems.length > 0) {
    const notificationSetting = keyword.user.notificationSetting
    await Promise.all([
      sendDiscordBatchNotification(
        notificationSetting?.discordWebhookUrl ?? null,
        notificationSetting?.discordUserId ?? null,
        notifyItems,
        keyword.keyword
      ),
      sendEmailBatchNotification(
        notificationSetting?.emailAddress ?? null,
        notifyItems,
        keyword.keyword
      ),
    ])
  }

  return NextResponse.json({
    new: newItems.length,
    price_drop: priceDropItems.length,
    duplicate: duplicateCount,
  })
}
