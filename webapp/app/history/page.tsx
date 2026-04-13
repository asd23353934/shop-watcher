'use client'

import { useState, useEffect, useCallback } from 'react'
import { PLATFORM_LABELS } from '@/constants/platform'
import EmptyState from '@/components/EmptyState'
import { isHttpUrl } from '@/lib/utils'

interface SeenItem {
  id: string
  keyword: string
  keywordId: string | null
  platform: string
  itemId: string
  itemName: string | null
  itemUrl: string | null
  imageUrl: string | null
  firstSeen: string
}

interface KeywordOption {
  id: string
  keyword: string
}

const ALL_PLATFORMS = Object.keys(PLATFORM_LABELS)


function handleImageError(e: React.SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.style.display = 'none'
}

export default function HistoryPage() {
  const [items, setItems] = useState<SeenItem[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [keywords, setKeywords] = useState<KeywordOption[]>([])
  const [selectedKeywordId, setSelectedKeywordId] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('')

  // Load keyword options for filter dropdown
  useEffect(() => {
    fetch('/api/keywords')
      .then((r) => r.json())
      .then((data: KeywordOption[]) => setKeywords(data))
      .catch(() => {/* non-fatal */})
  }, [])

  const fetchItems = useCallback(async (keywordId: string, platform: string, cursor?: string) => {
    const params = new URLSearchParams()
    if (keywordId) params.set('keywordId', keywordId)
    if (platform) params.set('platform', platform)
    if (cursor) params.set('cursor', cursor)

    const res = await fetch(`/api/history?${params}`)
    if (!res.ok) throw new Error('fetch failed')
    return res.json() as Promise<{ items: SeenItem[]; nextCursor: string | null }>
  }, [])

  // Initial + filter-change load
  useEffect(() => {
    setLoading(true)
    fetchItems(selectedKeywordId, selectedPlatform)
      .then(({ items: newItems, nextCursor: nc }) => {
        setItems(newItems)
        setNextCursor(nc)
      })
      .catch(() => {/* silent */})
      .finally(() => setLoading(false))
  }, [selectedKeywordId, selectedPlatform, fetchItems])

  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const { items: more, nextCursor: nc } = await fetchItems(selectedKeywordId, selectedPlatform, nextCursor)
      setItems((prev) => [...prev, ...more])
      setNextCursor(nc)
    } catch {/* silent */} finally {
      setLoadingMore(false)
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">通知記錄</h1>
        <p className="mt-1 text-sm text-gray-500">已通知商品記錄，每頁 50 筆</p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={selectedKeywordId}
          onChange={(e) => setSelectedKeywordId(e.target.value)}
          className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">全部關鍵字</option>
          {keywords.map((kw) => (
            <option key={kw.id} value={kw.id}>{kw.keyword}</option>
          ))}
        </select>

        <select
          value={selectedPlatform}
          onChange={(e) => setSelectedPlatform(e.target.value)}
          className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">全部平台</option>
          {ALL_PLATFORMS.map((p) => (
            <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm text-gray-400">載入中...</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border bg-white shadow-sm">
          <EmptyState
            heading="尚無通知紀錄"
            subtitle="當有新商品符合你的關鍵字時，通知紀錄會顯示在這裡"
          />
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 min-w-[120px]">關鍵字</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 min-w-[130px]">平台</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">商品</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 min-w-[160px]">首次通知時間</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900 min-w-[120px]">{item.keyword}</td>
                    <td className="px-4 py-3 min-w-[130px]">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        {PLATFORM_LABELS[item.platform] ?? item.platform}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {isHttpUrl(item.imageUrl) && (
                          <img
                            src={item.imageUrl}
                            alt={item.itemName ?? ''}
                            className="h-12 w-12 flex-shrink-0 rounded object-cover bg-gray-100"
                            onError={handleImageError}
                          />
                        )}
                        {item.itemName && isHttpUrl(item.itemUrl) ? (
                          <a
                            href={item.itemUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline"
                          >
                            {item.itemName}
                          </a>
                        ) : item.itemName ? (
                          <span className="text-gray-700">{item.itemName}</span>
                        ) : (
                          <span className="font-mono text-xs text-gray-400">{item.itemId}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 min-w-[160px]">
                      {new Date(item.firstSeen).toLocaleString('zh-TW', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {nextCursor && (
            <div className="mt-4 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="rounded-lg border border-gray-300 px-5 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                {loadingMore ? '載入中...' : '載入更多'}
              </button>
            </div>
          )}
        </>
      )}
    </>
  )
}
