import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { compilePattern } from '@/lib/auto-tag'
import { assertTagIdsOwnedBy, TagOwnershipError } from '@/lib/tag-validation'
import { NextResponse } from 'next/server'

async function loadOwnedRule(id: string, userId: string) {
  const rule = await prisma.tagRule.findUnique({ where: { id } })
  if (!rule || rule.userId !== userId) return null
  return rule
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授權' }, { status: 401 })
  }
  const userId = session.user.id
  const { id } = await params

  const rule = await loadOwnedRule(id, userId)
  if (!rule) return NextResponse.json({ error: '規則不存在' }, { status: 404 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '無效的 JSON' }, { status: 400 })
  }

  const { pattern, tagId, enabled } = body

  if (rule.systemDefault && (pattern !== undefined || tagId !== undefined)) {
    return NextResponse.json(
      { error: '系統預設規則僅能啟用或停用' },
      { status: 403 }
    )
  }

  const data: { pattern?: string; tagId?: string; enabled?: boolean } = {}

  if (pattern !== undefined) {
    if (typeof pattern !== 'string') {
      return NextResponse.json({ error: 'pattern 必須為字串' }, { status: 400 })
    }
    const compiled = compilePattern(pattern)
    if (!compiled.ok) {
      const msg = compiled.reason === 'unsafe' ? '規則過於複雜，可能導致效能問題' : '規則格式錯誤'
      return NextResponse.json({ error: msg }, { status: 422 })
    }
    data.pattern = pattern
  }

  if (tagId !== undefined) {
    if (typeof tagId !== 'string') {
      return NextResponse.json({ error: 'tagId 必須為字串' }, { status: 400 })
    }
    try {
      await assertTagIdsOwnedBy(userId, [tagId])
    } catch (err) {
      if (err instanceof TagOwnershipError) {
        return NextResponse.json({ error: '標籤不存在' }, { status: 404 })
      }
      throw err
    }
    data.tagId = tagId
  }

  if (enabled !== undefined) {
    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'enabled 必須為布林值' }, { status: 400 })
    }
    data.enabled = enabled
  }

  const updated = await prisma.tagRule.update({
    where: { id },
    data,
    include: { tag: { select: { id: true, name: true, color: true } } },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授權' }, { status: 401 })
  }
  const userId = session.user.id
  const { id } = await params

  const rule = await loadOwnedRule(id, userId)
  if (!rule) return NextResponse.json({ error: '規則不存在' }, { status: 404 })

  if (rule.systemDefault) {
    return NextResponse.json(
      { error: '系統預設規則不可刪除，可改為停用' },
      { status: 403 }
    )
  }

  await prisma.tagRule.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
