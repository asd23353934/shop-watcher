import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { HEX_COLOR_REGEX, MAX_TAG_NAME_LENGTH } from '@/lib/tag-validation'
import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'

type RouteContext = { params: Promise<{ id: string }> }

async function loadOwnedTag(userId: string, id: string) {
  const tag = await prisma.tag.findUnique({ where: { id } })
  if (!tag) return { error: NextResponse.json({ error: '找不到標籤' }, { status: 404 }) }
  if (tag.userId !== userId) {
    return { error: NextResponse.json({ error: '禁止存取' }, { status: 403 }) }
  }
  return { tag }
}

// PATCH /api/tags/[id] — update name and/or color
export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授權' }, { status: 401 })
  }

  const { id } = await context.params
  const { error, tag } = await loadOwnedTag(session.user.id, id)
  if (error) return error

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '無效的 JSON' }, { status: 400 })
  }

  const data: { name?: string; color?: string | null } = {}

  if (body.name !== undefined) {
    if (typeof body.name !== 'string') {
      return NextResponse.json({ error: 'name 型別錯誤' }, { status: 400 })
    }
    const trimmed = body.name.trim()
    if (!trimmed) {
      return NextResponse.json({ error: '標籤名稱不可為空' }, { status: 400 })
    }
    if (trimmed.length > MAX_TAG_NAME_LENGTH) {
      return NextResponse.json(
        { error: `標籤名稱不可超過 ${MAX_TAG_NAME_LENGTH} 字元` },
        { status: 400 }
      )
    }
    data.name = trimmed
  }

  if (body.color !== undefined) {
    if (body.color === null) {
      data.color = null
    } else if (typeof body.color !== 'string' || !HEX_COLOR_REGEX.test(body.color)) {
      return NextResponse.json(
        { error: '顏色格式錯誤（需為 #RRGGBB）' },
        { status: 400 }
      )
    } else {
      data.color = body.color
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      {
        id: tag!.id,
        name: tag!.name,
        color: tag!.color,
      }
    )
  }

  try {
    const updated = await prisma.tag.update({
      where: { id },
      data,
      include: { _count: { select: { keywordTags: true, circleTags: true } } },
    })
    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      color: updated.color,
      keywordCount: updated._count.keywordTags,
      circleCount: updated._count.circleTags,
    })
  } catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json({ error: '標籤名稱已存在' }, { status: 409 })
    }
    console.error('PATCH /api/tags/[id] error:', err)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}

// DELETE /api/tags/[id] — delete a tag; cascade removes join rows
export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授權' }, { status: 401 })
  }

  const { id } = await context.params
  const { error } = await loadOwnedTag(session.user.id, id)
  if (error) return error

  try {
    await prisma.tag.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    console.error('DELETE /api/tags/[id] error:', err)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}
