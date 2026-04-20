import { verifyWorkerToken } from '@/lib/worker-auth'
import { prisma } from '@/lib/prisma'
import { sendDiscordBatchNotification } from '@/lib/discord'
import { sendEmailBatchNotification } from '@/lib/email'
import { isHttpUrl } from '@/lib/utils'
import { ensureSystemTagRules, compilePattern, applyRulesToTitle, type CompiledRule } from '@/lib/auto-tag'
import { NextResponse, after } from 'next/server'

// Upper bound on batch size — protects the `OR: items.map(...)` dedup query from exploding
// if a scraper bug or misbehaving Worker sends a huge payload. Real scrapers yield ≤ 50 items
// per scan; 500 leaves generous headroom while preventing DB CPU exhaustion.
const MAX_ITEMS_PER_BATCH = 500

interface BatchItem {
  platform: string
  itemId: string
  name: string
  price: number | null
  priceText?: string | null
  url: string
  imageUrl: string | null
  sellerName: string | null
  sellerId?: string | null
}

interface BatchPayload {
  keywordId?: string | null
  circleFollowId?: string | null
  items: BatchItem[]
  keywordWebhookUrl?: string | null
  maxNotifyPerScan?: number | null
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
  const sn = (sellerName ?? '').toLowerCase()
  const si = (sellerId ?? '').toLowerCase()
  return blocklist.some((entry) => {
    const e = entry.toLowerCase()
    return (sn && sn.includes(e)) || (si && si.includes(e))
  })
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
    keywordId,
    circleFollowId,
    items,
    keywordWebhookUrl,
    maxNotifyPerScan: payloadMaxNotify,
  } = body

  if (!Array.isArray(items)) {
    return NextResponse.json(
      { error: 'items array is required' },
      { status: 400 }
    )
  }
  if (items.length > MAX_ITEMS_PER_BATCH) {
    return NextResponse.json(
      { error: `items array exceeds maximum size of ${MAX_ITEMS_PER_BATCH}` },
      { status: 413 }
    )
  }
  if (keywordId && circleFollowId) {
    return NextResponse.json(
      { error: 'keywordId and circleFollowId are mutually exclusive' },
      { status: 400 }
    )
  }
  if (!keywordId && !circleFollowId) {
    return NextResponse.json(
      { error: 'keywordId or circleFollowId is required' },
      { status: 400 }
    )
  }

  if (payloadMaxNotify != null) {
    const n = Number(payloadMaxNotify)
    if (!Number.isInteger(n) || n < 1 || n > 10000) {
      return NextResponse.json({ error: 'maxNotifyPerScan must be a positive integer between 1 and 10000' }, { status: 400 })
    }
  }

  if (items.length === 0) {
    return NextResponse.json({ new: 0, price_drop: 0, duplicate: 0 })
  }

  const envMax = parseInt(process.env.MAX_NOTIFY_PER_BATCH ?? '100', 10) || 100

  let userId: string
  let notificationSetting: { discordWebhookUrl: string | null; discordUserId: string | null; emailEnabled: boolean; globalSellerBlocklist: string[] } | null = null
  let userEmail: string | null = null
  let effectiveKeywordLabel: string
  let effectiveWebhook: string | null
  let keywordSellerBlocklist: string[] = []
  let keywordIdForRecord: string | null = null
  let cap: number

  if (keywordId) {
    const keyword = await prisma.keyword.findUnique({
      where: { id: keywordId },
      include: { user: { include: { notificationSetting: true } } },
    })
    if (!keyword) {
      return NextResponse.json({ error: 'Keyword not found' }, { status: 404 })
    }
    userId = keyword.userId
    notificationSetting = keyword.user.notificationSetting
    userEmail = keyword.user.email ?? null
    effectiveKeywordLabel = keyword.keyword
    keywordSellerBlocklist = keyword.sellerBlocklist ?? []
    keywordIdForRecord = keywordId

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
    const circleFollow = await prisma.circleFollow.findUnique({
      where: { id: circleFollowId! },
      include: { user: { include: { notificationSetting: true } } },
    })
    if (!circleFollow) {
      return NextResponse.json({ error: 'CircleFollow not found' }, { status: 404 })
    }
    userId = circleFollow.userId
    notificationSetting = circleFollow.user.notificationSetting
    userEmail = circleFollow.user.email ?? null
    effectiveKeywordLabel = `circle:${circleFollow.circleName}`
    keywordIdForRecord = null

    effectiveWebhook =
      keywordWebhookUrl !== undefined
        ? (keywordWebhookUrl ?? circleFollow.webhookUrl ?? notificationSetting?.discordWebhookUrl ?? null)
        : (circleFollow.webhookUrl ?? notificationSetting?.discordWebhookUrl ?? null)

    cap = payloadMaxNotify != null ? payloadMaxNotify : envMax
  }

  const globalSellerBlocklist: string[] = notificationSetting?.globalSellerBlocklist ?? []

  // ── 1. Deduplication ──────────────────────────────────────────────────────
  const existingRecords = await prisma.seenItem.findMany({
    where: {
      userId,
      OR: items.map((item) => ({
        platform: item.platform,
        itemId: item.itemId,
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
    const key = `${item.platform}:${item.itemId}`
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

  // ── 2. Seller filtering (new items + price-drops) ────────────────────────
  const combinedBlocklist = [...globalSellerBlocklist, ...keywordSellerBlocklist]

  let filteredNewItems = rawNewItems.filter(
    (item) => !isSellerBlocked(item.sellerName, item.sellerId, combinedBlocklist)
  )
  const filteredPriceDropItems = priceDropItems.filter(
    (item) => !isSellerBlocked(item.sellerName, item.sellerId, combinedBlocklist)
  )

  // ── 3. maxNotifyPerScan cap ───────────────────────────────────────────────
  if (filteredNewItems.length > cap) {
    filteredNewItems = filteredNewItems.slice(0, cap)
  }

  // ── 4. Persist SeenItems (atomically — createMany + price-drop updates share one transaction) ─
  // If either half fails, we must NOT send notifications, otherwise new items would be marked as
  // "seen" in DB but the user never got notified — on the next scan they'd be treated as duplicates.
  let insertedCount = 0
  try {
    await prisma.$transaction(async (tx) => {
      if (filteredNewItems.length > 0) {
        const result = await tx.seenItem.createMany({
          data: filteredNewItems.map((item) => ({
            userId,
            platform: item.platform,
            itemId: item.itemId,
            keyword: effectiveKeywordLabel,
            keywordId: keywordIdForRecord,
            lastPrice: item.price ?? null,
            itemName: item.name ? item.name.slice(0, 255) : null,
            itemUrl: isHttpUrl(item.url) ? item.url : null,
            imageUrl: isHttpUrl(item.imageUrl) ? item.imageUrl : null,
          })),
          skipDuplicates: true,
        })
        insertedCount = result.count
      }

      for (const item of filteredPriceDropItems) {
        await tx.seenItem.updateMany({
          where: {
            userId,
            platform: item.platform,
            itemId: item.itemId,
          },
          data: {
            lastPrice: item.price,
            itemName: item.name ? item.name.slice(0, 255) : undefined,
            itemUrl: isHttpUrl(item.url) ? item.url : undefined,
            imageUrl: isHttpUrl(item.imageUrl) ? item.imageUrl : undefined,
          },
        })
      }
    })
  } catch (err: unknown) {
    console.error('[notify/batch] DB write failed:', err)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }

  // ── 4b. Apply auto-tag rules to newly inserted SeenItems ──────────────────
  if (filteredNewItems.length > 0 && insertedCount > 0) {
    try {
      await ensureSystemTagRules(userId)
      const rawRules = await prisma.tagRule.findMany({
        where: { userId, enabled: true },
        select: { id: true, tagId: true, pattern: true },
      })
      const compiled: CompiledRule[] = []
      for (const r of rawRules) {
        const res = compilePattern(r.pattern)
        if (res.ok) compiled.push({ id: r.id, tagId: r.tagId, regex: res.regex })
        else console.warn(`[notify/batch] skip invalid rule ${r.id}: ${res.reason}`)
      }

      if (compiled.length > 0) {
        const insertedKeys = new Set(filteredNewItems.map((it) => `${it.platform}:${it.itemId}`))
        const seenRows = await prisma.seenItem.findMany({
          where: {
            userId,
            OR: filteredNewItems.map((it) => ({ platform: it.platform, itemId: it.itemId })),
          },
          select: { id: true, platform: true, itemId: true, itemName: true },
        })

        const tagData: { seenItemId: string; tagId: string }[] = []
        for (const row of seenRows) {
          if (!insertedKeys.has(`${row.platform}:${row.itemId}`)) continue
          if (!row.itemName) continue
          const tagIds = applyRulesToTitle(row.itemName, compiled)
          for (const tagId of tagIds) tagData.push({ seenItemId: row.id, tagId })
        }

        if (tagData.length > 0) {
          await prisma.seenItemTag.createMany({ data: tagData, skipDuplicates: true })
        }
      }
    } catch (err) {
      console.error('[notify/batch] auto-tag failed:', err)
    }
  }

  // ── 5. Send notifications (after response to avoid Vercel timeout) ──────────
  const notifyItems: NotifyItem[] = [...filteredNewItems, ...filteredPriceDropItems]

  if (notifyItems.length > 0) {
    const webhookUrl = effectiveWebhook
    const discordUserId = notificationSetting?.discordUserId ?? null
    const emailAddress = notificationSetting?.emailEnabled ? userEmail : null
    const label = effectiveKeywordLabel
    after(async () => {
      try {
        await Promise.all([
          sendDiscordBatchNotification(webhookUrl, discordUserId, notifyItems, label),
          sendEmailBatchNotification(emailAddress, notifyItems, label),
        ])
      } catch (err) {
        console.error('[notify/batch] post-response notification failed:', err)
      }
    })
  }

  return NextResponse.json({
    new: insertedCount,
    price_drop: filteredPriceDropItems.length,
    duplicate: duplicateCount,
  })
}
