import type { Tag } from '@/types/tag'

export interface TagRule {
  id: string
  userId: string
  pattern: string
  enabled: boolean
  systemDefault: boolean
  tag: Pick<Tag, 'id' | 'name' | 'color'>
  createdAt: string
  updatedAt: string
}
