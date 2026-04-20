'use client'

import type { Tag } from '@/types/tag'
import { useCallback, useEffect, useState } from 'react'

interface UseTagsResult {
  tags: Tag[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  setTags: React.Dispatch<React.SetStateAction<Tag[]>>
}

export function useTags(): UseTagsResult {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/tags')
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? '載入標籤失敗')
      }
      const data = (await res.json()) as Tag[]
      setTags(data)
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '載入標籤失敗')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { tags, loading, error, refetch, setTags }
}
