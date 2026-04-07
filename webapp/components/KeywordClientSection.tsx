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
  const [mobileFormOpen, setMobileFormOpen] = useState(false)

  const handleAdd = (newKeyword: Keyword) => {
    setKeywords((prev) => [newKeyword, ...prev])
    setMobileFormOpen(false)
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
    <div>
      {/* Mobile: toggle button + inline form */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setMobileFormOpen((v) => !v)}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-indigo-300 bg-white px-4 py-2.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
        >
          {mobileFormOpen ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
              收起表單
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              新增關鍵字
            </>
          )}
        </button>

        {mobileFormOpen && (
          <div className="mt-3">
            <KeywordFormWrapper onAdd={handleAdd} />
          </div>
        )}
      </div>

      {/* Desktop: side-by-side grid, form sticky */}
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
        <div className="hidden lg:block">
          <div className="sticky top-6 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-xl">
            <KeywordFormWrapper onAdd={handleAdd} />
          </div>
        </div>
      </div>
    </div>
  )
}
