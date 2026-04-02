'use client'

import { useState } from 'react'
import KeywordList from '@/components/KeywordList'
import KeywordFormWrapper from '@/components/KeywordFormWrapper'

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

interface Props {
  initialKeywords: Keyword[]
}

// Holds shared keyword state so KeywordForm and KeywordList can communicate
// without triggering a full router.refresh()
export default function KeywordClientSection({ initialKeywords }: Props) {
  const [keywords, setKeywords] = useState<Keyword[]>(initialKeywords)

  const handleAdd = (newKeyword: Keyword) => {
    // 4.3: prepend so newest appears first (matches orderBy: { createdAt: 'desc' })
    setKeywords((prev) => [newKeyword, ...prev])
  }

  const handleToggle = (id: string, newActive: boolean) => {
    setKeywords((prev) =>
      prev.map((k) => (k.id === id ? { ...k, active: newActive } : k))
    )
  }

  const handleDelete = (id: string) => {
    setKeywords((prev) => prev.filter((k) => k.id !== id))
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <KeywordList
          keywords={keywords}
          onOptimisticToggle={handleToggle}
          onOptimisticDelete={handleDelete}
        />
      </div>
      <div>
        <KeywordFormWrapper onAdd={handleAdd} />
      </div>
    </div>
  )
}
