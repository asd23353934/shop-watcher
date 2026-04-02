'use client'

import KeywordForm from './KeywordForm'

interface Keyword {
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
}

interface KeywordFormWrapperProps {
  onAdd: (keyword: Keyword) => void
}

export default function KeywordFormWrapper({ onAdd }: KeywordFormWrapperProps) {
  return <KeywordForm onSuccess={onAdd} />
}
