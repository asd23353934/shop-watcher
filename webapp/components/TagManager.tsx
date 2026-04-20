'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Trash2, Loader2 } from 'lucide-react'
import { TagChip } from './TagChip'
import { useTags } from '@/lib/hooks/useTags'
import type { Tag } from '@/types/tag'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function TagManager() {
  const { tags, loading, setTags } = useTags()
  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null)
  const [deleting, setDeleting] = useState(false)

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/tags/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body.error ?? '刪除失敗')
        return
      }
      setTags((prev) => prev.filter((t) => t.id !== deleteTarget.id))
      toast.success('標籤已刪除')
      setDeleteTarget(null)
    } catch {
      toast.error('網路錯誤，請再試一次')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500"><Loader2 className="inline h-4 w-4 animate-spin mr-1" />載入中…</p>
  }

  if (tags.length === 0) {
    return <p className="text-sm text-gray-400">尚無標籤，建立關鍵字或社團時可新增標籤</p>
  }

  return (
    <>
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {tags.map((t) => (
          <li key={t.id} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <TagChip name={t.name} color={t.color} />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {t.keywordCount ?? 0} 關鍵字 · {t.circleCount ?? 0} 社團
              </span>
            </div>
            <button
              onClick={() => setDeleteTarget(t)}
              className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1"
              aria-label="刪除標籤"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>刪除標籤「{deleteTarget?.name}」</AlertDialogTitle>
            <AlertDialogDescription>
              此標籤目前套用於 {deleteTarget?.keywordCount ?? 0} 個關鍵字、{deleteTarget?.circleCount ?? 0} 個社團。
              刪除後僅會解除關聯，不會影響關鍵字或社團本身。此動作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting ? <><Loader2 className="inline h-4 w-4 animate-spin mr-1" />刪除中</> : '刪除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
