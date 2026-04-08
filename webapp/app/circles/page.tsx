'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import CircleFollowForm from '@/components/CircleFollowForm'
import EmptyState from '@/components/EmptyState'

interface CircleFollow {
  id: string
  platform: string
  circleId: string
  circleName: string
  webhookUrl: string | null
  active: boolean
  createdAt: string
}

const PLATFORM_LABELS: Record<string, string> = {
  booth: 'BOOTH',
  dlsite: 'DLsite',
}

export default function CirclesPage() {
  const [follows, setFollows] = useState<CircleFollow[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())

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
        <h1 className="text-2xl font-bold text-gray-900">社團追蹤</h1>
        <p className="mt-1 text-sm text-gray-500">
          追蹤 BOOTH 店家或 DLsite 社團的所有新作，無需設定關鍵字
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* List */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="text-center py-12 text-sm text-gray-400">載入中...</div>
          ) : follows.length === 0 ? (
            <div className="rounded-xl border bg-white shadow-sm">
              <EmptyState
                heading="尚無社團追蹤"
                subtitle="新增 BOOTH 店家或 DLsite 社團，當有新作上架時即時通知"
              />
            </div>
          ) : (
            <div className="space-y-3">
              {follows.map((follow) => (
                <div key={follow.id} className="rounded-xl border bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-900">{follow.circleName}</span>
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
                          {PLATFORM_LABELS[follow.platform] ?? follow.platform}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            follow.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {follow.active ? '追蹤中' : '已暫停'}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-gray-400">ID: {follow.circleId}</div>
                      {follow.webhookUrl && (
                        <div className="mt-1 text-xs text-purple-600" title={follow.webhookUrl}>
                          Webhook: ...{follow.webhookUrl.slice(-20)}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(follow)}
                        disabled={pendingIds.has(follow.id)}
                        className={`rounded-md border px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
                          follow.active
                            ? 'border-gray-300 text-gray-600 hover:bg-gray-50'
                            : 'border-indigo-300 text-indigo-600 hover:bg-indigo-50'
                        }`}
                      >
                        {pendingIds.has(follow.id) ? '處理中...' : follow.active ? '暫停' : '恢復'}
                      </button>
                      <button
                        onClick={() => handleDelete(follow.id)}
                        disabled={pendingIds.has(follow.id)}
                        className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-50"
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
