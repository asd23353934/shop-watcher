import type { Tag } from './tag'

export interface Keyword {
  id: string
  keyword: string
  platforms: string[]
  minPrice: number | null
  maxPrice: number | null
  blocklist: string[]
  mustInclude: string[]
  matchMode: string
  active: boolean
  createdAt: string
  sellerBlocklist: string[]
  discordWebhookUrl: string | null
  maxNotifyPerScan: number | null
  tags?: Pick<Tag, 'id' | 'name' | 'color'>[]
}
