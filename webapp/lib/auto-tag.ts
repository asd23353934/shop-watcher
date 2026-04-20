import { prisma } from '@/lib/prisma'
import { SYSTEM_TAG_RULES } from '@/lib/system-tag-rules'

export interface CompiledRule {
  id: string
  tagId: string
  regex: RegExp
}

export type CompileResult =
  | { ok: true; regex: RegExp }
  | { ok: false; reason: 'syntax' | 'unsafe' }

const MAX_PATTERN_LENGTH = 500

export function compilePattern(pattern: string): CompileResult {
  if (typeof pattern !== 'string' || pattern.length === 0 || pattern.length > MAX_PATTERN_LENGTH) {
    return { ok: false, reason: 'syntax' }
  }
  if (isUnsafePattern(pattern)) {
    return { ok: false, reason: 'unsafe' }
  }
  try {
    const regex = new RegExp(pattern, 'i')
    return { ok: true, regex }
  } catch {
    return { ok: false, reason: 'syntax' }
  }
}

// Heuristic check for catastrophic backtracking: nested quantifiers like (a+)+, (a*)*, (a+)*
function isUnsafePattern(pattern: string): boolean {
  // nested quantifier inside a group: (...+)+ / (...*)* / (...+)* / (...*)+
  if (/\([^()]*[+*][^()]*\)[+*]/.test(pattern)) return true
  // alternation with overlapping quantifiers: (a|a)+ / (a|aa)+
  if (/\([^()]*\|[^()]*\)[+*]\{?/.test(pattern) && /(\w)\1*\|\1/.test(pattern)) return true
  return false
}

export function applyRulesToTitle(title: string, rules: CompiledRule[]): string[] {
  if (!title) return []
  const hits = new Set<string>()
  for (const rule of rules) {
    try {
      if (rule.regex.test(title)) hits.add(rule.tagId)
    } catch (err) {
      console.warn(`[auto-tag] rule ${rule.id} failed on title:`, err)
    }
  }
  return Array.from(hits)
}

export async function ensureSystemTagRules(userId: string): Promise<{ seeded: boolean }> {
  // 1. Upsert Tags (unique by userId+name)
  const uniqueNames = Array.from(new Set(SYSTEM_TAG_RULES.map((r) => r.tagName)))
  const nameToColor = new Map<string, string | undefined>()
  for (const r of SYSTEM_TAG_RULES) {
    if (!nameToColor.has(r.tagName)) nameToColor.set(r.tagName, r.color)
  }

  const tagIdByName = new Map<string, string>()
  for (const name of uniqueNames) {
    const tag = await prisma.tag.upsert({
      where: { userId_name: { userId, name } },
      create: { userId, name, color: nameToColor.get(name) ?? null },
      update: {},
      select: { id: true },
    })
    tagIdByName.set(name, tag.id)
  }

  // 2. Fetch existing system rules for this user to dedupe by (tagId, pattern)
  const existing = await prisma.tagRule.findMany({
    where: { userId, systemDefault: true },
    select: { tagId: true, pattern: true },
  })
  const existingKeys = new Set(existing.map((r) => `${r.tagId}::${r.pattern}`))

  const toCreate = SYSTEM_TAG_RULES.flatMap((seed) => {
    const tagId = tagIdByName.get(seed.tagName)
    if (!tagId) return []
    const key = `${tagId}::${seed.pattern}`
    if (existingKeys.has(key)) return []
    return [{ userId, tagId, pattern: seed.pattern, systemDefault: true, enabled: true }]
  })

  if (toCreate.length === 0) return { seeded: false }

  await prisma.tagRule.createMany({ data: toCreate, skipDuplicates: true })

  // 3. Backfill recent SeenItems with the freshly-seeded rules
  const freshRules = await prisma.tagRule.findMany({
    where: { userId, systemDefault: true, enabled: true },
    select: { id: true, tagId: true, pattern: true },
  })
  const compiled: CompiledRule[] = []
  for (const r of freshRules) {
    const res = compilePattern(r.pattern)
    if (res.ok) compiled.push({ id: r.id, tagId: r.tagId, regex: res.regex })
  }
  await backfillRecentSeenItems(userId, compiled)

  return { seeded: true }
}

export async function backfillRecentSeenItems(
  userId: string,
  rules: CompiledRule[]
): Promise<void> {
  if (rules.length === 0) return
  const items = await prisma.seenItem.findMany({
    where: { userId },
    select: { id: true, itemName: true },
  })
  const data: { seenItemId: string; tagId: string }[] = []
  for (const item of items) {
    if (!item.itemName) continue
    const tagIds = applyRulesToTitle(item.itemName, rules)
    for (const tagId of tagIds) {
      data.push({ seenItemId: item.id, tagId })
    }
  }
  if (data.length === 0) return
  await prisma.seenItemTag.createMany({ data, skipDuplicates: true })
}
