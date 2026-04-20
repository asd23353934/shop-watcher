'use client'

import type { Tag } from '@/types/tag'
import { useState } from 'react'
import { TagChip } from './TagChip'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

interface TagSelectorProps {
  tags: Tag[]
  selectedTagIds: string[]
  onChange: (next: string[]) => void
  onTagCreated?: (tag: Tag) => void
}

export function TagSelector({ tags, selectedTagIds, onChange, onTagCreated }: TagSelectorProps) {
  const [input, setInput] = useState('')
  const [creating, setCreating] = useState(false)

  const toggle = (id: string) => {
    if (selectedTagIds.includes(id)) {
      onChange(selectedTagIds.filter((x) => x !== id))
    } else {
      onChange([...selectedTagIds, id])
    }
  }

  const handleCreate = async () => {
    const name = input.trim()
    if (!name) return
    // If the tag already exists, just select it
    const existing = tags.find((t) => t.name === name)
    if (existing) {
      if (!selectedTagIds.includes(existing.id)) onChange([...selectedTagIds, existing.id])
      setInput('')
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(body.error ?? '建立標籤失敗')
        return
      }
      const newTag = body as Tag
      onTagCreated?.(newTag)
      onChange([...selectedTagIds, newTag.id])
      setInput('')
    } catch {
      toast.error('建立標籤失敗')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[1.5rem]">
        {tags.length === 0 && (
          <span className="text-xs text-gray-400">尚無標籤，輸入名稱建立第一個</span>
        )}
        {tags.map((t) => (
          <TagChip
            key={t.id}
            name={t.name}
            color={t.color}
            selected={selectedTagIds.includes(t.id)}
            onClick={() => toggle(t.id)}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleCreate()
            }
          }}
          placeholder="新增標籤…"
          maxLength={30}
          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
        <Button type="button" size="sm" onClick={handleCreate} disabled={creating || !input.trim()}>
          <Plus className="h-4 w-4" />
          新增
        </Button>
      </div>
    </div>
  )
}
