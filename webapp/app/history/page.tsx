'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import { PLATFORM_LABELS } from '@/constants/platform'
import EmptyState from '@/components/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { TagChip } from '@/components/TagChip'
import { TagFilterBar } from '@/components/TagFilterBar'
import { useTags } from '@/lib/hooks/useTags'
import { isHttpUrl } from '@/lib/utils'

interface HistoryTag {
  id: string
  name: string
  color: string | null
}

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
  tags: HistoryTag[]
}

interface KeywordOption {
  id: string
  keyword: string
}

interface DateGroup {
  label: string
  items: SeenItem[]
}

const ALL_PLATFORMS = Object.keys(PLATFORM_LABELS)

function handleImageError(e: React.SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.style.display = 'none'
}

const fmtDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function groupByDate(items: SeenItem[]): DateGroup[] {
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  const todayStr = fmtDay(today)
  const yesterdayStr = fmtDay(yesterday)

  const map = new Map<string, SeenItem[]>()
  for (const item of items) {
    const d = new Date(item.firstSeen)
    const day = fmtDay(d)
    const label =
      day === todayStr ? '今天' :
      day === yesterdayStr ? '昨天' :
      d.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' })
    const group = map.get(label)
    if (group) {
      group.push(item)
    } else {
      map.set(label, [item])
    }
  }
  return Array.from(map.entries()).map(([label, groupItems]) => ({ label, items: groupItems }))
}

export default function HistoryPage() {
  const [items, setItems] = useState<SeenItem[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [keywords, setKeywords] = useState<KeywordOption[]>([])
  const [selectedKeywordId, setSelectedKeywordId] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const { tags: availableTags } = useTags()

  useEffect(() => {
    fetch('/api/keywords')
      .then((r) => r.json())
      .then((data: KeywordOption[]) => setKeywords(data))
      .catch(() => {/* non-fatal */})
  }, [])

  const fetchItems = useCallback(async (keywordId: string, platform: string, tagIds: string[], cursor?: string) => {
    const params = new URLSearchParams()
    if (keywordId) params.set('keywordId', keywordId)
    if (platform) params.set('platform', platform)
    if (tagIds.length > 0) params.set('tagIds', tagIds.join(','))
    if (cursor) params.set('cursor', cursor)

    const qs = params.toString()
    const res = await fetch(`/api/history${qs ? `?${qs}` : ''}`)
    if (!res.ok) throw new Error('fetch failed')
    return res.json() as Promise<{ items: SeenItem[]; nextCursor: string | null }>
  }, [])

  const tagIdsKey = selectedTagIds.join(',')
  useEffect(() => {
    setLoading(true)
    fetchItems(selectedKeywordId, selectedPlatform, selectedTagIds)
      .then(({ items: newItems, nextCursor: nc }) => {
        setItems(newItems)
        setNextCursor(nc)
      })
      .catch(() => {/* silent */})
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKeywordId, selectedPlatform, tagIdsKey, fetchItems])

  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const { items: more, nextCursor: nc } = await fetchItems(selectedKeywordId, selectedPlatform, selectedTagIds, nextCursor)
      setItems((prev) => [...prev, ...more])
      setNextCursor(nc)
    } catch {/* silent */} finally {
      setLoadingMore(false)
    }
  }

  const groups = useMemo(() => groupByDate(items), [items])

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">通知記錄</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">已通知商品記錄，每頁 50 筆</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <select
          value={selectedKeywordId}
          onChange={(e) => setSelectedKeywordId(e.target.value)}
          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">全部關鍵字</option>
          {keywords.map((kw) => (
            <option key={kw.id} value={kw.id}>{kw.keyword}</option>
          ))}
        </select>

        <select
          value={selectedPlatform}
          onChange={(e) => setSelectedPlatform(e.target.value)}
          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">全部平台</option>
          {ALL_PLATFORMS.map((p) => (
            <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
          ))}
        </select>
      </div>

      {availableTags.length > 0 && (
        <div className="mb-6">
          <TagFilterBar
            tags={availableTags}
            selectedTagIds={selectedTagIds}
            onChange={setSelectedTagIds}
          />
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
              <Skeleton className="h-40 w-full rounded-none" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <EmptyState
            heading="尚無通知紀錄"
            subtitle="當有新商品符合你的關鍵字時，通知紀錄會顯示在這裡"
          />
        </div>
      ) : (
        <>
          {groups.map((group) => (
            <section key={group.label} className="mb-8">
              <div className="mb-3 flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{group.label}</span>
                <span className="text-xs text-gray-400">{group.items.length} 筆</span>
                <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="h-40 w-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                      {isHttpUrl(item.imageUrl) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={item.itemName ?? ''}
                          className="h-full w-full object-cover"
                          onError={handleImageError}
                        />
                      ) : (
                        <span className="text-2xl text-gray-300 dark:text-gray-600">🛒</span>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col gap-1.5 p-3">
                      <div className="clamp-2 text-xs font-medium text-gray-900 dark:text-gray-100 leading-snug min-h-[2.5rem]">
                        {item.itemName && isHttpUrl(item.itemUrl) ? (
                          <a
                            href={item.itemUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            {item.itemName}
                          </a>
                        ) : item.itemName ? (
                          <span>{item.itemName}</span>
                        ) : (
                          <span className="font-mono text-gray-400">{item.itemId}</span>
                        )}
                      </div>

                      {item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.tags.map((t) => (
                            <TagChip key={t.id} name={t.name} color={t.color} />
                          ))}
                        </div>
                      )}

                      <div className="mt-auto flex items-center justify-between gap-1 pt-1">
                        <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[11px] text-gray-600 dark:text-gray-400 truncate max-w-[5rem]">
                          {PLATFORM_LABELS[item.platform] ?? item.platform}
                        </span>
                        <span className="text-[11px] text-gray-400 whitespace-nowrap">
                          {new Date(item.firstSeen).toLocaleTimeString('zh-TW', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                        關鍵字：{item.keyword}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {nextCursor && (
            <div className="mt-2 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="rounded-lg border border-gray-300 dark:border-gray-700 px-5 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {loadingMore ? <><Loader2 className="inline h-4 w-4 animate-spin mr-1" />載入中</> : '載入更多'}
              </button>
            </div>
          )}
        </>
      )}
    </>
  )
}
