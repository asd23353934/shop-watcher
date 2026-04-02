'use client'

import type { Keyword } from '@/types/keyword'
import { PLATFORM_LABELS, PLATFORM_BADGE_CLASS } from '@/constants/platform'
import { MATCH_MODE_BADGE_LABELS } from '@/constants/matchMode'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'

interface KeywordCardProps {
  keyword: Keyword
  onEdit: () => void
  onDelete: () => void
  onToggle: (newActive: boolean) => void
  toggleDisabled?: boolean
}

function PriceRange({ minPrice, maxPrice }: { minPrice: number | null; maxPrice: number | null }) {
  if (minPrice == null && maxPrice == null) return null
  let label = ''
  if (minPrice != null && maxPrice != null) label = `NT$ ${minPrice} – ${maxPrice}`
  else if (minPrice != null) label = `NT$ ${minPrice} 以上`
  else label = `NT$ ${maxPrice} 以下`
  return <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{label}</span>
}

export default function KeywordCard({ keyword: kw, onEdit, onDelete, onToggle, toggleDisabled }: KeywordCardProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-gray-900">{kw.keyword}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              kw.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {kw.active ? '監控中' : '已停用'}
          </span>
          {kw.matchMode && kw.matchMode !== 'any' && (
            <Badge variant="outline" className="text-indigo-600 border-indigo-300 text-xs">
              {MATCH_MODE_BADGE_LABELS[kw.matchMode] ?? kw.matchMode}
            </Badge>
          )}
        </div>

        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {kw.platforms.map((p) => (
            <Badge key={p} variant="outline" className={`text-xs ${PLATFORM_BADGE_CLASS[p] ?? ''}`}>
              {PLATFORM_LABELS[p] ?? p}
            </Badge>
          ))}
          <PriceRange minPrice={kw.minPrice} maxPrice={kw.maxPrice} />
          {kw.mustInclude?.map((word) => (
            <span key={word} className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">
              +{word}
            </span>
          ))}
          {kw.blocklist?.map((word) => (
            <span key={word} className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">
              -{word}
            </span>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Switch
          checked={kw.active}
          onCheckedChange={onToggle}
          disabled={toggleDisabled}
          aria-label={kw.active ? '停用' : '啟用'}
        />

        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          aria-label="編輯"
          className="h-8 w-8 text-gray-500 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
          </svg>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          disabled={toggleDisabled}
          aria-label="刪除"
          className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </Button>
      </div>
    </div>
  )
}
