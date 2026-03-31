'use client'

import { useState } from 'react'

interface Keyword {
  id: string
  keyword: string
  platforms: string[]
  minPrice: number | null
  maxPrice: number | null
  active: boolean
  createdAt: string
}

interface KeywordListProps {
  initialKeywords: Keyword[]
  onRefresh?: () => void
}

const PLATFORM_LABELS: Record<string, string> = {
  shopee: '蝦皮',
  ruten: '露天',
}

export default function KeywordList({ initialKeywords, onRefresh }: KeywordListProps) {
  const [keywords, setKeywords] = useState<Keyword[]>(initialKeywords)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Keyword>>({})
  const [loading, setLoading] = useState<string | null>(null)

  // Empty keyword list shows a call-to-action
  if (keywords.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-white p-10 text-center">
        <p className="mb-2 text-gray-500">還沒有關鍵字</p>
        <p className="text-sm text-gray-400">使用右側的表單新增第一個監控關鍵字</p>
      </div>
    )
  }

  const handleToggleActive = async (kw: Keyword) => {
    setLoading(kw.id)
    try {
      const res = await fetch(`/api/keywords/${kw.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !kw.active }),
      })
      if (res.ok) {
        // User can toggle a keyword's active status
        setKeywords((prev) =>
          prev.map((k) => (k.id === kw.id ? { ...k, active: !kw.active } : k))
        )
      }
    } finally {
      setLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此關鍵字嗎？')) return
    setLoading(id)
    try {
      const res = await fetch(`/api/keywords/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setKeywords((prev) => prev.filter((k) => k.id !== id))
        onRefresh?.()
      }
    } finally {
      setLoading(null)
    }
  }

  const handleEdit = (kw: Keyword) => {
    setEditingId(kw.id)
    setEditForm({
      keyword: kw.keyword,
      platforms: [...kw.platforms],
      minPrice: kw.minPrice,
      maxPrice: kw.maxPrice,
    })
  }

  const handleEditSave = async (id: string) => {
    setLoading(id)
    try {
      const res = await fetch(`/api/keywords/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (res.ok) {
        const updated = await res.json()
        setKeywords((prev) => prev.map((k) => (k.id === id ? updated : k)))
        setEditingId(null)
      }
    } finally {
      setLoading(null)
    }
  }

  const toggleEditPlatform = (platform: string) => {
    setEditForm((prev) => {
      const current = prev.platforms ?? []
      return {
        ...prev,
        platforms: current.includes(platform)
          ? current.filter((p) => p !== platform)
          : [...current, platform],
      }
    })
  }

  return (
    <div className="space-y-3">
      {keywords.map((kw) => (
        <div key={kw.id} className="rounded-xl border bg-white p-5 shadow-sm">
          {editingId === kw.id ? (
            // Edit mode
            <div className="space-y-3">
              <input
                type="text"
                value={editForm.keyword ?? ''}
                onChange={(e) => setEditForm((p) => ({ ...p, keyword: e.target.value }))}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
              <div className="flex gap-4">
                {['shopee', 'ruten'].map((p) => (
                  <label key={p} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={(editForm.platforms ?? []).includes(p)}
                      onChange={() => toggleEditPlatform(p)}
                    />
                    {PLATFORM_LABELS[p]}
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={editForm.minPrice ?? ''}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      minPrice: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  placeholder="最低價格"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  value={editForm.maxPrice ?? ''}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      maxPrice: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  placeholder="最高價格"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditSave(kw.id)}
                  disabled={loading === kw.id}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  儲存
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="rounded-md border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            // View mode
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{kw.keyword}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      kw.active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {kw.active ? '監控中' : '已停用'}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                  {kw.platforms.map((p) => (
                    <span key={p} className="rounded bg-gray-100 px-2 py-0.5">
                      {PLATFORM_LABELS[p] ?? p}
                    </span>
                  ))}
                  {(kw.minPrice != null || kw.maxPrice != null) && (
                    <span className="rounded bg-gray-100 px-2 py-0.5">
                      NT${kw.minPrice ?? '0'} ~ NT${kw.maxPrice ?? '∞'}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {/* User can toggle a keyword's active status */}
                <button
                  onClick={() => handleToggleActive(kw)}
                  disabled={loading === kw.id}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                    kw.active ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                  title={kw.active ? '停用' : '啟用'}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      kw.active ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>

                <button
                  onClick={() => handleEdit(kw)}
                  className="rounded-md border px-3 py-1 text-sm text-gray-600 hover:bg-gray-50"
                >
                  編輯
                </button>
                <button
                  onClick={() => handleDelete(kw.id)}
                  disabled={loading === kw.id}
                  className="rounded-md border border-red-200 px-3 py-1 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  刪除
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
