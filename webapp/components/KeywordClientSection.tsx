'use client'

import { useState } from 'react'
import type { Keyword } from '@/types/keyword'
import KeywordList from '@/components/KeywordList'
import KeywordFormWrapper from '@/components/KeywordFormWrapper'

interface Props {
  initialKeywords: Keyword[]
}

export default function KeywordClientSection({ initialKeywords }: Props) {
  const [keywords, setKeywords] = useState<Keyword[]>(initialKeywords)

  const handleAdd = (newKeyword: Keyword) => {
    setKeywords((prev) => [newKeyword, ...prev])
  }

  const handleToggle = (id: string, newActive: boolean) => {
    setKeywords((prev) =>
      prev.map((k) => (k.id === id ? { ...k, active: newActive } : k))
    )
  }

  const handleUpdate = (updated: Keyword) => {
    setKeywords((prev) => prev.map((k) => (k.id === updated.id ? updated : k)))
  }

  const handleDelete = (id: string) => {
    setKeywords((prev) => prev.filter((k) => k.id !== id))
  }

  const handleRestore = (keyword: Keyword) => {
    setKeywords((prev) => {
      if (prev.some((k) => k.id === keyword.id)) return prev
      return [...prev, keyword]
    })
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <KeywordList
          keywords={keywords}
          onOptimisticToggle={handleToggle}
          onOptimisticUpdate={handleUpdate}
          onOptimisticDelete={handleDelete}
          onOptimisticRestore={handleRestore}
        />
      </div>
      <div>
        <KeywordFormWrapper onAdd={handleAdd} />
      </div>
    </div>
  )
}
