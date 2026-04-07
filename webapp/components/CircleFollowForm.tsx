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

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-800">新增社團追蹤</h2>

      {/* Platform */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          平台 <span className="text-red-500">*</span>
        </label>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="booth">BOOTH</option>
          <option value="dlsite">DLsite</option>
        </select>
      </div>

      {/* Circle ID */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          社團 / 店家 ID <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={circleId}
          onChange={(e) => setCircleId(e.target.value)}
          placeholder={platform === 'booth' ? '例：my-shop（booth.pm 店家 slug）' : '例：RG12345'}
          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
        <p className="mt-1 text-xs text-gray-400">
          {platform === 'booth'
            ? 'BOOTH 店家網址中的 slug，例：my-shop.booth.pm 的 ID 為「my-shop」'
            : 'DLsite 社團 ID，例：https://www.dlsite.com/maniax/circle/profile/=/maker_id/RG12345'}
        </p>
      </div>

      {/* Circle Name */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          社團 / 店家名稱 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={circleName}
          onChange={(e) => setCircleName(e.target.value)}
          placeholder="例：My Circle"
          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
        <p className="mt-1 text-xs text-gray-400">用於通知標題顯示，不影響爬取行為</p>
      </div>

      {/* Webhook URL */}
      <div className="mb-6">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          專屬 Discord Webhook（選填）
        </label>
        <input
          type="url"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          placeholder="https://discord.com/api/webhooks/..."
          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p className="mt-1 text-xs text-gray-400">留空時使用全域 Webhook</p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? '新增中...' : '新增社團追蹤'}
      </button>
    </form>
  )
}
