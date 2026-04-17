'use client'

import { useState, useOptimistic, useTransition } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { Keyword } from '@/types/keyword'
import type { PlatformHealthInfo } from '@/components/KeywordClientSection'
import { MATCH_MODE_LABELS, MATCH_MODE_EXAMPLES } from '@/constants/matchMode'
import { PLATFORM_LABELS, TAIWAN_PLATFORMS, JAPAN_PLATFORMS } from '@/constants/platform'
import KeywordCard from '@/components/KeywordCard'
import EmptyState from '@/components/EmptyState'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

interface KeywordListProps {
  keywords: Keyword[]
  platformHealth: Record<string, PlatformHealthInfo>
  onOptimisticToggle: (id: string, newActive: boolean) => void
  onOptimisticUpdate: (updated: Keyword) => void
  onOptimisticDelete: (id: string) => void
  onOptimisticRestore: (keyword: Keyword) => void
}

export default function KeywordList({
  keywords,
  platformHealth,
  onOptimisticToggle,
  onOptimisticUpdate,
  onOptimisticDelete,
  onOptimisticRestore,
}: KeywordListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Keyword>>({})
  const [editBlocklistInput, setEditBlocklistInput] = useState('')
  const [editMustIncludeInput, setEditMustIncludeInput] = useState('')
  const [editSellerBlocklistInput, setEditSellerBlocklistInput] = useState('')
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
        toast.success(newActive ? '關鍵字已啟用' : '關鍵字已暫停')
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
    setEditSellerBlocklistInput('')
    setEditForm({
      keyword: kw.keyword,
      platforms: [...kw.platforms],
      minPrice: kw.minPrice,
      maxPrice: kw.maxPrice,
      blocklist: [...(kw.blocklist ?? [])],
      mustInclude: [...(kw.mustInclude ?? [])],
      matchMode: kw.matchMode ?? 'any',
      sellerBlocklist: [...(kw.sellerBlocklist ?? [])],
      discordWebhookUrl: kw.discordWebhookUrl,
      maxNotifyPerScan: kw.maxNotifyPerScan,
    })
  }

  const handleEditSave = async (id: string) => {
    if ((editForm.platforms ?? []).length === 0) {
      toast.error('請至少選擇一個平台')
      return
    }
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
      <div className="space-y-4">
        {optimisticKeywords.map((kw) => (
          <div key={kw.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
            {editingId === kw.id ? (
              // ── Edit form ────────────────────────────────────────────
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                {/* Keyword name */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">關鍵字</label>
                  <input
                    type="text"
                    value={editForm.keyword ?? ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, keyword: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Platforms */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">監控平台</label>
                    <div className="flex flex-wrap gap-2 text-xs justify-end">
                      <button type="button" onClick={() => setEditForm((p) => ({ ...p, platforms: Object.keys(PLATFORM_LABELS) }))} className="text-indigo-600 dark:text-indigo-400 hover:underline">全選</button>
                      <button type="button" onClick={() => setEditForm((p) => ({ ...p, platforms: [] }))} className="text-indigo-600 dark:text-indigo-400 hover:underline">全消</button>
                      <button type="button" onClick={() => setEditForm((p) => ({ ...p, platforms: TAIWAN_PLATFORMS }))} className="text-indigo-600 dark:text-indigo-400 hover:underline">台灣平台</button>
                      <button type="button" onClick={() => setEditForm((p) => ({ ...p, platforms: JAPAN_PLATFORMS }))} className="text-indigo-600 dark:text-indigo-400 hover:underline">日本平台</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.entries(PLATFORM_LABELS).map(([p, label]) => {
                      const isSelected = (editForm.platforms ?? []).includes(p)
                      return (
                        <label key={p} className={cn(
                          'flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all text-sm',
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                            : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                        )}>
                          <input type="checkbox" checked={isSelected} onChange={() => toggleEditPlatform(p)} className="h-4 w-4 text-indigo-600" />
                          {label}
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Match mode */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">搜尋精確度</label>
                  <select
                    value={editForm.matchMode ?? 'any'}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, matchMode: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {Object.entries(MATCH_MODE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  {editForm.matchMode && MATCH_MODE_EXAMPLES[editForm.matchMode] && (
                    <p className="text-xs text-gray-400">{MATCH_MODE_EXAMPLES[editForm.matchMode]}</p>
                  )}
                </div>

                {/* Price range */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">最低價格</label>
                    <input type="number" placeholder="NT$" value={editForm.minPrice ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, minPrice: e.target.value ? Number(e.target.value) : null }))}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">最高價格</label>
                    <input type="number" placeholder="NT$" value={editForm.maxPrice ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, maxPrice: e.target.value ? Number(e.target.value) : null }))}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>

                {/* Must-include chips */}
                <ChipInput label="必包詞" chips={editForm.mustInclude ?? []} inputValue={editMustIncludeInput} onInputChange={setEditMustIncludeInput}
                  onAdd={() => { if (editMustIncludeInput.trim()) { setEditForm((p) => ({ ...p, mustInclude: [...(p.mustInclude ?? []), editMustIncludeInput.trim()] })); setEditMustIncludeInput('') } }}
                  onRemove={(w) => setEditForm((p) => ({ ...p, mustInclude: (p.mustInclude ?? []).filter((x) => x !== w) }))}
                  chipClass="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300" />

                {/* Blocklist chips */}
                <ChipInput label="禁詞" chips={editForm.blocklist ?? []} inputValue={editBlocklistInput} onInputChange={setEditBlocklistInput}
                  onAdd={() => { if (editBlocklistInput.trim()) { setEditForm((p) => ({ ...p, blocklist: [...(p.blocklist ?? []), editBlocklistInput.trim()] })); setEditBlocklistInput('') } }}
                  onRemove={(w) => setEditForm((p) => ({ ...p, blocklist: (p.blocklist ?? []).filter((x) => x !== w) }))}
                  chipClass="bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300" />

                {/* Seller blocklist chips */}
                <ChipInput label="屏蔽賣場" chips={editForm.sellerBlocklist ?? []} inputValue={editSellerBlocklistInput} onInputChange={setEditSellerBlocklistInput}
                  onAdd={() => { if (editSellerBlocklistInput.trim()) { setEditForm((p) => ({ ...p, sellerBlocklist: [...(p.sellerBlocklist ?? []), editSellerBlocklistInput.trim()] })); setEditSellerBlocklistInput('') } }}
                  onRemove={(w) => setEditForm((p) => ({ ...p, sellerBlocklist: (p.sellerBlocklist ?? []).filter((x) => x !== w) }))}
                  chipClass="bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300" />

                {/* Webhook */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">專屬 Discord Webhook（選填）</label>
                  <input type="url" placeholder="https://discord.com/api/webhooks/..." value={editForm.discordWebhookUrl ?? ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, discordWebhookUrl: e.target.value || null }))}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>

                {/* Max notify */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">每次最多通知筆數（選填）</label>
                  <input type="number" placeholder="空白 = 無上限" min="1" value={editForm.maxNotifyPerScan ?? ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, maxNotifyPerScan: e.target.value ? Number(e.target.value) : null }))}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-xs" />
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button onClick={() => handleEditSave(kw.id)} disabled={editLoading}
                    className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                    {editLoading ? <><Loader2 className="inline h-4 w-4 animate-spin mr-1" />儲存中</> : '儲存'}
                  </button>
                  <button onClick={() => setEditingId(null)}
                    className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
                    取消
                  </button>
                </div>
              </div>
            ) : (
              // ── Card display ─────────────────────────────────────────
              <KeywordCard
                keyword={kw}
                platformHealth={platformHealth}
                onEdit={() => handleEdit(kw)}
                onDelete={() => setDeleteTargetId(kw.id)}
                onToggle={(newActive) => handleToggleActive(kw, newActive)}
                toggleDisabled={isPending}
              />
            )}
          </div>
        ))}
      </div>

      {/* Delete confirm dialog */}
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
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ── Reusable chip input ─────────────────────────────────────────────────────
interface ChipInputProps {
  label: string
  chips: string[]
  inputValue: string
  onInputChange: (v: string) => void
  onAdd: () => void
  onRemove: (v: string) => void
  chipClass: string
}

function ChipInput({ label, chips, inputValue, onInputChange, onAdd, onRemove, chipClass }: ChipInputProps) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {chips.map((c) => (
            <span key={c} className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs', chipClass)}>
              {c}
              <button type="button" onClick={() => onRemove(c)} className="hover:opacity-70">×</button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-1">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAdd() } }}
          placeholder="輸入後按 Enter 或新增"
          className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button type="button" onClick={onAdd}
          className="rounded-md border border-gray-300 dark:border-gray-700 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
          新增
        </button>
      </div>
    </div>
  )
}
