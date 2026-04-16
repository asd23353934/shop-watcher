import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

/**
 * PATCH /api/keywords/[id]/blocklist
 * Appends a single word to the keyword's blocklist (deduped).
 * Returns 400 for empty/whitespace word.
 * Returns 403 if the keyword belongs to a different user.
 */
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
  const word: string = typeof body.word === 'string' ? body.word.trim() : ''

  if (!word) {
    return NextResponse.json({ error: 'word cannot be empty' }, { status: 400 })
  }

  // Append only if not already present
  if (existing.blocklist.includes(word)) {
    return NextResponse.json({ blocklist: existing.blocklist })
  }

  try {
    const updated = await prisma.keyword.update({
      where: { id },
      data: { blocklist: { push: word } },
    })

    return NextResponse.json({ blocklist: updated.blocklist })
  } catch (err: unknown) {
    console.error('Failed to update blocklist:', err)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}
