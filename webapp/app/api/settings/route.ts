import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { isValidDiscordWebhookUrl } from '@/lib/webhook-validation'
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
      emailAddress: null,
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

  const body = await request.json()
  const { discordWebhookUrl, discordUserId, emailAddress, globalSellerBlocklist } = body

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
    if (!/^\d{17,20}$/.test(discordUserId.trim())) {
      return NextResponse.json({ error: 'Invalid Discord User ID' }, { status: 400 })
    }
  }

  // Validate email format — Invalid email format is rejected
  if (emailAddress && emailAddress.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailAddress.trim())) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }
  }

  const parsedGlobalSellerBlocklist: string[] = Array.isArray(globalSellerBlocklist)
    ? globalSellerBlocklist.map((w: string) => String(w).trim()).filter((w) => w.length > 0)
    : []

  // Upsert notification settings — Notification settings are isolated per user
  const settings = await prisma.notificationSetting.upsert({
    where: { userId: session.user.id },
    update: {
      discordWebhookUrl: discordWebhookUrl?.trim() || null,
      discordUserId: discordUserId?.trim() || null,
      emailAddress: emailAddress?.trim() || null,
      globalSellerBlocklist: parsedGlobalSellerBlocklist,
    },
    create: {
      userId: session.user.id,
      discordWebhookUrl: discordWebhookUrl?.trim() || null,
      discordUserId: discordUserId?.trim() || null,
      emailAddress: emailAddress?.trim() || null,
      globalSellerBlocklist: parsedGlobalSellerBlocklist,
    },
  })

  return NextResponse.json(settings)
}

// PATCH /api/settings — partial update (supports globalSellerBlocklist)
export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { discordWebhookUrl, discordUserId, emailAddress, globalSellerBlocklist } = body

  if (discordWebhookUrl !== undefined && discordWebhookUrl && discordWebhookUrl.trim() !== '') {
    if (!isValidDiscordWebhookUrl(discordWebhookUrl)) {
      return NextResponse.json(
        { error: 'Invalid Discord Webhook URL' },
        { status: 400 }
      )
    }
  }

  if (discordUserId !== undefined && discordUserId && discordUserId.trim() !== '') {
    if (!/^\d{17,20}$/.test(discordUserId.trim())) {
      return NextResponse.json({ error: 'Invalid Discord User ID' }, { status: 400 })
    }
  }

  if (emailAddress !== undefined && emailAddress && emailAddress.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailAddress.trim())) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }
  }

  const parsedGlobalSellerBlocklist: string[] | undefined = globalSellerBlocklist !== undefined
    ? (Array.isArray(globalSellerBlocklist)
        ? globalSellerBlocklist.map((w: string) => String(w).trim()).filter((w) => w.length > 0)
        : [])
    : undefined

  const settings = await prisma.notificationSetting.upsert({
    where: { userId: session.user.id },
    update: {
      ...(discordWebhookUrl !== undefined && { discordWebhookUrl: discordWebhookUrl?.trim() || null }),
      ...(discordUserId !== undefined && { discordUserId: discordUserId?.trim() || null }),
      ...(emailAddress !== undefined && { emailAddress: emailAddress?.trim() || null }),
      ...(parsedGlobalSellerBlocklist !== undefined && { globalSellerBlocklist: parsedGlobalSellerBlocklist }),
    },
    create: {
      userId: session.user.id,
      discordWebhookUrl: discordWebhookUrl?.trim() || null,
      discordUserId: discordUserId?.trim() || null,
      emailAddress: emailAddress?.trim() || null,
      globalSellerBlocklist: parsedGlobalSellerBlocklist ?? [],
    },
  })

  return NextResponse.json(settings)
}
