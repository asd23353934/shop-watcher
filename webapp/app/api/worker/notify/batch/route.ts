import { verifyWorkerToken } from '@/lib/worker-auth'
import { prisma } from '@/lib/prisma'
import { sendDiscordBatchNotification } from '@/lib/discord'
import { sendEmailBatchNotification } from '@/lib/email'
import { isHttpUrl } from '@/lib/utils'
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
  seller_id?: string | null
}

interface BatchPayload {
  keyword_id?: string | null
  circle_follow_id?: string | null
  items: BatchItem[]
  keywordWebhookUrl?: string | null
  maxNotifyPerScan?: number | null
  globalSellerBlocklist?: string[]
}

export interface NotifyItem extends BatchItem {
  isPriceDrop?: boolean
  originalPrice?: number
}

/**
 * Returns true if sellerName or sellerId matches any entry in the blocklist
 * (case-insensitive substring match).
 */
function isSellerBlocked(
  sellerName: string | null | undefined,
  sellerId: string | null | undefined,
  blocklist: string[]
): boolean {
  if (blocklist.length === 0) return false
  const lower = blocklist.map((s) => s.toLowerCase())
  const sn = (sellerName ?? '').toLowerCase()
  const si = (sellerId ?? '').toLowerCase()
  return lower.some((entry) =>
    (sn && sn.includes(entry)) || (si && si.includes(entry))
  )
}

