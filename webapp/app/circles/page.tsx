'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import CircleFollowForm from '@/components/CircleFollowForm'
import EmptyState from '@/components/EmptyState'
import { SkeletonRow } from '@/components/ui/SkeletonCard'
import { PLATFORM_LABELS } from '@/constants/platform'
import { TagChip } from '@/components/TagChip'
import { TagFilterBar } from '@/components/TagFilterBar'
import { useTags } from '@/lib/hooks/useTags'
import type { Tag } from '@/types/tag'

interface CircleFollow {
  id: string
  platform: string
  circleId: string
  circleName: string
  webhookUrl: string | null
  active: boolean
  createdAt: string
  tags?: Pick<Tag, 'id' | 'name' | 'color'>[]
}

const PLATFORM_STYLES: Record<string, string> = {
  booth:  'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400',
  dlsite: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
}

export default function CirclesPage() {
  const [follows, setFollows] = useState<CircleFollow[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const { tags } = useTags()
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])

  const filteredFollows = useMemo(() => {
    if (selectedTagIds.length === 0) return follows
    return follows.filter((f) => {
      const ids = new Set((f.tags ?? []).map((t) => t.id))
      return selectedTagIds.every((id) => ids.has(id))
    })
  }, [follows, selectedTagIds])

  useEffect(() => {
    fetch('/api/circles')
      .then((r) => r.json())
      .then(setFollows)
      .catch(() => toast.error('載入失敗'))
      .finally(() => setLoading(false))
  }, [])

  const handleAdded = (follow: CircleFollow) => {
    setFollows((prev) => [follow, ...prev])
  }

  const handleToggleActive = async (follow: CircleFollow) => {
    if (pendingIds.has(follow.id)) return
    const newActive = !follow.active
    setPendingIds((prev) => new Set(prev).add(follow.id))
    setFollows((prev) => prev.map((f) => f.id === follow.id ? { ...f, active: newActive } : f))
    const res = await fetch(`/api/circles/${follow.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: newActive }),
    })
    if (!res.ok) {
      setFollows((prev) => prev.map((f) => f.id === follow.id ? { ...f, active: follow.active } : f))
      toast.error('切換失敗')
    }
    setPendingIds((prev) => { const next = new Set(prev); next.delete(follow.id); return next })
  }

  const handleDelete = async (id: string) => {
    if (pendingIds.has(id)) return
    const original = follows.find((f) => f.id === id)
    setPendingIds((prev) => new Set(prev).add(id))
    setFollows((prev) => prev.filter((f) => f.id !== id))
    const res = await fetch(`/api/circles/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('刪除失敗')
      if (original) setFollows((prev) => [original, ...prev])
    } else {
      toast.success('已刪除社團追蹤')
    }
    setPendingIds((prev) => { const next = new Set(prev); next.delete(id); return next })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">社團追蹤</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          追蹤 BOOTH 店家或 DLsite 社團的所有新作，無需設定關鍵字
        </p>
      </div>

      <TagFilterBar tags={tags} selectedTagIds={selectedTagIds} onChange={setSelectedTagIds} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* List */}
        <div className="lg:col-span-2">
          {loading ? (
            <SkeletonRow count={3} />
          ) : filteredFollows.length === 0 ? (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
              <EmptyState
                heading="尚無社團追蹤"
                subtitle="新增 BOOTH 店家或 DLsite 社團，當有新作上架時即時通知"
              />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFollows.map((follow) => (
                <div
                  key={follow.id}
                  className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{follow.circleName}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PLATFORM_STYLES[follow.platform] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                          {PLATFORM_LABELS[follow.platform] ?? follow.platform}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            follow.active
                              ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                              : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                          }`}
                        >
                          {follow.active ? '追蹤中' : '已暫停'}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-gray-400">ID: {follow.circleId}</div>
                      {follow.webhookUrl && (
                        <div className="mt-1 text-xs text-purple-500 dark:text-purple-400" title={follow.webhookUrl}>
                          Webhook: ...{follow.webhookUrl.slice(-20)}
                        </div>
                      )}
                      {follow.tags && follow.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {follow.tags.map((t) => (
                            <TagChip key={t.id} name={t.name} color={t.color} />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(follow)}
                        disabled={pendingIds.has(follow.id)}
                        className={`rounded-md border px-3 py-1.5 text-xs font-medium disabled:opacity-50 transition-colors ${
                          follow.active
                            ? 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                            : 'border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950'
                        }`}
                      >
                        {pendingIds.has(follow.id) ? <><Loader2 className="inline h-3 w-3 animate-spin mr-1" />處理中</> : follow.active ? '暫停' : '恢復'}
                      </button>
                      <button
                        onClick={() => handleDelete(follow.id)}
                        disabled={pendingIds.has(follow.id)}
                        className="rounded-md border border-red-200 dark:border-red-900 px-3 py-1.5 text-xs font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50 transition-colors"
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form */}
        <div>
          <CircleFollowForm onSuccess={handleAdded} />
        </div>
      </div>
    </div>
  )
}
