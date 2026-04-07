import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

const VALID_CIRCLE_PLATFORMS = ['booth', 'dlsite']

/**
 * POST /api/circles — follow a BOOTH shop or DLsite circle
 * GET  /api/circles — list all CircleFollows for the current user
 */

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const follows = await prisma.circleFollow.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(follows)
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

  if (!platform || !VALID_CIRCLE_PLATFORMS.includes(platform as string)) {
    return NextResponse.json(
      { error: 'platform must be "booth" or "dlsite"' },
      { status: 400 }
    )
  }

  if (!circleId || typeof circleId !== 'string' || circleId.trim() === '') {
    return NextResponse.json({ error: 'circleId is required' }, { status: 400 })
  }

  if (!circleName || typeof circleName !== 'string' || circleName.trim() === '') {
    return NextResponse.json({ error: 'circleName is required' }, { status: 400 })
  }

  if (webhookUrl !== undefined && webhookUrl !== null) {
    if (
      typeof webhookUrl !== 'string' ||
      !webhookUrl.startsWith('https://discord.com/api/webhooks/')
    ) {
      return NextResponse.json(
        { error: 'webhookUrl must start with https://discord.com/api/webhooks/' },
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
