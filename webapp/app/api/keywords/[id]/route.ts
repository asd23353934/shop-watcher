import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { isValidDiscordWebhookUrl } from '@/lib/webhook-validation'
import { NextResponse } from 'next/server'

const VALID_PLATFORMS = [
  'shopee', 'ruten', 'pchome', 'momo', 'animate',
  'yahoo-auction', 'mandarake', 'myacg', 'kingstone',
  'booth', 'dlsite', 'toranoana', 'melonbooks',
]

function validateNewFields(body: Record<string, unknown>): NextResponse | null {
  const { discordWebhookUrl, maxNotifyPerScan } = body

  if (discordWebhookUrl !== undefined && discordWebhookUrl !== null) {
    if (!isValidDiscordWebhookUrl(discordWebhookUrl)) {
      return NextResponse.json(
        { error: 'Invalid Discord Webhook URL' },
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

// PATCH /api/keywords/[id] — update a keyword
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const existing = await prisma.keyword.findUnique({ where: { id } })

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // User cannot edit another user's keyword
  if (existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const {
    keyword, platforms, minPrice, maxPrice, active,
    blocklist, mustInclude, matchMode,
    sellerBlocklist, discordWebhookUrl, maxNotifyPerScan,
  } = body

  const validMatchModes = ['any', 'all', 'exact']
  if (matchMode !== undefined && !validMatchModes.includes(matchMode)) {
    return NextResponse.json({ error: `Invalid matchMode: must be one of ${validMatchModes.join(', ')}` }, { status: 400 })
  }

  if (platforms !== undefined) {
    if (!Array.isArray(platforms) || platforms.length === 0 || platforms.some((p: unknown) => !VALID_PLATFORMS.includes(p as string))) {
      return NextResponse.json({ error: '請至少選擇一個平台' }, { status: 400 })
    }
  }

  if (minPrice !== undefined && minPrice !== null && Number(minPrice) < 0) {
    return NextResponse.json({ error: 'minPrice cannot be negative' }, { status: 400 })
  }
  if (maxPrice !== undefined && maxPrice !== null && Number(maxPrice) < 0) {
    return NextResponse.json({ error: 'maxPrice cannot be negative' }, { status: 400 })
  }

  // Validate three new fields
  const newFieldsError = validateNewFields(body)
  if (newFieldsError) return newFieldsError

  const updated = await prisma.keyword.update({
    where: { id },
    data: {
      ...(keyword !== undefined && { keyword: keyword.trim() }),
      ...(platforms !== undefined && { platforms }),
      ...(minPrice !== undefined && { minPrice: minPrice != null ? Number(minPrice) : null }),
      ...(maxPrice !== undefined && { maxPrice: maxPrice != null ? Number(maxPrice) : null }),
      ...(active !== undefined && { active }),
      ...(blocklist !== undefined && {
        blocklist: Array.isArray(blocklist)
          ? blocklist.map((w: string) => w.trim()).filter((w: string) => w.length > 0)
          : [],
      }),
      ...(mustInclude !== undefined && {
        mustInclude: Array.isArray(mustInclude)
          ? mustInclude.map((w: string) => w.trim()).filter((w: string) => w.length > 0)
          : [],
      }),
      ...(matchMode !== undefined && { matchMode }),
      ...(sellerBlocklist !== undefined && {
        sellerBlocklist: Array.isArray(sellerBlocklist)
          ? sellerBlocklist.map((w: string) => w.trim()).filter((w: string) => w.length > 0)
          : [],
      }),
      // Allow explicit null to clear discordWebhookUrl
      ...('discordWebhookUrl' in body && {
        discordWebhookUrl: discordWebhookUrl ?? null,
      }),
      ...(maxNotifyPerScan !== undefined && {
        maxNotifyPerScan: maxNotifyPerScan != null ? Number(maxNotifyPerScan) : null,
      }),
    },
  })

  return NextResponse.json(updated)
}

// DELETE /api/keywords/[id] — delete a keyword
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const existing = await prisma.keyword.findUnique({ where: { id } })

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // User cannot delete another user's keyword
  if (existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Deleting a keyword does not delete its SeenItem history
  await prisma.keyword.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
