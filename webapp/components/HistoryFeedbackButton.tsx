'use client'

import { useState } from 'react'

interface HistoryFeedbackButtonProps {
  keywordId: string | null
}

export default function HistoryFeedbackButton({ keywordId }: HistoryFeedbackButtonProps) {
  const [open, setOpen] = useState(false)
  const [word, setWord] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const disabled = !keywordId

  const handleSubmit = async () => {
    if (!keywordId || !word.trim()) return
    setStatus('loading')
    try {
      const res = await fetch(`/api/keywords/${keywordId}/blocklist`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: word.trim() }),
      })
      if (res.ok) {
        setStatus('success')
        setWord('')
        setTimeout(() => {
          setStatus('idle')
          setOpen(false)
        }, 1500)
      } else {
        const data = await res.json().catch(() => ({}))
        setErrorMsg(data.error ?? '加入失敗')
        setStatus('error')
      }
    } catch {
      setErrorMsg('網路錯誤')
      setStatus('error')
    }
  }

  if (disabled) {
    return (
      <span title="關鍵字已刪除">
        <button
          disabled
          className="rounded border px-2 py-0.5 text-xs text-gray-300 cursor-not-allowed"
        >
          加入禁詞
        </button>
      </span>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded border px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-50"
      >
        加入禁詞
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1">
      {status === 'success' ? (
        <span className="text-xs text-green-600">已加入禁詞 ✓</span>
      ) : (
        <>
          <input
            autoFocus
            type="text"
            value={word}
            onChange={(e) => { setWord(e.target.value); setStatus('idle') }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit()
              if (e.key === 'Escape') { setOpen(false); setWord('') }
            }}
            placeholder="輸入禁詞"
            className="w-24 rounded border px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
          <button
            onClick={handleSubmit}
            disabled={status === 'loading'}
            className="rounded bg-indigo-600 px-2 py-0.5 text-xs text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {status === 'loading' ? '…' : '加入'}
          </button>
          <button
            onClick={() => { setOpen(false); setWord(''); setStatus('idle') }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
          {status === 'error' && (
            <span className="text-xs text-red-500">{errorMsg}</span>
          )}
        </>
      )}
    </div>
  )
}
