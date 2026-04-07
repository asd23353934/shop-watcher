'use client'

import { useState, useOptimistic, useTransition } from 'react'
import { toast } from 'sonner'
import type { Keyword } from '@/types/keyword'
import { MATCH_MODE_LABELS, MATCH_MODE_EXAMPLES } from '@/constants/matchMode'
import { PLATFORM_LABELS } from '@/constants/platform'
import KeywordCard from '@/components/KeywordCard'
import EmptyState from '@/components/EmptyState'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface KeywordListProps {
  keywords: Keyword[]
  onOptimisticToggle: (id: string, newActive: boolean) => void
  onOptimisticUpdate: (updated: Keyword) => void
  onOptimisticDelete: (id: string) => void
  onOptimisticRestore: (keyword: Keyword) => void
}

export default function KeywordList({
  keywords,
  onOptimisticToggle,
  onOptimisticUpdate,
  onOptimisticDelete,
  onOptimisticRestore,
}: KeywordListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Keyword>>({})
  const [editBlocklistInput, setEditBlocklistInput] = useState('')
  const [editMustIncludeInput, setEditMustIncludeInput] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const [isPending, startTransition] = useTransition()

  const [optimisticKeywords, applyOptimisticToggle] = useOptimistic(
    keywords,
    (state, { id, newActive }: { id: string; newActive: boolean }) =>
      state.map((k) => (k.id === id ? { ...k, active: newActive } : k))
  )

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

  const confirmDelete = () => {
    if (!deleteTargetId) return
    const id = deleteTargetId
    const original = keywords.find((k) => k.id === id)
    setDeleteTargetId(null)
    startTransition(async () => {
      onOptimisticDelete(id)
      const res = await fetch(`/api/keywords/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('關鍵字已刪除')
      } else {
        if (original) onOptimisticRestore(original)
        toast.error('刪除失敗，請稍後再試')
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
        onOptimisticUpdate(updated)
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
    <>
      <div className="space-y-3">
        {optimisticKeywords.map((kw) => (
          <div key={kw.id} className="rounded-xl border bg-white p-5 shadow-sm">
            {editingId === kw.id ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editForm.keyword ?? ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, keyword: e.target.value }))}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
                <div className="flex flex-wrap gap-4">
                  {Object.entries(PLATFORM_LABELS).map(([p, label]) => (
                    <label key={p} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={(editForm.platforms ?? []).includes(p)}
                        onChange={() => toggleEditPlatform(p)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
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
                    <p className="mt-1 text-xs text-gray-400">{MATCH_MODE_EXAMPLES[editForm.matchMode]}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={editForm.minPrice ?? ''}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, minPrice: e.target.value ? Number(e.target.value) : null }))}
                    placeholder="最低價格"
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    value={editForm.maxPrice ?? ''}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, maxPrice: e.target.value ? Number(e.target.value) : null }))}
                    placeholder="最高價格"
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-gray-600">必包詞</p>
                  <div className="mb-1 flex flex-wrap gap-1">
                    {(editForm.mustInclude ?? []).map((word) => (
                      <span key={word} className="flex items-center gap-1 rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">
                        {word}
                        <button type="button" onClick={() => setEditForm((prev) => ({ ...prev, mustInclude: (prev.mustInclude ?? []).filter((w) => w !== word) }))} className="ml-0.5 text-green-400 hover:text-green-600">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={editMustIncludeInput}
                      onChange={(e) => setEditMustIncludeInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (editMustIncludeInput.trim()) { setEditForm((prev) => ({ ...prev, mustInclude: [...(prev.mustInclude ?? []), editMustIncludeInput.trim()] })); setEditMustIncludeInput('') } } }}
                      placeholder="輸入必包詞"
                      className="flex-1 rounded-md border px-2 py-1 text-xs"
                    />
                    <button type="button" onClick={() => { if (editMustIncludeInput.trim()) { setEditForm((prev) => ({ ...prev, mustInclude: [...(prev.mustInclude ?? []), editMustIncludeInput.trim()] })); setEditMustIncludeInput('') } }} className="rounded-md border px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">新增</button>
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-gray-600">禁詞</p>
                  <div className="mb-1 flex flex-wrap gap-1">
                    {(editForm.blocklist ?? []).map((word) => (
                      <span key={word} className="flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">
                        {word}
                        <button type="button" onClick={() => setEditForm((prev) => ({ ...prev, blocklist: (prev.blocklist ?? []).filter((w) => w !== word) }))} className="ml-0.5 text-red-400 hover:text-red-600">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={editBlocklistInput}
                      onChange={(e) => setEditBlocklistInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (editBlocklistInput.trim()) { setEditForm((prev) => ({ ...prev, blocklist: [...(prev.blocklist ?? []), editBlocklistInput.trim()] })); setEditBlocklistInput('') } } }}
                      placeholder="輸入禁詞"
                      className="flex-1 rounded-md border px-2 py-1 text-xs"
                    />
                    <button type="button" onClick={() => { if (editBlocklistInput.trim()) { setEditForm((prev) => ({ ...prev, blocklist: [...(prev.blocklist ?? []), editBlocklistInput.trim()] })); setEditBlocklistInput('') } }} className="rounded-md border px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">新增</button>
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
              <KeywordCard
                keyword={kw}
                onEdit={() => handleEdit(kw)}
                onDelete={() => setDeleteTargetId(kw.id)}
                onToggle={(newActive) => handleToggleActive(kw, newActive)}
                toggleDisabled={isPending}
              />
            )}
          </div>
        ))}
      </div>

      {/* 刪除確認 AlertDialog */}
      <AlertDialog open={deleteTargetId !== null} onOpenChange={(open) => { if (!open) setDeleteTargetId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>刪除關鍵字</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除此關鍵字嗎？刪除後將停止監控，此動作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
