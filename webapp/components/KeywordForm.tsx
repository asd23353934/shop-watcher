'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import type { Keyword } from '@/types/keyword'
import { MATCH_MODE_LABELS } from '@/constants/matchMode'
import { PLATFORM_LABELS } from '@/constants/platform'

interface KeywordFormProps {
  onSuccess?: (keyword: Keyword) => void
}

const MATCH_MODE_EXAMPLES_FORM: Record<string, string> = {
  any: '關鍵字「機械 鍵盤」→ 商品名含「機械」或「鍵盤」任一詞即通知，範圍較廣',
  all: '關鍵字「機械 鍵盤」→ 商品名必須同時含「機械」和「鍵盤」，過濾不相關商品',
  exact: '關鍵字「機械鍵盤」→ 商品名必須包含「機械鍵盤」這段完整字串，最精確',
}

export default function KeywordForm({ onSuccess }: KeywordFormProps) {
  const [keyword, setKeyword] = useState('')
  const [platforms, setPlatforms] = useState<string[]>(['ruten'])
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [blocklist, setBlocklist] = useState<string[]>([])
  const [blocklistInput, setBlocklistInput] = useState('')
  const [mustInclude, setMustInclude] = useState<string[]>([])
  const [mustIncludeInput, setMustIncludeInput] = useState('')
  const [matchMode, setMatchMode] = useState('any')
  const [active, setActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [sellerBlocklist, setSellerBlocklist] = useState<string[]>([])
  const [sellerBlocklistInput, setSellerBlocklistInput] = useState('')
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState('')
  const [maxNotifyPerScan, setMaxNotifyPerScan] = useState('')

  const togglePlatform = (platform: string) => {
    setPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    )
  }

  const handleAddBlockword = () => {
    const word = blocklistInput.trim()
    if (!word || blocklist.includes(word)) return
    setBlocklist((prev) => [...prev, word])
    setBlocklistInput('')
  }

  const handleRemoveBlockword = (word: string) => {
    setBlocklist((prev) => prev.filter((w) => w !== word))
  }

  const handleAddMustInclude = () => {
    const word = mustIncludeInput.trim()
    if (!word || mustInclude.includes(word)) return
    setMustInclude((prev) => [...prev, word])
    setMustIncludeInput('')
  }

  const handleRemoveMustInclude = (word: string) => {
    setMustInclude((prev) => prev.filter((w) => w !== word))
  }

  const handleAddSellerBlockword = () => {
    const word = sellerBlocklistInput.trim()
    if (!word || sellerBlocklist.includes(word)) return
    setSellerBlocklist((prev) => [...prev, word])
    setSellerBlocklistInput('')
  }

  const handleRemoveSellerBlockword = (word: string) => {
    setSellerBlocklist((prev) => prev.filter((w) => w !== word))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
          blocklist,
          mustInclude,
          matchMode,
          active,
          sellerBlocklist,
          discordWebhookUrl: discordWebhookUrl || null,
          maxNotifyPerScan: maxNotifyPerScan ? Number(maxNotifyPerScan) : null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? '建立失敗')
        return
      }

      const newKeyword: Keyword = await res.json()

      // Reset form
      setKeyword('')
      setPlatforms(['ruten'])
      setMinPrice('')
      setMaxPrice('')
      setBlocklist([])
      setBlocklistInput('')
      setMustInclude([])
      setMustIncludeInput('')
      setMatchMode('any')
      setActive(true)
      setSellerBlocklist([])
      setSellerBlocklistInput('')
      setDiscordWebhookUrl('')
      setMaxNotifyPerScan('')
      toast.success('關鍵字已新增')
      onSuccess?.(newKeyword)
    } catch {
      toast.error('網路錯誤，請再試一次')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-800">新增關鍵字</h2>

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
        <div className="flex flex-wrap gap-4">
          {Object.entries(PLATFORM_LABELS).map(([platform, label]) => (
            <label key={platform} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={platforms.includes(platform)}
                onChange={() => togglePlatform(platform)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Match mode */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">搜尋精確度</label>
        <select
          value={matchMode}
          onChange={(e) => setMatchMode(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {Object.entries(MATCH_MODE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {matchMode && MATCH_MODE_EXAMPLES_FORM[matchMode] && (
          <p className="mt-1 text-xs text-gray-400">
            範例：{MATCH_MODE_EXAMPLES_FORM[matchMode]}
          </p>
        )}
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

      {/* Must-include */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">必包詞（選填）</label>
        {mustInclude.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {mustInclude.map((word) => (
              <span
                key={word}
                className="flex items-center gap-1 rounded bg-green-100 px-2 py-0.5 text-xs text-green-700"
              >
                {word}
                <button
                  type="button"
                  onClick={() => handleRemoveMustInclude(word)}
                  className="ml-0.5 text-green-400 hover:text-green-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={mustIncludeInput}
            onChange={(e) => setMustIncludeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleAddMustInclude() }
            }}
            placeholder="輸入必包詞後按新增"
            className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={handleAddMustInclude}
            className="rounded-md border px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            新增
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-400">商品名稱必須包含所有必包詞才會發送通知</p>
      </div>

      {/* Blocklist */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          禁詞（選填）
        </label>
        {blocklist.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {blocklist.map((word) => (
              <span
                key={word}
                className="flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-xs text-red-700"
              >
                {word}
                <button
                  type="button"
                  onClick={() => handleRemoveBlockword(word)}
                  className="ml-0.5 text-red-400 hover:text-red-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={blocklistInput}
            onChange={(e) => setBlocklistInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleAddBlockword() }
            }}
            placeholder="輸入禁詞後按新增"
            className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={handleAddBlockword}
            className="rounded-md border px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            新增
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-400">商品名稱包含禁詞時不會發送通知</p>
      </div>

      {/* Seller blocklist */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          賣家/社團黑名單（選填）
        </label>
        {sellerBlocklist.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {sellerBlocklist.map((word) => (
              <span
                key={word}
                className="flex items-center gap-1 rounded bg-orange-100 px-2 py-0.5 text-xs text-orange-700"
              >
                {word}
                <button
                  type="button"
                  onClick={() => handleRemoveSellerBlockword(word)}
                  className="ml-0.5 text-orange-400 hover:text-orange-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={sellerBlocklistInput}
            onChange={(e) => setSellerBlocklistInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleAddSellerBlockword() }
            }}
            placeholder="輸入賣家名稱或 ID 後按新增"
            className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={handleAddSellerBlockword}
            className="rounded-md border px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            新增
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-400">含此賣家名稱或 ID 的商品不會發送通知（不分大小寫）</p>
      </div>

      {/* Per-keyword Discord Webhook */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          專屬 Discord Webhook（選填）
        </label>
        <input
          type="url"
          value={discordWebhookUrl}
          onChange={(e) => setDiscordWebhookUrl(e.target.value)}
          placeholder="https://discord.com/api/webhooks/..."
          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p className="mt-1 text-xs text-gray-400">留空時使用全域 Webhook，填寫後此關鍵字的通知單獨送至此頻道</p>
      </div>

      {/* maxNotifyPerScan */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          每次掃描通知上限（選填）
        </label>
        <input
          type="number"
          value={maxNotifyPerScan}
          onChange={(e) => setMaxNotifyPerScan(e.target.value)}
          min="1"
          placeholder="預設使用系統設定"
          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p className="mt-1 text-xs text-gray-400">限制此關鍵字單次掃描最多傳送幾則通知，防止熱門商品刷爆頻道</p>
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
