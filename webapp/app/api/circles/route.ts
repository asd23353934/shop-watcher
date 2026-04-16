import { auth } from '@/auth'
import { CIRCLE_PLATFORMS } from '@/constants/platform'
import { prisma } from '@/lib/prisma'
import { CACHE_CONTROL_PRIVATE_SWR_60 } from '@/lib/utils'
import { isValidDiscordWebhookUrl } from '@/lib/webhook-validation'
import { NextResponse } from 'next/server'

/**
 * POST /api/circles — follow a BOOTH shop or DLsite circle
 * GET  /api/circles — list all CircleFollows for the current user
 */

const MAX_FREE_CIRCLES = 3

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const follows = await prisma.circleFollow.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(
    follows,
    { headers: { 'Cache-Control': CACHE_CONTROL_PRIVATE_SWR_60 } }
  )
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { platform, circleId, circleName, webhookUrl, active } = body

  const ownerEmail = process.env.OWNER_EMAIL?.toLowerCase()
  const isOwner = ownerEmail && session.user.email?.toLowerCase() === ownerEmail
  if (!isOwner) {
    try {
      const circleCount = await prisma.circleFollow.count({ where: { userId: session.user.id } })
      if (circleCount >= MAX_FREE_CIRCLES) {
        return NextResponse.json({ error: '免費方案最多只能追蹤 3 個社團' }, { status: 403 })
      }
    } catch (err: unknown) {
      console.error('Failed to count circles:', err)
      return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
    }
  }

  if (!platform || !CIRCLE_PLATFORMS.includes(platform as string)) {
    return NextResponse.json(
      { error: 'platform must be "booth" or "dlsite"' },
      { status: 400 }
    )
  }

  if (!circleId || typeof circleId !== 'string' || circleId.trim() === '') {
    return NextResponse.json({ error: 'circleId is required' }, { status: 400 })
  }

  const CIRCLE_ID_PATTERNS: Record<string, RegExp> = {
    booth: /^[a-zA-Z0-9][-a-zA-Z0-9]{0,63}$/,
    dlsite: /^[A-Z]{2}\d{3,10}$/,
  }
  const idPattern = CIRCLE_ID_PATTERNS[platform as string]
  if (idPattern && !idPattern.test((circleId as string).trim())) {
    return NextResponse.json(
      { error: `無效的社團 ID 格式（平台：${platform}）` },
      { status: 400 }
    )
  }

  if (!circleName || typeof circleName !== 'string' || circleName.trim() === '') {
    return NextResponse.json({ error: 'circleName is required' }, { status: 400 })
  }

  if (webhookUrl !== undefined && webhookUrl !== null) {
    if (!isValidDiscordWebhookUrl(webhookUrl)) {
      return NextResponse.json(
        { error: 'Invalid Discord Webhook URL' },
        { status: 400 }
      )
    }
  }

  // Duplicate CircleFollow is rejected (@@unique([userId, platform, circleId]))
  try {
    const follow = await prisma.circleFollow.create({
      data: {
        userId: session.user.id,
        platform: platform as string,
        circleId: (circleId as string).trim(),
        circleName: (circleName as string).trim(),
        webhookUrl: webhookUrl ? (webhookUrl as string).trim() : null,
        active: active !== false,
      },
    })

    return NextResponse.json(follow, { status: 201 })
  } catch (err: unknown) {
    // Prisma unique constraint violation → P2002
    if (
      err instanceof Error &&
      'code' in err &&
      (err as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: '已追蹤此社團（重複的平台/社團組合）' },
        { status: 409 }
      )
    }
    console.error('POST /api/circles error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
