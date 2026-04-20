import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { assertTagIdsOwnedBy, TagOwnershipError } from '@/lib/tag-validation'
import { isValidDiscordWebhookUrl } from '@/lib/webhook-validation'
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

  const { active, webhookUrl, tagIds } = body

  if (webhookUrl !== undefined && webhookUrl !== null) {
    if (!isValidDiscordWebhookUrl(webhookUrl)) {
      return NextResponse.json(
        { error: 'Invalid Discord Webhook URL' },
        { status: 400 }
      )
    }
  }

  let validTagIds: string[] | null = null
  if (tagIds !== undefined) {
    if (!Array.isArray(tagIds) || tagIds.some((v) => typeof v !== 'string')) {
      return NextResponse.json({ error: 'tagIds 必須為字串陣列' }, { status: 400 })
    }
    try {
      validTagIds = await assertTagIdsOwnedBy(session.user.id, tagIds as string[])
    } catch (err: unknown) {
      if (err instanceof TagOwnershipError) {
        const status = err.reason === 'forbidden' ? 403 : 400
        const message = err.reason === 'forbidden' ? '禁止使用他人的標籤' : '標籤不存在'
        return NextResponse.json({ error: message }, { status })
      }
      throw err
    }
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.circleFollow.update({
        where: { id },
        data: {
          ...(active !== undefined && { active: Boolean(active) }),
          ...('webhookUrl' in body && {
            webhookUrl: webhookUrl ? (webhookUrl as string).trim() : null,
          }),
        },
      })

      if (validTagIds !== null) {
        await tx.circleFollowTag.deleteMany({ where: { circleFollowId: id } })
        if (validTagIds.length > 0) {
          await tx.circleFollowTag.createMany({
            data: validTagIds.map((tagId) => ({ circleFollowId: id, tagId })),
          })
        }
      }

      return tx.circleFollow.findUniqueOrThrow({
        where: { id },
        include: { tags: { include: { tag: true } } },
      })
    })

    const { tags, ...rest } = updated
    return NextResponse.json({
      ...rest,
      tags: tags.map((ct) => ({ id: ct.tag.id, name: ct.tag.name, color: ct.tag.color })),
    })
  } catch (err: unknown) {
    console.error('Failed to update circle follow:', err)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
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
