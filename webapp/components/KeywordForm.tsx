'use client'

import { useState } from 'react'

interface KeywordFormProps {
  onSuccess?: () => void
}

export default function KeywordForm({ onSuccess }: KeywordFormProps) {
  const [keyword, setKeyword] = useState('')
  const [platforms, setPlatforms] = useState<string[]>(['shopee', 'ruten'])
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [blocklist, setBlocklist] = useState('')
  const [active, setActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const togglePlatform = (platform: string) => {
    setPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword,
          platforms,
          minPrice: minPrice ? Number(minPrice) : null,
          maxPrice: maxPrice ? Number(maxPrice) : null,
          blocklist: blocklist
            .split(',')
            .map((w) => w.trim())
            .filter((w) => w.length > 0),
          active,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? '建立失敗')
        return
      }

      // Reset form
      setKeyword('')
      setPlatforms(['shopee', 'ruten'])
      setMinPrice('')
      setMaxPrice('')
      setBlocklist('')
      setActive(true)
      onSuccess?.()
    } catch {
      setError('網路錯誤，請再試一次')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-800">新增關鍵字</h2>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
      )}

      {/* Keyword */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          關鍵字 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="例：機械鍵盤"
          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
      </div>

      {/* Platforms */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          平台 <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-4">
          {['shopee', 'ruten'].map((platform) => (
            <label key={platform} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={platforms.includes(platform)}
                onChange={() => togglePlatform(platform)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600"
              />
              {platform === 'shopee' ? '蝦皮' : '露天'}
            </label>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div className="mb-4 flex gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-gray-700">最低價格（NT$）</label>
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            min="0"
            placeholder="不限"
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-gray-700">最高價格（NT$）</label>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            min="0"
            placeholder="不限"
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Blocklist */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          禁詞（選填）
        </label>
        <input
          type="text"
          value={blocklist}
          onChange={(e) => setBlocklist(e.target.value)}
          placeholder="廣告,整組,代工（逗號分隔）"
          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p className="mt-1 text-xs text-gray-400">商品名稱包含禁詞時不會發送通知</p>
      </div>

      {/* Active toggle */}
      <div className="mb-6 flex items-center gap-3">
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="peer sr-only"
          />
          <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full"></div>
        </label>
        <span className="text-sm text-gray-700">啟用監控</span>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? '新增中...' : '新增關鍵字'}
      </button>
    </form>
  )
}
