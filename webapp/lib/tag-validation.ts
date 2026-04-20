import { prisma } from '@/lib/prisma'

export const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/
export const MAX_TAG_NAME_LENGTH = 30

export function isValidHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOR_REGEX.test(value)
}

/**
 * Verify that every id in `tagIds` belongs to the given `userId`.
 * Returns the set of valid ids if all pass. Throws TagOwnershipError otherwise.
 */
export async function assertTagIdsOwnedBy(
  userId: string,
  tagIds: string[]
): Promise<string[]> {
  const unique = Array.from(new Set(tagIds))
  if (unique.length === 0) return []

  const rows = await prisma.tag.findMany({
    where: { id: { in: unique } },
    select: { id: true, userId: true },
  })

  if (rows.length !== unique.length) {
    const found = new Set(rows.map((r) => r.id))
    const missing = unique.filter((id) => !found.has(id))
    throw new TagOwnershipError('not_found', missing)
  }

  const foreign = rows.filter((r) => r.userId !== userId).map((r) => r.id)
  if (foreign.length > 0) {
    throw new TagOwnershipError('forbidden', foreign)
  }

  return unique
}

export class TagOwnershipError extends Error {
  constructor(
    public readonly reason: 'not_found' | 'forbidden',
    public readonly ids: string[]
  ) {
    super(`Tag ownership check failed: ${reason} (${ids.join(', ')})`)
    this.name = 'TagOwnershipError'
  }
}