/**
 * POST /api/worker/notify/batch
 *
 * Order of operations:
 * 1. Deduplication (seenItem lookup)
 * 2. Seller filtering: global blocklist → per-keyword blocklist (new items only)
 * 3. maxNotifyPerScan cap (truncation after filtering)
 * 4. SeenItem insert (with itemName/itemUrl) + Discord/Email notification
 *
 * notify/batch applies seller blocklist before notifying
 * notify/batch routes Discord notification to per-keyword webhook
 * notify/batch enforces maxNotifyPerScan cap per keyword
 * SeenItem stores itemName and itemUrl from batch payload
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

  const {
    keyword_id,
    circle_follow_id,
    items,
    keywordWebhookUrl,
    maxNotifyPerScan: payloadMaxNotify,
    globalSellerBlocklist: payloadGlobalBlocklist,
  } = body

  if (!Array.isArray(items)) {
    return NextResponse.json(
      { error: 'items array is required' },
      { status: 400 }
    )
  }
  if (!keyword_id && !circle_follow_id) {
    return NextResponse.json(
      { error: 'keyword_id or circle_follow_id is required' },
      { status: 400 }
    )
  }

  if (items.length === 0) {
    return NextResponse.json({ new: 0, price_drop: 0, duplicate: 0 })
  }

  const envMax = parseInt(process.env.MAX_NOTIFY_PER_BATCH ?? '100', 10) || 100

  // Mode-based lookup: keyword or circle follow
  let userId: string
  let notificationSetting: { discordWebhookUrl: string | null; discordUserId: string | null; emailAddress: string | null; globalSellerBlocklist: string[] } | null = null
  let effectiveKeywordLabel: string
  let effectiveWebhook: string | null
  let keywordSellerBlocklist: string[] = []
  let keywordIdForRecord: string | null = null
  let cap: number

  if (keyword_id) {
    // Keyword mode
    const keyword = await prisma.keyword.findUnique({
      where: { id: keyword_id },
      include: { user: { include: { notificationSetting: true } } },
    })
    if (!keyword) {
      return NextResponse.json({ error: 'Keyword not found' }, { status: 404 })
    }
    userId = keyword.userId
    notificationSetting = keyword.user.notificationSetting
    effectiveKeywordLabel = keyword.keyword
    keywordSellerBlocklist = keyword.sellerBlocklist ?? []
    keywordIdForRecord = keyword_id

    effectiveWebhook =
      keywordWebhookUrl !== undefined
        ? (keywordWebhookUrl ?? notificationSetting?.discordWebhookUrl ?? null)
        : (keyword.discordWebhookUrl ?? notificationSetting?.discordWebhookUrl ?? null)

    cap =
      payloadMaxNotify != null
        ? payloadMaxNotify
        : keyword.maxNotifyPerScan != null
          ? keyword.maxNotifyPerScan
          : envMax
  } else {
    // Circle follow mode
    const circleFollow = await prisma.circleFollow.findUnique({
      where: { id: circle_follow_id! },
      include: { user: { include: { notificationSetting: true } } },
    })
    if (!circleFollow) {
      return NextResponse.json({ error: 'CircleFollow not found' }, { status: 404 })
    }
    userId = circleFollow.userId
    notificationSetting = circleFollow.user.notificationSetting
    effectiveKeywordLabel = `circle:${circleFollow.circleName}`
    keywordIdForRecord = null

    effectiveWebhook =
      keywordWebhookUrl !== undefined
        ? (keywordWebhookUrl ?? circleFollow.webhookUrl ?? notificationSetting?.discordWebhookUrl ?? null)
        : (circleFollow.webhookUrl ?? notificationSetting?.discordWebhookUrl ?? null)

    cap = payloadMaxNotify != null ? payloadMaxNotify : envMax
  }

  // Resolve globalSellerBlocklist: prefer payload (Worker already fetched) or DB fallback
  const globalSellerBlocklist: string[] =
    Array.isArray(payloadGlobalBlocklist)
      ? payloadGlobalBlocklist
      : (notificationSetting?.globalSellerBlocklist ?? [])

  // ── 1. Deduplication ──────────────────────────────────────────────────────
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

  const rawNewItems: NotifyItem[] = []
  const priceDropItems: NotifyItem[] = []
  let duplicateCount = 0

  for (const item of items) {
    const key = `${item.platform}:${item.item_id}`
    const existing = existingMap.get(key)

    if (!existing) {
      rawNewItems.push(item)
    } else if (
      item.price !== null &&
      item.price !== undefined &&
      existing.lastPrice !== null &&
      existing.lastPrice !== undefined &&
      item.price < existing.lastPrice
    ) {
      priceDropItems.push({ ...item, isPriceDrop: true, originalPrice: existing.lastPrice })
    } else {
      duplicateCount++
    }
  }

  // ── 2. Seller filtering (new items only) ──────────────────────────────────
  // Global seller blocklist drops item before per-keyword check
  // Per-keyword seller blocklist drops item not caught by global
  let filteredNewItems = rawNewItems.filter((item) => {
    if (isSellerBlocked(item.seller_name, item.seller_id, globalSellerBlocklist)) {
      return false
    }
    if (isSellerBlocked(item.seller_name, item.seller_id, keywordSellerBlocklist)) {
      return false
    }
    return true
  })

  // ── 3. maxNotifyPerScan cap ───────────────────────────────────────────────
  // New items after filtering are capped at maxNotifyPerScan
  if (filteredNewItems.length > cap) {
    filteredNewItems = filteredNewItems.slice(0, cap)
  }

  // ── 4. Persist SeenItems ─────────────────────────────────────────────────
  let insertedCount = 0
  if (filteredNewItems.length > 0) {
    const result = await prisma.seenItem.createMany({
      data: filteredNewItems.map((item) => ({
        userId,
        platform: item.platform,
        itemId: item.item_id,
        keyword: effectiveKeywordLabel,
        keywordId: keywordIdForRecord,
        lastPrice: item.price ?? null,
        itemName: item.name ? item.name.slice(0, 255) : null,
        itemUrl: isHttpUrl(item.url) ? item.url : null,
        imageUrl: isHttpUrl(item.image_url) ? item.image_url : null,
      })),
      skipDuplicates: true,
    })
    insertedCount = result.count
  }

  if (priceDropItems.length > 0) {
    await prisma.$transaction(
      priceDropItems.map((item) =>
        prisma.seenItem.updateMany({
          where: {
            userId,
            platform: item.platform,
            itemId: item.item_id,
          },
          data: {
            lastPrice: item.price,
            itemName: item.name ? item.name.slice(0, 255) : undefined,
            itemUrl: isHttpUrl(item.url) ? item.url : undefined,
            imageUrl: isHttpUrl(item.image_url) ? item.image_url : undefined,
          },
        })
      )
    )
  }

  // ── 5. Send notifications ─────────────────────────────────────────────────
  const notifyItems: NotifyItem[] = [...filteredNewItems, ...priceDropItems]

  if (notifyItems.length > 0) {
    await Promise.all([
      sendDiscordBatchNotification(
        effectiveWebhook,
        notificationSetting?.discordUserId ?? null,
        notifyItems,
        effectiveKeywordLabel
      ),
      sendEmailBatchNotification(
        notificationSetting?.emailAddress ?? null,
        notifyItems,
        effectiveKeywordLabel
      ),
    ])
  }

  return NextResponse.json({
    new: insertedCount,
    price_drop: priceDropItems.length,
    duplicate: duplicateCount,
  })
}
