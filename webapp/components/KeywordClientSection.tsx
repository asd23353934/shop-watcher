'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import type { Keyword } from '@/types/keyword'
import KeywordList from '@/components/KeywordList'

interface Props {
  initialKeywords: Keyword[]
}

export default function KeywordClientSection({ initialKeywords }: Props) {
  const [keywords, setKeywords] = useState<Keyword[]>(initialKeywords)

  const handleToggle = (id: string, newActive: boolean) => {
    setKeywords((prev) => prev.map((k) => (k.id === id ? { ...k, active: newActive } : k)))
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
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">我的關鍵字</h2>
        <Link
          href="/keywords/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          <Plus className="h-4 w-4" />
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
