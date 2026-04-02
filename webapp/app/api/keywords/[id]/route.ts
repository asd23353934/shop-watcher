import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
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

  // User cannot edit another user's keyword
  if (existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { keyword, platforms, minPrice, maxPrice, active, blocklist, mustInclude, matchMode } = body

  const validMatchModes = ['any', 'all', 'exact']
  if (matchMode !== undefined && !validMatchModes.includes(matchMode)) {
    return NextResponse.json({ error: `Invalid matchMode: must be one of ${validMatchModes.join(', ')}` }, { status: 400 })
  }

  const validPlatforms = ['shopee', 'ruten']
  if (platforms !== undefined) {
    if (!Array.isArray(platforms) || platforms.some((p: unknown) => !validPlatforms.includes(p as string))) {
      return NextResponse.json({ error: 'Invalid platforms: must be array of shopee and/or ruten' }, { status: 400 })
    }
  }

  if (minPrice !== undefined && minPrice !== null && Number(minPrice) < 0) {
    return NextResponse.json({ error: 'minPrice cannot be negative' }, { status: 400 })
  }
  if (maxPrice !== undefined && maxPrice !== null && Number(maxPrice) < 0) {
    return NextResponse.json({ error: 'maxPrice cannot be negative' }, { status: 400 })
  }

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

  // Delete keyword — SeenItem rows are preserved after a keyword is deleted
  // (keywordRef uses onDelete: SetNull, so SeenItem.keywordId becomes null but rows persist)
  // Deleting a keyword does not delete its SeenItem history
  await prisma.keyword.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
