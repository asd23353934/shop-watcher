import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { isValidDiscordWebhookUrl } from '@/lib/webhook-validation'
import { DISCORD_USER_ID_RE } from '@/lib/utils'
import { NextResponse } from 'next/server'

// GET /api/settings — Settings are pre-filled with existing values on load
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const settings = await prisma.notificationSetting.findUnique({
    where: { userId: session.user.id },
  })

  // Return empty object with defaults if not yet configured
  return NextResponse.json(
    settings ?? {
      discordWebhookUrl: null,
      discordUserId: null,
      emailEnabled: false,
      globalSellerBlocklist: [],
    }
  )
}

// POST /api/settings — upsert notification settings
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { discordWebhookUrl, discordUserId, emailEnabled, globalSellerBlocklist } = body

  // Validate Discord Webhook URL — Invalid Discord Webhook URL is rejected
  if (discordWebhookUrl && discordWebhookUrl.trim() !== '') {
    if (!isValidDiscordWebhookUrl(discordWebhookUrl)) {
      return NextResponse.json(
        { error: 'Invalid Discord Webhook URL' },
        { status: 400 }
      )
    }
  }

  // Validate Discord User ID — must be a numeric snowflake (17-20 digits)
  if (discordUserId && discordUserId.trim() !== '') {
    if (!DISCORD_USER_ID_RE.test(discordUserId.trim())) {
      return NextResponse.json({ error: 'Invalid Discord User ID' }, { status: 400 })
    }
  }

  const parsedGlobalSellerBlocklist: string[] = Array.isArray(globalSellerBlocklist)
    ? globalSellerBlocklist.map((w: string) => String(w).trim()).filter((w) => w.length > 0)
    : []

  try {
    // Upsert notification settings — Notification settings are isolated per user
    const settings = await prisma.notificationSetting.upsert({
      where: { userId: session.user.id },
      update: {
        discordWebhookUrl: discordWebhookUrl?.trim() || null,
        discordUserId: discordUserId?.trim() || null,
        emailEnabled: emailEnabled === true,
        globalSellerBlocklist: parsedGlobalSellerBlocklist,
      },
      create: {
        userId: session.user.id,
        discordWebhookUrl: discordWebhookUrl?.trim() || null,
        discordUserId: discordUserId?.trim() || null,
        emailEnabled: emailEnabled === true,
        globalSellerBlocklist: parsedGlobalSellerBlocklist,
      },
    })

    return NextResponse.json(settings)
  } catch (err: unknown) {
    console.error('Failed to upsert settings:', err)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}

// PATCH /api/settings — partial update (supports globalSellerBlocklist)
export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { discordWebhookUrl, discordUserId, emailEnabled, globalSellerBlocklist } = body

  if (discordWebhookUrl !== undefined && discordWebhookUrl && discordWebhookUrl.trim() !== '') {
    if (!isValidDiscordWebhookUrl(discordWebhookUrl)) {
      return NextResponse.json(
        { error: 'Invalid Discord Webhook URL' },
        { status: 400 }
      )
    }
  }

  if (discordUserId !== undefined && discordUserId && discordUserId.trim() !== '') {
    if (!DISCORD_USER_ID_RE.test(discordUserId.trim())) {
      return NextResponse.json({ error: 'Invalid Discord User ID' }, { status: 400 })
    }
  }

  const parsedGlobalSellerBlocklist: string[] | undefined = globalSellerBlocklist !== undefined
    ? (Array.isArray(globalSellerBlocklist)
        ? globalSellerBlocklist.map((w: string) => String(w).trim()).filter((w) => w.length > 0)
        : [])
    : undefined

  try {
    const settings = await prisma.notificationSetting.upsert({
      where: { userId: session.user.id },
      update: {
        ...(discordWebhookUrl !== undefined && { discordWebhookUrl: discordWebhookUrl?.trim() || null }),
        ...(discordUserId !== undefined && { discordUserId: discordUserId?.trim() || null }),
        ...(emailEnabled !== undefined && { emailEnabled: emailEnabled === true }),
        ...(parsedGlobalSellerBlocklist !== undefined && { globalSellerBlocklist: parsedGlobalSellerBlocklist }),
      },
      create: {
        userId: session.user.id,
        discordWebhookUrl: discordWebhookUrl?.trim() || null,
        discordUserId: discordUserId?.trim() || null,
        emailEnabled: emailEnabled === true,
        globalSellerBlocklist: parsedGlobalSellerBlocklist ?? [],
      },
    })

    return NextResponse.json(settings)
  } catch (err: unknown) {
    console.error('Failed to upsert settings:', err)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}
