import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// Allowed platforms (expand here as new scrapers are added)
const VALID_PLATFORMS = [
  'shopee', 'ruten', 'pchome', 'momo', 'animate',
  'yahoo-auction', 'mandarake', 'myacg', 'kingstone',
  'booth', 'dlsite', 'toranoana', 'melonbooks',
]

/**
 * Validates the three new keyword fields.
 * Returns an error response if invalid, or null if valid.
 */
function validateNewFields(body: Record<string, unknown>): NextResponse | null {
  const { discordWebhookUrl, maxNotifyPerScan } = body

  if (discordWebhookUrl !== undefined && discordWebhookUrl !== null) {
    if (
      typeof discordWebhookUrl !== 'string' ||
      !discordWebhookUrl.startsWith('https://discord.com/api/webhooks/')
    ) {
      return NextResponse.json(
        { error: 'discordWebhookUrl must start with https://discord.com/api/webhooks/' },
        { status: 400 }
      )
    }
  }

  if (maxNotifyPerScan !== undefined && maxNotifyPerScan !== null) {
    const n = Number(maxNotifyPerScan)
    if (!Number.isInteger(n) || n < 1) {
      return NextResponse.json(
        { error: 'maxNotifyPerScan must be a positive integer (>= 1)' },
        { status: 400 }
      )
    }
  }

  return null
}

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
  const {
    keyword, platforms, minPrice, maxPrice, active,
    blocklist, mustInclude, matchMode,
    sellerBlocklist, discordWebhookUrl, maxNotifyPerScan,
  } = body

  // Keyword creation with empty keyword string is rejected
  if (!keyword || typeof keyword !== 'string' || keyword.trim() === '') {
    return NextResponse.json({ error: 'Keyword cannot be empty' }, { status: 400 })
  }

  // Keyword creation with no platform selected is rejected
  if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
    return NextResponse.json({ error: 'At least one platform must be selected' }, { status: 400 })
  }

  const invalidPlatforms = platforms.filter((p: string) => !VALID_PLATFORMS.includes(p))
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

  const validMatchModes = ['any', 'all', 'exact']
  if (matchMode != null && !validMatchModes.includes(matchMode)) {
    return NextResponse.json({ error: `Invalid matchMode: must be one of ${validMatchModes.join(', ')}` }, { status: 400 })
  }

  // Validate three new fields
  const newFieldsError = validateNewFields(body)
  if (newFieldsError) return newFieldsError

  const parsedBlocklist: string[] = Array.isArray(blocklist)
    ? blocklist.map((w: string) => w.trim()).filter((w: string) => w.length > 0)
    : []

  const parsedMustInclude: string[] = Array.isArray(mustInclude)
    ? mustInclude.map((w: string) => w.trim()).filter((w: string) => w.length > 0)
    : []

  const parsedSellerBlocklist: string[] = Array.isArray(sellerBlocklist)
    ? sellerBlocklist.map((w: string) => w.trim()).filter((w: string) => w.length > 0)
    : []

  const newKeyword = await prisma.keyword.create({
    data: {
      userId: session.user.id,
      keyword: keyword.trim(),
      platforms,
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
}
