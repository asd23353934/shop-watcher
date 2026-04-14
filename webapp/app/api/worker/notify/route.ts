import { verifyWorkerToken } from '@/lib/worker-auth'
import { prisma } from '@/lib/prisma'
import { sendDiscordNotification } from '@/lib/discord'
import { sendEmailNotification } from '@/lib/email'
import { isHttpUrl } from '@/lib/utils'
import { NextResponse } from 'next/server'

interface NotifyPayload {
  keyword_id: string
  platform: string
  item_id: string
  name: string
  price: number | null
  url: string
  image_url: string | null
}

/**
 * POST /api/worker/notify
 * Receives a scraped item, deduplicates, and triggers notifications.
 *
 * POST /api/worker/notify receives a scraped item and triggers deduplication and notifications
 * Deduplication is scoped per user
 */
export async function POST(request: Request) {
  const authError = verifyWorkerToken(request)
  if (authError) return authError

  let body: NotifyPayload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { keyword_id, platform, item_id, name, price, url, image_url } = body

  // Invalid payload returns 400
  if (!keyword_id || !item_id) {
    return NextResponse.json({ error: 'keyword_id and item_id are required' }, { status: 400 })
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

  // SeenItem unique constraint deduplication — scoped per user
  // If already seen, return duplicate status
  const existing = await prisma.seenItem.findUnique({
    where: {
      userId_platform_itemId: {
        userId,
        platform,
        itemId: item_id,
      },
    },
  })

  if (existing) {
    return NextResponse.json({ status: 'duplicate' })
  }

  // New item — insert SeenItem record
  await prisma.seenItem.create({
    data: {
      userId,
      platform,
      itemId: item_id,
      keyword: keyword.keyword,
      keywordId: keyword_id,
      itemName: name ? name.slice(0, 255) : null,
      itemUrl: isHttpUrl(url) ? url : null,
      imageUrl: isHttpUrl(image_url) ? image_url : null,
    },
  })

  const item = { name, price, url, image_url, platform, item_id }
  const notificationSetting = keyword.user.notificationSetting

  // Send Discord notification (errors are caught internally and don't block response)
  await sendDiscordNotification(
    notificationSetting?.discordWebhookUrl ?? null,
    notificationSetting?.discordUserId ?? null,
    item,
    keyword.keyword
  )

  // Send email notification — only when emailEnabled, use the user's Google account email
  const emailAddress = notificationSetting?.emailEnabled ? (keyword.user.email ?? null) : null
  await sendEmailNotification(
    emailAddress,
    item,
    keyword.keyword
  )

  return NextResponse.json({ status: 'new' })
}
