import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

/**
 * PATCH /api/circles/[id] — update active status or webhookUrl
 * DELETE /api/circles/[id] — delete CircleFollow (SeenItems are preserved)
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
  const existing = await prisma.circleFollow.findUnique({ where: { id } })

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { active, webhookUrl } = body

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

  const updated = await prisma.circleFollow.update({
    where: { id },
    data: {
      ...(active !== undefined && { active: Boolean(active) }),
      ...('webhookUrl' in body && {
        webhookUrl: webhookUrl ? (webhookUrl as string).trim() : null,
      }),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const existing = await prisma.circleFollow.findUnique({ where: { id } })

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Delete CircleFollow — SeenItem rows are preserved (no relation to CircleFollow)
  await prisma.circleFollow.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
