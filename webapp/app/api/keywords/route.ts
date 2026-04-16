import { auth } from '@/auth'
import { VALID_PLATFORMS } from '@/constants/platform'
import { MIN_KEYWORD_LENGTH, VALID_MATCH_MODES, validateKeywordFields } from '@/lib/keyword-validation'
import { prisma } from '@/lib/prisma'
import { CACHE_CONTROL_PRIVATE_SWR_60, toStringSet } from '@/lib/utils'
import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'

const MAX_FREE_KEYWORDS = 3

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

  return NextResponse.json(
    keywords,
    { headers: { 'Cache-Control': CACHE_CONTROL_PRIVATE_SWR_60 } }
  )
}

// POST /api/keywords — create a new keyword
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
  const {
    keyword, platforms, minPrice, maxPrice, active,
    blocklist, mustInclude, matchMode,
    sellerBlocklist, discordWebhookUrl, maxNotifyPerScan,
  } = body

  const trimmedKeyword = typeof keyword === 'string' ? keyword.trim() : ''
  if (!trimmedKeyword) {
    return NextResponse.json({ error: 'Keyword cannot be empty' }, { status: 400 })
  }
  if (trimmedKeyword.length < MIN_KEYWORD_LENGTH) {
    return NextResponse.json({ error: '關鍵字至少需要 2 個字元' }, { status: 400 })
  }

  const ownerEmail = process.env.OWNER_EMAIL?.toLowerCase()
  const isOwner = ownerEmail && session.user.email?.toLowerCase() === ownerEmail
  if (!isOwner) {
    try {
      const keywordCount = await prisma.keyword.count({ where: { userId: session.user.id } })
      if (keywordCount >= MAX_FREE_KEYWORDS) {
        return NextResponse.json({ error: '免費方案最多只能新增 3 個關鍵字' }, { status: 403 })
      }
    } catch (err: unknown) {
      console.error('Failed to count keywords:', err)
      return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
    }
  }

  if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
    return NextResponse.json({ error: 'At least one platform must be selected' }, { status: 400 })
  }

  const invalidPlatforms = platforms.filter((p: string) => !VALID_PLATFORMS.includes(p))
  if (invalidPlatforms.length > 0) {
    return NextResponse.json({ error: `Invalid platforms: ${invalidPlatforms.join(', ')}` }, { status: 400 })
  }

  if (minPrice !== undefined && minPrice !== null) {
    const n = Number(minPrice)
    if (isNaN(n) || n < 0) {
      return NextResponse.json({ error: 'minPrice must be a non-negative number' }, { status: 400 })
    }
  }
  if (maxPrice !== undefined && maxPrice !== null) {
    const n = Number(maxPrice)
    if (isNaN(n) || n < 0) {
      return NextResponse.json({ error: 'maxPrice must be a non-negative number' }, { status: 400 })
    }
  }
  if (minPrice != null && maxPrice != null && Number(minPrice) > Number(maxPrice)) {
    return NextResponse.json({ error: 'minPrice cannot be greater than maxPrice' }, { status: 400 })
  }

  if (matchMode != null && !(VALID_MATCH_MODES as readonly string[]).includes(matchMode)) {
    return NextResponse.json({ error: `Invalid matchMode: must be one of ${VALID_MATCH_MODES.join(', ')}` }, { status: 400 })
  }

  const newFieldsError = validateKeywordFields(body)
  if (newFieldsError) return newFieldsError

  // Sort platforms to ensure order-independent duplicate detection
  const sortedPlatforms: string[] = [...platforms].sort()

  const existing = await prisma.keyword.findFirst({
    where: {
      userId: session.user.id,
      keyword: trimmedKeyword,
      platforms: { equals: sortedPlatforms },
    },
  })
  if (existing) {
    return NextResponse.json({ error: '此關鍵字與平台組合已存在' }, { status: 409 })
  }

  const parsedBlocklist = toStringSet(blocklist)
  const parsedMustInclude = toStringSet(mustInclude)
  const parsedSellerBlocklist = toStringSet(sellerBlocklist)

  try {
    const newKeyword = await prisma.keyword.create({
      data: {
        userId: session.user.id,
        keyword: trimmedKeyword,
        platforms: sortedPlatforms,
        minPrice: minPrice != null ? Number(minPrice) : null,
        maxPrice: maxPrice != null ? Number(maxPrice) : null,
        blocklist: parsedBlocklist,
        mustInclude: parsedMustInclude,
        matchMode: matchMode ?? 'any',
        active: active !== false,
        sellerBlocklist: parsedSellerBlocklist,
        discordWebhookUrl: discordWebhookUrl ?? null,
        maxNotifyPerScan: maxNotifyPerScan != null ? Number(maxNotifyPerScan) : null,
      },
    })

    return NextResponse.json(newKeyword, { status: 201 })
  } catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json({ error: '此關鍵字與平台組合已存在' }, { status: 409 })
    }
    console.error('Failed to create keyword:', err)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}
