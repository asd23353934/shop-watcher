import { auth } from '@/auth'
import { VALID_PLATFORMS } from '@/constants/platform'
import { MIN_KEYWORD_LENGTH, VALID_MATCH_MODES, validateKeywordFields } from '@/lib/keyword-validation'
import { prisma } from '@/lib/prisma'
import { toStringSet } from '@/lib/utils'
import { NextResponse } from 'next/server'

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

  if (existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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

  if (keyword !== undefined) {
    const trimmed = typeof keyword === 'string' ? keyword.trim() : ''
    if (!trimmed || trimmed.length < MIN_KEYWORD_LENGTH) {
      return NextResponse.json({ error: '關鍵字至少需要 2 個字元' }, { status: 400 })
    }
  }

  if (matchMode !== undefined && !(VALID_MATCH_MODES as readonly string[]).includes(matchMode)) {
    return NextResponse.json({ error: `Invalid matchMode: must be one of ${VALID_MATCH_MODES.join(', ')}` }, { status: 400 })
  }

  if (platforms !== undefined) {
    if (!Array.isArray(platforms) || platforms.length === 0 || platforms.some((p: unknown) => !VALID_PLATFORMS.includes(p as string))) {
      return NextResponse.json({ error: '請至少選擇一個平台' }, { status: 400 })
    }
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

  const newFieldsError = validateKeywordFields(body)
  if (newFieldsError) return newFieldsError

  const updated = await prisma.keyword.update({
    where: { id },
    data: {
      ...(keyword !== undefined && { keyword: (keyword as string).trim() }),
      ...(platforms !== undefined && { platforms: [...platforms].sort() }),
      ...(minPrice !== undefined && { minPrice: minPrice != null ? Number(minPrice) : null }),
      ...(maxPrice !== undefined && { maxPrice: maxPrice != null ? Number(maxPrice) : null }),
      ...(active !== undefined && { active }),
      ...(blocklist !== undefined && { blocklist: toStringSet(blocklist) }),
      ...(mustInclude !== undefined && { mustInclude: toStringSet(mustInclude) }),
      ...(matchMode !== undefined && { matchMode }),
      ...(sellerBlocklist !== undefined && { sellerBlocklist: toStringSet(sellerBlocklist) }),
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

  if (existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Deleting a keyword does not delete its SeenItem history
  await prisma.keyword.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
