'use client'

import type { Tag } from '@/types/tag'
import { TagChip } from './TagChip'
import { Button } from '@/components/ui/button'

interface TagFilterBarProps {
  tags: Tag[]
  selectedTagIds: string[]
  onChange: (next: string[]) => void
  label?: string
}

export function TagFilterBar({ tags, selectedTagIds, onChange, label = '標籤篩選' }: TagFilterBarProps) {
  if (tags.length === 0) return null

  const toggle = (id: string) => {
    if (selectedTagIds.includes(id)) {
      onChange(selectedTagIds.filter((x) => x !== id))
    } else {
      onChange([...selectedTagIds, id])
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">{label}</span>
      {tags.map((t) => (
        <TagChip
          key={t.id}
          name={t.name}
          color={t.color}
          selected={selectedTagIds.includes(t.id)}
          onClick={() => toggle(t.id)}
        />
      ))}
      {selectedTagIds.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => onChange([])}
        >
          清除
        </Button>
      )}
    </div>
  )
}
