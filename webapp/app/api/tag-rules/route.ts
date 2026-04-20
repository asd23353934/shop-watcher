import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { ensureSystemTagRules, compilePattern } from '@/lib/auto-tag'
import { assertTagIdsOwnedBy, TagOwnershipError } from '@/lib/tag-validation'
import { NextResponse } from 'next/server'

// GET /api/tag-rules — list rules owned by the authenticated user (seeds system defaults on demand)
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授權' }, { status: 401 })
  }
  const userId = session.user.id

  await ensureSystemTagRules(userId)

  const rules = await prisma.tagRule.findMany({
    where: { userId },
    orderBy: [{ systemDefault: 'desc' }, { createdAt: 'asc' }],
    include: { tag: { select: { id: true, name: true, color: true } } },
  })

  return NextResponse.json(rules)
}

// POST /api/tag-rules — create a user rule
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授權' }, { status: 401 })
  }
  const userId = session.user.id

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '無效的 JSON' }, { status: 400 })
  }

  const { pattern, tagId } = body
  if (typeof pattern !== 'string' || typeof tagId !== 'string') {
    return NextResponse.json({ error: 'pattern 與 tagId 必填' }, { status: 400 })
  }

  const compiled = compilePattern(pattern)
  if (!compiled.ok) {
    const msg = compiled.reason === 'unsafe' ? '規則過於複雜，可能導致效能問題' : '規則格式錯誤'
    return NextResponse.json({ error: msg }, { status: 422 })
  }

  try {
    await assertTagIdsOwnedBy(userId, [tagId])
  } catch (err) {
    if (err instanceof TagOwnershipError) {
      return NextResponse.json({ error: '標籤不存在' }, { status: 404 })
    }
    throw err
  }

  const rule = await prisma.tagRule.create({
    data: { userId, pattern, tagId, systemDefault: false, enabled: true },
    include: { tag: { select: { id: true, name: true, color: true } } },
  })

  return NextResponse.json(rule, { status: 201 })
}
