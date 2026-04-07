'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Keyword } from '@/types/keyword'
import KeywordList from '@/components/KeywordList'

interface Props {
  initialKeywords: Keyword[]
}

export default function KeywordClientSection({ initialKeywords }: Props) {
  const [keywords, setKeywords] = useState<Keyword[]>(initialKeywords)

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
    <div>
      <div className="mb-4 flex justify-end">
        <Link
          href="/keywords/new"
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          新增關鍵字
        </Link>
      </div>

      <KeywordList
        keywords={keywords}
        onOptimisticToggle={handleToggle}
        onOptimisticUpdate={handleUpdate}
        onOptimisticDelete={handleDelete}
        onOptimisticRestore={handleRestore}
      />
    </div>
  )
}
