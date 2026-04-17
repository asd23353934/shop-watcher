'use client'

import type { Keyword } from '@/types/keyword'
import type { PlatformHealthInfo } from '@/components/KeywordClientSection'
import { PLATFORM_LABELS, PLATFORM_SEARCH_URL, CANARY_UNHEALTHY_REASON_LABELS } from '@/constants/platform'
import { MATCH_MODE_BADGE_LABELS } from '@/constants/matchMode'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Link2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

function formatRelativeTime(iso: string | null): string {
  if (!iso) return '尚無記錄'
  const diffMs  = Date.now() - new Date(iso).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1)  return '剛剛'
  if (diffMin < 60) return `${diffMin} 分鐘前`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24)  return `${diffHr} 小時前`
  return `${Math.floor(diffHr / 24)} 天前`
}

// Platform pill colors (light + dark)
const PLATFORM_COLORS: Record<string, string> = {
  ruten:         'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  pchome:        'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  momo:          'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  animate:       'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  'yahoo-auction': 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  mandarake:     'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  myacg:         'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  kingstone:     'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
  booth:         'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  dlsite:        'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  toranoana:     'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  melonbooks:    'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
}

interface KeywordCardProps {
  keyword: Keyword
  platformHealth: Record<string, PlatformHealthInfo>
  onEdit: () => void
  onDelete: () => void
  onToggle: (newActive: boolean) => void
  toggleDisabled?: boolean
}

function PriceRange({ minPrice, maxPrice }: { minPrice: number | null; maxPrice: number | null }) {
  if (minPrice == null && maxPrice == null) return null
  let label = ''
  if (minPrice != null && maxPrice != null) label = `NT$ ${minPrice.toLocaleString()} – ${maxPrice.toLocaleString()}`
  else if (minPrice != null) label = `NT$ ${minPrice.toLocaleString()} 以上`
  else label = `NT$ ${maxPrice!.toLocaleString()} 以下`
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
      💰 {label}
    </span>
  )
}

export default function KeywordCard({ keyword: kw, platformHealth, onEdit, onDelete, onToggle, toggleDisabled }: KeywordCardProps) {
  return (
    <div className="space-y-3">
      {/* Top row: name + status + controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 truncate">{kw.keyword}</h3>
          <span className={cn(
            'px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0',
            kw.active
              ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
          )}>
            {kw.active ? '監控中' : '已暫停'}
          </span>
          {kw.matchMode && kw.matchMode !== 'any' && (
            <span className="px-2 py-0.5 rounded-full text-xs border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 flex-shrink-0">
              {MATCH_MODE_BADGE_LABELS[kw.matchMode] ?? kw.matchMode}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Switch checked={kw.active} onCheckedChange={onToggle} disabled={toggleDisabled} aria-label={kw.active ? '停用' : '啟用'} />
          <Button variant="ghost" size="icon" onClick={onEdit} aria-label="編輯" className="h-8 w-8 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} disabled={toggleDisabled} aria-label="刪除" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Platform badges */}
      <div className="flex flex-wrap gap-1.5">
        {kw.platforms.map((p) => {
          const searchUrl = PLATFORM_SEARCH_URL[p]?.(kw.keyword)
          const colorClass = PLATFORM_COLORS[p] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          const health = platformHealth[p]
          const warningTitle = health
            ? `${CANARY_UNHEALTHY_REASON_LABELS[health.unhealthyReason ?? ''] ?? '平台異常'}｜${formatRelativeTime(health.lastRunAt)}`
            : undefined
          const content = (
            <span className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium hover:opacity-80 transition-opacity',
              colorClass,
              searchUrl && 'cursor-pointer',
              health && 'ring-1 ring-amber-400 dark:ring-amber-600'
            )}>
              {health && <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" />}
              {PLATFORM_LABELS[p] ?? p}
            </span>
          )
          const linkTitle = health
            ? warningTitle
            : `在 ${PLATFORM_LABELS[p] ?? p} 搜尋「${kw.keyword}」`
          return searchUrl ? (
            <a key={p} href={searchUrl} target="_blank" rel="noopener noreferrer" title={linkTitle}>
              {content}
            </a>
          ) : (
            <span key={p} title={warningTitle}>{content}</span>
          )
        })}
      </div>

      {/* Info tags */}
      <div className="flex flex-wrap gap-1.5">
        <PriceRange minPrice={kw.minPrice} maxPrice={kw.maxPrice} />
        {kw.mustInclude?.map((word) => (
          <span key={word} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
            🔤 {word}
          </span>
        ))}
        {kw.blocklist?.map((word) => (
          <span key={word} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400">
            🚫 {word}
          </span>
        ))}
        {kw.sellerBlocklist?.map((word) => (
          <span key={word} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400">
            🏪 {word}
          </span>
        ))}
        {kw.discordWebhookUrl && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            <Link2 className="h-3 w-3" /> 自訂通知
          </span>
        )}
        {kw.maxNotifyPerScan != null && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
            📊 最多 {kw.maxNotifyPerScan} 筆
          </span>
        )}
      </div>
    </div>
  )
}
