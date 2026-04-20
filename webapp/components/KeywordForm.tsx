'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ChevronDown, ChevronUp, Loader2, X } from 'lucide-react'
import type { Keyword } from '@/types/keyword'
import { MATCH_MODE_LABELS, MATCH_MODE_EXAMPLES } from '@/constants/matchMode'
import { PLATFORM_LABELS, TAIWAN_PLATFORMS, JAPAN_PLATFORMS } from '@/constants/platform'
import { cn } from '@/lib/utils'
import { TagSelector } from '@/components/TagSelector'
import { useTags } from '@/lib/hooks/useTags'

interface KeywordFormProps {
  onSuccess?: (keyword: Keyword) => void
}



export default function KeywordForm({ onSuccess }: KeywordFormProps) {
  const [keyword, setKeyword]             = useState('')
  const [platforms, setPlatforms]         = useState<string[]>(['ruten'])
  const [matchMode, setMatchMode]         = useState('any')
  const [minPrice, setMinPrice]           = useState('')
  const [maxPrice, setMaxPrice]           = useState('')
  const [blocklist, setBlocklist]         = useState<string[]>([])
  const [blocklistInput, setBlocklistInput] = useState('')
  const [mustInclude, setMustInclude]     = useState<string[]>([])
  const [mustIncludeInput, setMustIncludeInput] = useState('')
  const [sellerBlocklist, setSellerBlocklist]  = useState<string[]>([])
  const [sellerInput, setSellerInput]          = useState('')
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState('')
  const [maxNotifyPerScan, setMaxNotifyPerScan]   = useState('')
  const [active, setActive]               = useState(true)
  const [advancedOpen, setAdvancedOpen]   = useState(false)
  const [loading, setLoading]             = useState(false)
  const [tagIds, setTagIds]               = useState<string[]>([])
  const { tags, setTags } = useTags()

  const togglePlatform = (p: string) =>
    setPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])

  const addChip = (val: string, list: string[], setList: (v: string[]) => void, setInput: (v: string) => void) => {
    const t = val.trim()
    if (t && !list.includes(t)) setList([...list, t])
    setInput('')
  }

  const removeChip = (val: string, list: string[], setList: (v: string[]) => void) =>
    setList(list.filter((v) => v !== val))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!keyword.trim()) { toast.error('請輸入關鍵字'); return }
    if (keyword.trim().length < 2) { toast.error('關鍵字至少需要 2 個字元'); return }
    if (platforms.length === 0) { toast.error('請至少選擇一個平台'); return }
    setLoading(true)

    try {
      const res = await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword, platforms,
          minPrice: minPrice ? Number(minPrice) : null,
          maxPrice: maxPrice ? Number(maxPrice) : null,
          blocklist, mustInclude, matchMode, active, sellerBlocklist,
          discordWebhookUrl: discordWebhookUrl || null,
          maxNotifyPerScan: maxNotifyPerScan ? Number(maxNotifyPerScan) : null,
          tagIds,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? '建立失敗')
        return
      }

      const newKeyword: Keyword = await res.json()
      setKeyword(''); setPlatforms(['ruten']); setMinPrice(''); setMaxPrice('')
      setBlocklist([]); setMustInclude([]); setMatchMode('any')
      setSellerBlocklist([]); setDiscordWebhookUrl(''); setMaxNotifyPerScan('')
      setTagIds([])
      toast.success('關鍵字已新增')
      onSuccess?.(newKeyword)
    } catch {
      toast.error('網路錯誤，請再試一次')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* ① 基本設定 */}
      <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">① 基本設定</p>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            關鍵字 <span className="text-red-500">*</span>
          </label>
          <input
            type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} required
            placeholder="例：初音ミク figma 1/7"
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-xs text-gray-400">建議包含：商品名稱、品牌、尺寸</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">搜尋精確度</label>
          <div className="space-y-2">
            {Object.entries(MATCH_MODE_LABELS).map(([value, label]) => (
              <button key={value} type="button" onClick={() => setMatchMode(value)}
                className={cn('w-full p-3 rounded-lg border-2 text-left transition-all',
                  matchMode === value
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300')}>
                <div className="flex items-center gap-2">
                  <span className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                    matchMode === value ? 'border-indigo-600' : 'border-gray-300')}>
                    {matchMode === value && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
                  </span>
                  <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{label}</span>
                </div>
                {MATCH_MODE_EXAMPLES[value] && (
                  <p className="text-xs text-gray-400 ml-6 mt-1">{MATCH_MODE_EXAMPLES[value]}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ② 監控平台 */}
      <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          ② 監控平台 <span className="text-red-500">*</span>
        </p>
        <div className="flex gap-3 text-xs">
          <button type="button" onClick={() => setPlatforms(Object.keys(PLATFORM_LABELS))} className="text-indigo-600 dark:text-indigo-400 hover:underline">全選</button>
          <button type="button" onClick={() => setPlatforms([])} className="text-indigo-600 dark:text-indigo-400 hover:underline">全消</button>
          <button type="button" onClick={() => setPlatforms(TAIWAN_PLATFORMS)} className="text-indigo-600 dark:text-indigo-400 hover:underline">台灣平台</button>
          <button type="button" onClick={() => setPlatforms(JAPAN_PLATFORMS)} className="text-indigo-600 dark:text-indigo-400 hover:underline">日本平台</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {Object.entries(PLATFORM_LABELS).map(([p, label]) => {
            const selected = platforms.includes(p)
            return (
              <button key={p} type="button" onClick={() => togglePlatform(p)}
                className={cn('p-2.5 rounded-lg border-2 text-left text-sm transition-all',
                  selected
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 ring-1 ring-indigo-500'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300')}>
                <span className="text-gray-900 dark:text-gray-100">{label}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* ③ 價格篩選 */}
      <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">③ 價格篩選（選填）</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 space-y-1">
            <label className="text-sm text-gray-600 dark:text-gray-400">最低價格</label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-500">NT$</span>
              <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} min="0" placeholder="不限"
                className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <span className="text-gray-400 mt-5">—</span>
          <div className="flex-1 space-y-1">
            <label className="text-sm text-gray-600 dark:text-gray-400">最高價格</label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-500">NT$</span>
              <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} min="0" placeholder="不限"
                className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400">不填表示無限制</p>
      </section>

      {/* ④ 進階篩選 — collapsible */}
      <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
        <button type="button" onClick={() => setAdvancedOpen(!advancedOpen)}
          className="w-full px-5 py-4 flex items-center justify-between text-left">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">④ 進階篩選（選填）</p>
          {advancedOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </button>
        {advancedOpen && (
          <div className="px-5 pb-5 space-y-4 border-t border-gray-100 dark:border-gray-800 pt-4">
            <FormChipInput label="必包詞" hint="商品名稱必須包含以下任一詞（OR 邏輯）" chips={mustInclude} inputValue={mustIncludeInput}
              onInputChange={setMustIncludeInput}
              onAdd={() => addChip(mustIncludeInput, mustInclude, setMustInclude, setMustIncludeInput)}
              onRemove={(w) => removeChip(w, mustInclude, setMustInclude)}
              chipClass="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300" />
            <FormChipInput label="禁詞" hint="商品名稱含以下詞則跳過（例：二手、代購）" chips={blocklist} inputValue={blocklistInput}
              onInputChange={setBlocklistInput}
              onAdd={() => addChip(blocklistInput, blocklist, setBlocklist, setBlocklistInput)}
              onRemove={(w) => removeChip(w, blocklist, setBlocklist)}
              chipClass="bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300" />
            <FormChipInput label="屏蔽賣場" hint="來自以下賣場的商品一律過濾" chips={sellerBlocklist} inputValue={sellerInput}
              onInputChange={setSellerInput}
              onAdd={() => addChip(sellerInput, sellerBlocklist, setSellerBlocklist, setSellerInput)}
              onRemove={(w) => removeChip(w, sellerBlocklist, setSellerBlocklist)}
              chipClass="bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300" />
          </div>
        )}
      </section>

      {/* ⑤ 通知設定 */}
      <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm space-y-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">⑤ 通知設定（選填）</p>
          <p className="text-xs text-gray-400 mt-0.5">不填則使用全域通知設定</p>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-600 dark:text-gray-400">自訂 Discord Webhook URL</label>
          <input type="url" value={discordWebhookUrl} onChange={(e) => setDiscordWebhookUrl(e.target.value)}
            placeholder="https://discord.com/api/webhooks/..."
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <p className="text-xs text-gray-400">留空時使用全域 Webhook，填寫後此關鍵字的通知單獨送至此頻道</p>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-600 dark:text-gray-400">每次掃描通知上限（選填）</label>
          <input type="number" value={maxNotifyPerScan} onChange={(e) => setMaxNotifyPerScan(e.target.value)} min="1"
            placeholder="空白 = 無上限"
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-xs" />
          <p className="text-xs text-gray-400">限制此關鍵字單次掃描最多傳送幾則通知</p>
        </div>

        {/* Active toggle */}
        <div className="flex items-center gap-3">
          <label className="relative inline-flex cursor-pointer items-center">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="peer sr-only" />
            <div className="peer h-6 w-11 rounded-full bg-gray-200 dark:bg-gray-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full" />
          </label>
          <span className="text-sm text-gray-700 dark:text-gray-300">建立後立即啟用監控</span>
        </div>
      </section>

      {/* ⑥ 標籤 */}
      <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">⑥ 標籤（選填）</p>
        <TagSelector
          tags={tags}
          selectedTagIds={tagIds}
          onChange={setTagIds}
          onTagCreated={(t) => setTags((prev) => [...prev, t])}
        />
      </section>

      {/* Submit */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-gray-400">所有欄位填寫完成後即可建立</span>
        <button type="submit" disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">
          {loading ? <><Loader2 className="inline h-4 w-4 animate-spin mr-1" />新增中</> : '建立關鍵字'}
        </button>
      </div>
    </form>
  )
}

// ── Form chip input helper ──────────────────────────────────────────────────
interface FormChipInputProps {
  label: string
  hint?: string
  chips: string[]
  inputValue: string
  onInputChange: (v: string) => void
  onAdd: () => void
  onRemove: (v: string) => void
  chipClass: string
}

function FormChipInput({ label, hint, chips, inputValue, onInputChange, onAdd, onRemove, chipClass }: FormChipInputProps) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-gray-600 dark:text-gray-400">{label}</label>
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <span key={c} className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs', chipClass)}>
              {c}
              <button type="button" onClick={() => onRemove(c)}><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      )}
      <input type="text" value={inputValue} onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAdd() } }}
        placeholder="輸入後按 Enter"
        className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  )
}
