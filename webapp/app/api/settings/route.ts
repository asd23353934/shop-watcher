import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
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

  // Return empty object if not yet configured (fields will default to null)
  return NextResponse.json(settings ?? { discordWebhookUrl: null, discordUserId: null, emailAddress: null })
}

// POST /api/settings — upsert notification settings
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { discordWebhookUrl, discordUserId, emailAddress } = body

  // Validate Discord Webhook URL — Invalid Discord Webhook URL is rejected
  if (discordWebhookUrl && discordWebhookUrl.trim() !== '') {
    if (!discordWebhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      return NextResponse.json(
        { error: 'Invalid Discord Webhook URL. Must start with https://discord.com/api/webhooks/' },
        { status: 400 }
      )
    }
  }

  // Validate email format — Invalid email format is rejected
  if (emailAddress && emailAddress.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailAddress.trim())) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }
  }

  // Upsert notification settings — Notification settings are isolated per user
  const settings = await prisma.notificationSetting.upsert({
    where: { userId: session.user.id },
    update: {
      discordWebhookUrl: discordWebhookUrl?.trim() || null,
      discordUserId: discordUserId?.trim() || null,
      // User clears email address to disable email notifications — store null when cleared
      emailAddress: emailAddress?.trim() || null,
    },
    create: {
      userId: session.user.id,
      discordWebhookUrl: discordWebhookUrl?.trim() || null,
      discordUserId: discordUserId?.trim() || null,
      emailAddress: emailAddress?.trim() || null,
    },
  })

  return NextResponse.json(settings)
}
