'use client'

import { useState, useOptimistic, useTransition } from 'react'
import { toast } from 'sonner'
import KeywordCard from '@/components/KeywordCard'
import EmptyState from '@/components/EmptyState'

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

interface KeywordListProps {
  keywords: Keyword[]
  onOptimisticToggle: (id: string, newActive: boolean) => void
  onOptimisticDelete: (id: string) => void
}

const MATCH_MODE_LABELS: Record<string, string> = {
  any: '寬鬆 — 含任一關鍵詞即通知',
  all: '嚴格 — 每個詞都必須出現',
  exact: '完整比對 — 名稱須包含完整字串',
}

const MATCH_MODE_EXAMPLES: Record<string, string> = {
  any: '含任一詞即通知，範圍較廣',
  all: '所有詞都必須同時出現',
  exact: '名稱須包含完整關鍵字字串',
}

export default function KeywordList({
  keywords,
  onOptimisticToggle,
  onOptimisticDelete,
}: KeywordListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Keyword>>({})
  const [editBlocklistInput, setEditBlocklistInput] = useState('')
  const [editMustIncludeInput, setEditMustIncludeInput] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  const [isPending, startTransition] = useTransition()

  const [optimisticKeywords, applyOptimisticToggle] = useOptimistic(
    keywords,
    (state, { id, newActive }: { id: string; newActive: boolean }) =>
      state.map((k) => (k.id === id ? { ...k, active: newActive } : k))
  )

  // Empty keyword list shows guided empty state
  if (keywords.length === 0) {
    return (
      <EmptyState
        heading="尚無監控關鍵字"
        subtitle="新增你的第一個監控關鍵字，開始接收商品通知"
      />
    )
  }

  const handleToggleActive = (kw: Keyword, newActive: boolean) => {
    startTransition(async () => {
      applyOptimisticToggle({ id: kw.id, newActive })
      const res = await fetch(`/api/keywords/${kw.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newActive }),
      })
      if (res.ok) {
        onOptimisticToggle(kw.id, newActive)
      } else {
        onOptimisticToggle(kw.id, kw.active)
        toast.error('切換失敗，請稍後再試')
      }
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('確定要刪除此關鍵字嗎？')) return
    startTransition(async () => {
      onOptimisticDelete(id)
      const res = await fetch(`/api/keywords/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('關鍵字已刪除')
      } else {
        toast.error('刪除失敗，請重新整理頁面後再試')
      }
    })
  }

  const handleEdit = (kw: Keyword) => {
    setEditingId(kw.id)
    setEditBlocklistInput('')
    setEditMustIncludeInput('')
    setEditForm({
      keyword: kw.keyword,
      platforms: [...kw.platforms],
      minPrice: kw.minPrice,
      maxPrice: kw.maxPrice,
      blocklist: [...(kw.blocklist ?? [])],
      mustInclude: [...(kw.mustInclude ?? [])],
      matchMode: kw.matchMode ?? 'any',
    })
  }

  const handleEditAddBlockword = () => {
    const word = editBlocklistInput.trim()
    if (!word) return
    setEditForm((prev) => ({ ...prev, blocklist: [...(prev.blocklist ?? []), word] }))
    setEditBlocklistInput('')
  }

  const handleEditRemoveBlockword = (word: string) => {
    setEditForm((prev) => ({
      ...prev,
      blocklist: (prev.blocklist ?? []).filter((w) => w !== word),
    }))
  }

  const handleEditAddMustInclude = () => {
    const word = editMustIncludeInput.trim()
    if (!word) return
    setEditForm((prev) => ({ ...prev, mustInclude: [...(prev.mustInclude ?? []), word] }))
    setEditMustIncludeInput('')
  }

  const handleEditRemoveMustInclude = (word: string) => {
    setEditForm((prev) => ({
      ...prev,
      mustInclude: (prev.mustInclude ?? []).filter((w) => w !== word),
    }))
  }

  const handleEditSave = async (id: string) => {
    setEditLoading(true)
    try {
      const res = await fetch(`/api/keywords/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (res.ok) {
        const updated = await res.json()
        onOptimisticToggle(id, updated.active)
        setEditingId(null)
        toast.success('關鍵字已更新')
      } else {
        toast.error('更新失敗，請稍後再試')
      }
    } catch {
      toast.error('網路錯誤，請再試一次')
    } finally {
      setEditLoading(false)
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
      {optimisticKeywords.map((kw) => (
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
                    {p === 'shopee' ? '蝦皮' : '露天'}
                  </label>
                ))}
              </div>
              {/* Match mode */}
              <div>
                <p className="mb-1 text-xs font-medium text-gray-600">搜尋精確度</p>
                <select
                  value={editForm.matchMode ?? 'any'}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, matchMode: e.target.value }))}
                  className="w-full rounded-md border px-2 py-1 text-sm"
                >
                  {Object.entries(MATCH_MODE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                {editForm.matchMode && MATCH_MODE_EXAMPLES[editForm.matchMode] && (
                  <p className="mt-1 text-xs text-gray-400">
                    {MATCH_MODE_EXAMPLES[editForm.matchMode]}
                  </p>
                )}
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
              {/* Must-include edit */}
              <div>
                <p className="mb-1 text-xs font-medium text-gray-600">必包詞</p>
                <div className="mb-1 flex flex-wrap gap-1">
                  {(editForm.mustInclude ?? []).map((word) => (
                    <span key={word} className="flex items-center gap-1 rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">
                      {word}
                      <button type="button" onClick={() => handleEditRemoveMustInclude(word)} className="ml-0.5 text-green-400 hover:text-green-600">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={editMustIncludeInput}
                    onChange={(e) => setEditMustIncludeInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleEditAddMustInclude() } }}
                    placeholder="輸入必包詞"
                    className="flex-1 rounded-md border px-2 py-1 text-xs"
                  />
                  <button type="button" onClick={handleEditAddMustInclude} className="rounded-md border px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">新增</button>
                </div>
              </div>
              {/* Blocklist edit */}
              <div>
                <p className="mb-1 text-xs font-medium text-gray-600">禁詞</p>
                <div className="mb-1 flex flex-wrap gap-1">
                  {(editForm.blocklist ?? []).map((word) => (
                    <span key={word} className="flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">
                      {word}
                      <button type="button" onClick={() => handleEditRemoveBlockword(word)} className="ml-0.5 text-red-400 hover:text-red-600">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={editBlocklistInput}
                    onChange={(e) => setEditBlocklistInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleEditAddBlockword() } }}
                    placeholder="輸入禁詞"
                    className="flex-1 rounded-md border px-2 py-1 text-xs"
                  />
                  <button type="button" onClick={handleEditAddBlockword} className="rounded-md border px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">新增</button>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditSave(kw.id)}
                  disabled={editLoading}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  儲存
                </button>
                <button onClick={() => setEditingId(null)} className="rounded-md border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                  取消
                </button>
              </div>
            </div>
          ) : (
            // View mode — uses KeywordCard with shadcn/ui primitives
            <KeywordCard
              keyword={kw}
              onEdit={() => handleEdit(kw)}
              onDelete={() => handleDelete(kw.id)}
              onToggle={(newActive) => handleToggleActive(kw, newActive)}
              toggleDisabled={isPending}
            />
          )}
        </div>
      ))}
    </div>
  )
}
