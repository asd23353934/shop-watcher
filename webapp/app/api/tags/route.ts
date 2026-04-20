import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { HEX_COLOR_REGEX, MAX_TAG_NAME_LENGTH } from '@/lib/tag-validation'
import { CACHE_CONTROL_PRIVATE_SWR_60 } from '@/lib/utils'
import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'

// GET /api/tags — list tags owned by the authenticated user with usage counts
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授權' }, { status: 401 })
  }

  const tags = await prisma.tag.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'asc' },
    include: {
      _count: { select: { keywordTags: true, circleTags: true } },
    },
  })

  const payload = tags.map((t) => ({
    id: t.id,
    name: t.name,
    color: t.color,
    keywordCount: t._count.keywordTags,
    circleCount: t._count.circleTags,
  }))

  return NextResponse.json(payload, {
    headers: { 'Cache-Control': CACHE_CONTROL_PRIVATE_SWR_60 },
  })
}

// POST /api/tags — create a tag for the authenticated user
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授權' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '無效的 JSON' }, { status: 400 })
  }

  const { name, color } = body

  if (typeof name !== 'string') {
    return NextResponse.json({ error: 'name 必填' }, { status: 400 })
  }
  const trimmed = name.trim()
  if (!trimmed) {
    return NextResponse.json({ error: '標籤名稱不可為空' }, { status: 400 })
  }
  if (trimmed.length > MAX_TAG_NAME_LENGTH) {
    return NextResponse.json(
      { error: `標籤名稱不可超過 ${MAX_TAG_NAME_LENGTH} 字元` },
      { status: 400 }
    )
  }

  if (color !== undefined && color !== null) {
    if (typeof color !== 'string' || !HEX_COLOR_REGEX.test(color)) {
      return NextResponse.json(
        { error: '顏色格式錯誤（需為 #RRGGBB）' },
        { status: 400 }
      )
    }
  }

  try {
    const tag = await prisma.tag.create({
      data: {
        userId: session.user.id,
        name: trimmed,
        color: (color as string | null | undefined) ?? null,
      },
    })
    return NextResponse.json(
      {
        id: tag.id,
        name: tag.name,
        color: tag.color,
        keywordCount: 0,
        circleCount: 0,
      },
      { status: 201 }
    )
  } catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json({ error: '標籤名稱已存在' }, { status: 409 })
    }
    console.error('POST /api/tags error:', err)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}
