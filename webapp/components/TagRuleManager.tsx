'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Trash2, Loader2, Plus } from 'lucide-react'
import { TagChip } from './TagChip'
import { useTags } from '@/lib/hooks/useTags'
import type { TagRule } from '@/types/tagRule'

function isPatternValid(pattern: string): boolean {
  if (!pattern) return false
  try {
    new RegExp(pattern, 'i')
    return true
  } catch {
    return false
  }
}

export function TagRuleManager() {
  const { tags } = useTags()
  const [rules, setRules] = useState<TagRule[]>([])
  const [loading, setLoading] = useState(true)
  const [newPattern, setNewPattern] = useState('')
  const [newTagId, setNewTagId] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Record<string, { pattern: string; tagId: string }>>({})

  useEffect(() => {
    fetch('/api/tag-rules')
      .then(async (r) => {
        if (!r.ok) throw new Error('fetch failed')
        return (await r.json()) as TagRule[]
      })
      .then((data) => setRules(data))
      .catch(() => toast.error('載入規則失敗'))
      .finally(() => setLoading(false))
  }, [])

  const { systemRules, userRules } = useMemo(() => {
    const sys: TagRule[] = []
    const usr: TagRule[] = []
    for (const r of rules) (r.systemDefault ? sys : usr).push(r)
    return { systemRules: sys, userRules: usr }
  }, [rules])

  const patchRule = async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/tag-rules/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const b = await res.json().catch(() => ({}))
      toast.error(b.error ?? '更新失敗')
      return null
    }
    return (await res.json()) as TagRule
  }

  const toggleEnabled = async (rule: TagRule) => {
    const updated = await patchRule(rule.id, { enabled: !rule.enabled })
    if (updated) {
      setRules((prev) => prev.map((r) => (r.id === rule.id ? updated : r)))
    }
  }

  const deleteRule = async (rule: TagRule) => {
    const res = await fetch(`/api/tag-rules/${rule.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const b = await res.json().catch(() => ({}))
      toast.error(b.error ?? '刪除失敗')
      return
    }
    setRules((prev) => prev.filter((r) => r.id !== rule.id))
    toast.success('規則已刪除')
  }

  const submitNew = async () => {
    if (!isPatternValid(newPattern) || !newTagId) return
    setCreating(true)
    try {
      const res = await fetch('/api/tag-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pattern: newPattern, tagId: newTagId }),
      })
      if (!res.ok) {
        const b = await res.json().catch(() => ({}))
        toast.error(b.error ?? '建立失敗')
        return
      }
      const created = (await res.json()) as TagRule
      setRules((prev) => [...prev, created])
      setNewPattern('')
      setNewTagId('')
      toast.success('規則已建立')
    } finally {
      setCreating(false)
    }
  }

  const startEdit = (rule: TagRule) => {
    setEditing((prev) => ({ ...prev, [rule.id]: { pattern: rule.pattern, tagId: rule.tag.id } }))
  }

  const cancelEdit = (id: string) => {
    setEditing((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const saveEdit = async (rule: TagRule) => {
    const draft = editing[rule.id]
    if (!draft) return
    if (!isPatternValid(draft.pattern)) {
      toast.error('規則格式錯誤')
      return
    }
    const body: Record<string, unknown> = {}
    if (draft.pattern !== rule.pattern) body.pattern = draft.pattern
    if (draft.tagId !== rule.tag.id) body.tagId = draft.tagId
    if (Object.keys(body).length === 0) {
      cancelEdit(rule.id)
      return
    }
    const updated = await patchRule(rule.id, body)
    if (updated) {
      setRules((prev) => prev.map((r) => (r.id === rule.id ? updated : r)))
      cancelEdit(rule.id)
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500"><Loader2 className="inline h-4 w-4 animate-spin mr-1" />載入中…</p>
  }

  const newPatternValid = !newPattern || isPatternValid(newPattern)

  return (
    <div className="space-y-6">
      {/* 新增規則 */}
      <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-3">
        <p className="mb-2 text-xs font-semibold text-gray-600 dark:text-gray-400">新增規則</p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={newPattern}
            onChange={(e) => setNewPattern(e.target.value)}
            placeholder="regex pattern，例：figma|nendoroid"
            className={`flex-1 min-w-[200px] rounded border px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
              newPatternValid ? 'border-gray-300 dark:border-gray-700' : 'border-red-500'
            }`}
          />
          <select
            value={newTagId}
            onChange={(e) => setNewTagId(e.target.value)}
            className="rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-sm text-gray-900 dark:text-gray-100"
          >
            <option value="">選擇標籤</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <button
            onClick={submitNew}
            disabled={creating || !isPatternValid(newPattern) || !newTagId}
            className="inline-flex items-center gap-1 rounded bg-indigo-600 px-3 py-1 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            建立
          </button>
        </div>
        {!newPatternValid && (
          <p className="mt-1 text-xs text-red-500">規則格式錯誤</p>
        )}
      </div>

      {/* 使用者規則 */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">我的規則（{userRules.length}）</h3>
        {userRules.length === 0 ? (
          <p className="text-xs text-gray-400">尚未建立自訂規則</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {userRules.map((r) => {
              const draft = editing[r.id]
              const draftValid = !draft || isPatternValid(draft.pattern)
              return (
                <li key={r.id} className="flex flex-wrap items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    checked={r.enabled}
                    onChange={() => toggleEnabled(r)}
                    className="h-4 w-4"
                  />
                  {draft ? (
                    <>
                      <input
                        value={draft.pattern}
                        onChange={(e) =>
                          setEditing((prev) => ({ ...prev, [r.id]: { ...draft, pattern: e.target.value } }))
                        }
                        className={`flex-1 min-w-[200px] rounded border px-2 py-1 text-sm font-mono bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                          draftValid ? 'border-gray-300 dark:border-gray-700' : 'border-red-500'
                        }`}
                      />
                      <select
                        value={draft.tagId}
                        onChange={(e) =>
                          setEditing((prev) => ({ ...prev, [r.id]: { ...draft, tagId: e.target.value } }))
                        }
                        className="rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-sm text-gray-900 dark:text-gray-100"
                      >
                        {tags.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => saveEdit(r)}
                        disabled={!draftValid}
                        className="rounded bg-indigo-600 px-2 py-1 text-xs text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        儲存
                      </button>
                      <button
                        onClick={() => cancelEdit(r.id)}
                        className="rounded border border-gray-300 dark:border-gray-700 px-2 py-1 text-xs text-gray-600 dark:text-gray-300"
                      >
                        取消
                      </button>
                    </>
                  ) : (
                    <>
                      <code className="flex-1 min-w-[180px] rounded bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-800 dark:text-gray-200">
                        {r.pattern}
                      </code>
                      <TagChip name={r.tag.name} color={r.tag.color} />
                      <button
                        onClick={() => startEdit(r)}
                        className="text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        編輯
                      </button>
                      <button
                        onClick={() => deleteRule(r)}
                        className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1"
                        aria-label="刪除規則"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* 系統規則 */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">系統預設（{systemRules.length}）</h3>
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {systemRules.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-2 py-2">
              <input
                type="checkbox"
                checked={r.enabled}
                onChange={() => toggleEnabled(r)}
                className="h-4 w-4"
              />
              <code className="flex-1 min-w-[180px] rounded bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-800 dark:text-gray-200">
                {r.pattern}
              </code>
              <TagChip name={r.tag.name} color={r.tag.color} />
              <span className="text-[11px] text-gray-400">系統預設</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
