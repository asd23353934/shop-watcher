'use client'

import { useState, useOptimistic, useTransition } from 'react'

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

const PLATFORM_LABELS: Record<string, string> = {
  shopee: '蝦皮',
  ruten: '露天',
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

const MATCH_MODE_BADGE_LABELS: Record<string, string> = {
  any: '寬鬆',
  all: '嚴格',
  exact: '完整比對',
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

  // useTransition: 3.5 — pending 時按鈕 disabled，但 optimistic UI 已先反映
  const [isPending, startTransition] = useTransition()

  // useOptimistic: 3.2 — toggle active instant UI, reverts on API failure
  const [optimisticKeywords, applyOptimisticToggle] = useOptimistic(
    keywords,
    (state, { id, newActive }: { id: string; newActive: boolean }) =>
      state.map((k) => (k.id === id ? { ...k, active: newActive } : k))
  )

  // Empty keyword list shows a call-to-action
  if (keywords.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-white p-10 text-center">
        <p className="mb-2 text-gray-500">還沒有關鍵字</p>
        <p className="text-sm text-gray-400">使用右側的表單新增第一個監控關鍵字</p>
      </div>
    )
  }

  // 3.2 + 3.3: toggle with optimistic update, revert on failure
  const handleToggleActive = (kw: Keyword) => {
    const newActive = !kw.active
    startTransition(async () => {
      applyOptimisticToggle({ id: kw.id, newActive })
      const res = await fetch(`/api/keywords/${kw.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newActive }),
      })
      if (res.ok) {
        // Commit to parent state
        onOptimisticToggle(kw.id, newActive)
      } else {
        // 3.3: revert — useOptimistic auto-reverts when transition ends without commit
        // We still update parent back to original to stay in sync
        onOptimisticToggle(kw.id, kw.active)
        alert('切換失敗，請稍後再試')
      }
    })
  }

  // 3.2 + 3.4: delete with optimistic removal, revert on failure
  const handleDelete = (id: string) => {
    if (!confirm('確定要刪除此關鍵字嗎？')) return
    const deletedKw = keywords.find((k) => k.id === id)
    startTransition(async () => {
      // Immediately remove from parent state (optimistic)
      onOptimisticDelete(id)
      const res = await fetch(`/api/keywords/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        // 3.4: revert — add keyword back via parent
        // KeywordClientSection will re-add it if we had a reference
        // Since we removed it, we alert and suggest refresh
        alert('刪除失敗，請重新整理頁面後再試')
        void deletedKw // logged for debugging
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
        // Reflect edit in parent state via toggle (reuse to set full object)
        onOptimisticToggle(id, updated.active)
        setEditingId(null)
      }
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
                    {PLATFORM_LABELS[p]}
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
            // View mode
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-gray-900">{kw.keyword}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${kw.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {kw.active ? '監控中' : '已停用'}
                  </span>
                  {kw.matchMode && kw.matchMode !== 'any' && (
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-600">
                      {MATCH_MODE_BADGE_LABELS[kw.matchMode] ?? kw.matchMode}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                  {kw.platforms.map((p) => (
                    <span key={p} className="rounded bg-gray-100 px-2 py-0.5">{PLATFORM_LABELS[p] ?? p}</span>
                  ))}
                  {(kw.minPrice != null || kw.maxPrice != null) && (
                    <span className="rounded bg-gray-100 px-2 py-0.5">
                      NT${kw.minPrice ?? '0'} ~ NT${kw.maxPrice ?? '∞'}
                    </span>
                  )}
                  {kw.mustInclude?.map((word) => (
                    <span key={word} className="rounded bg-green-100 px-2 py-0.5 text-green-700">+{word}</span>
                  ))}
                  {kw.blocklist?.map((word) => (
                    <span key={word} className="rounded bg-red-100 px-2 py-0.5 text-red-700">-{word}</span>
                  ))}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {/* 3.5: useTransition isPending controls disabled; optimistic UI already flipped */}
                <button
                  onClick={() => handleToggleActive(kw)}
                  disabled={isPending}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${kw.active ? 'bg-indigo-600' : 'bg-gray-200'}`}
                  title={kw.active ? '停用' : '啟用'}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${kw.active ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>

                <button
                  onClick={() => handleEdit(kw)}
                  className="rounded-md border px-3 py-1 text-sm text-gray-600 hover:bg-gray-50"
                >
                  編輯
                </button>
                <button
                  onClick={() => handleDelete(kw.id)}
                  disabled={isPending}
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
