'use client'

import { useState } from 'react'
import { toast } from 'sonner'

interface CircleFollow {
  id: string
  platform: string
  circleId: string
  circleName: string
  webhookUrl: string | null
  active: boolean
  createdAt: string
}

interface CircleFollowFormProps {
  onSuccess?: (follow: CircleFollow) => void
}

const PLATFORMS = [
  { value: 'booth',  label: 'BOOTH',  style: 'border-rose-400 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-950 dark:text-rose-400' },
  { value: 'dlsite', label: 'DLsite', style: 'border-violet-400 bg-violet-50 text-violet-700 dark:border-violet-700 dark:bg-violet-950 dark:text-violet-400' },
]

const PLACEHOLDER: Record<string, string> = {
  booth:  '例：my-shop（booth.pm 店家 slug）',
  dlsite: '例：RG12345',
}

const HINT: Record<string, string> = {
  booth:  'BOOTH 店家網址中的 slug，例：my-shop.booth.pm 的 ID 為「my-shop」',
  dlsite: 'DLsite 社團 ID，例：https://www.dlsite.com/maniax/circle/profile/=/maker_id/RG12345',
}

export default function CircleFollowForm({ onSuccess }: CircleFollowFormProps) {
  const [platform, setPlatform] = useState('booth')
  const [circleId, setCircleId] = useState('')
  const [circleName, setCircleName] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/circles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          circleId: circleId.trim(),
          circleName: circleName.trim(),
          webhookUrl: webhookUrl.trim() || null,
        }),
      })

      if (res.status === 409) {
        toast.error('已追蹤此社團（重複的平台/社團組合）')
        return
      }

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? '新增失敗')
        return
      }

      const follow: CircleFollow = await res.json()
      setCircleId('')
      setCircleName('')
      setWebhookUrl('')
      setPlatform('booth')
      toast.success('社團追蹤已新增')
      onSuccess?.(follow)
    } catch {
      toast.error('網路錯誤，請再試一次')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500'
  const labelClass = 'mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300'

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
      <h2 className="mb-5 text-lg font-semibold text-gray-800 dark:text-gray-100">新增社團追蹤</h2>

      {/* Platform toggle buttons */}
      <div className="mb-5">
        <label className={labelClass}>
          平台 <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          {PLATFORMS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPlatform(p.value)}
              className={`flex-1 rounded-lg border-2 py-2 text-sm font-semibold transition-all ${
                platform === p.value
                  ? p.style
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Circle ID */}
      <div className="mb-4">
        <label className={labelClass}>
          社團 / 店家 ID <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={circleId}
          onChange={(e) => setCircleId(e.target.value)}
          placeholder={PLACEHOLDER[platform]}
          className={inputClass}
          required
        />
        <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">{HINT[platform]}</p>
      </div>

      {/* Circle Name */}
      <div className="mb-4">
        <label className={labelClass}>
          社團 / 店家名稱 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={circleName}
          onChange={(e) => setCircleName(e.target.value)}
          placeholder="例：My Circle"
          className={inputClass}
          required
        />
        <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">用於通知標題顯示，不影響爬取行為</p>
      </div>

      {/* Webhook URL */}
      <div className="mb-6">
        <label className={labelClass}>
          專屬 Discord Webhook（選填）
        </label>
        <input
          type="url"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          placeholder="https://discord.com/api/webhooks/..."
          className={inputClass}
        />
        <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">留空時使用全域 Webhook</p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 transition-colors"
      >
        {loading ? '新增中...' : '新增社團追蹤'}
      </button>
    </form>
  )
}
