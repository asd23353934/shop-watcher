import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET /api/keywords — User's keyword list shows only their own keywords
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const keywords = await prisma.keyword.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(keywords)
}

// POST /api/keywords — create a new keyword
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { keyword, platforms, minPrice, maxPrice, active, blocklist } = body

  // Keyword creation with empty keyword string is rejected
  if (!keyword || typeof keyword !== 'string' || keyword.trim() === '') {
    return NextResponse.json({ error: 'Keyword cannot be empty' }, { status: 400 })
  }

  // Keyword creation with no platform selected is rejected
  if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
    return NextResponse.json({ error: 'At least one platform must be selected' }, { status: 400 })
  }

  const validPlatforms = ['shopee', 'ruten']
  const invalidPlatforms = platforms.filter((p: string) => !validPlatforms.includes(p))
  if (invalidPlatforms.length > 0) {
    return NextResponse.json({ error: `Invalid platforms: ${invalidPlatforms.join(', ')}` }, { status: 400 })
  }

  // Duplicate keyword creation is rejected for the same user
  const existing = await prisma.keyword.findFirst({
    where: {
      userId: session.user.id,
      keyword: keyword.trim(),
      platforms: { equals: platforms },
    },
  })
  if (existing) {
    return NextResponse.json({ error: '此關鍵字與平台組合已存在' }, { status: 409 })
  }

  const parsedBlocklist: string[] = Array.isArray(blocklist)
    ? blocklist.map((w: string) => w.trim()).filter((w: string) => w.length > 0)
    : []

  const newKeyword = await prisma.keyword.create({
    data: {
      userId: session.user.id,
      keyword: keyword.trim(),
      platforms,
      minPrice: minPrice != null ? Number(minPrice) : null,
      maxPrice: maxPrice != null ? Number(maxPrice) : null,
      blocklist: parsedBlocklist,
      active: active !== false,
    },
  })

  return NextResponse.json(newKeyword, { status: 201 })
}
