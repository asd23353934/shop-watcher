'use client'

import { useState, useEffect } from 'react'

interface NotificationSettings {
  discordWebhookUrl: string | null
  discordUserId: string | null
  emailAddress: string | null
}

export default function NotificationForm() {
  const [form, setForm] = useState<NotificationSettings>({
    discordWebhookUrl: null,
    discordUserId: null,
    emailAddress: null,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Settings are pre-filled with existing values on load
  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        setForm({
          discordWebhookUrl: data.discordWebhookUrl ?? '',
          discordUserId: data.discordUserId ?? '',
          emailAddress: data.emailAddress ?? '',
        })
      })
      .catch(() => setError('載入設定失敗'))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSaving(true)

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discordWebhookUrl: form.discordWebhookUrl || null,
          discordUserId: form.discordUserId || null,
          // User clears email address to disable email notifications
          emailAddress: form.emailAddress || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? '儲存失敗')
        return
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('網路錯誤，請再試一次')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center text-sm text-gray-500 py-8">載入中...</div>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-600">設定已儲存</div>
      )}

      {/* Discord section */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-800">
          <span className="text-indigo-600">🎮</span> Discord 通知
        </h2>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Webhook URL
          </label>
          <input
            type="url"
            value={form.discordWebhookUrl ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, discordWebhookUrl: e.target.value }))}
            placeholder="https://discord.com/api/webhooks/..."
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="mt-1 text-xs text-gray-400">
            從 Discord 頻道設定 → 整合 → Webhooks 取得
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Discord User ID <span className="text-gray-400">（選填，用於 @ 提及）</span>
          </label>
          <input
            type="text"
            value={form.discordUserId ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, discordUserId: e.target.value }))}
            placeholder="例：123456789012345678"
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="mt-1 text-xs text-gray-400">
            在 Discord 開啟開發者模式後，右鍵點擊自己即可複製 User ID
          </p>
        </div>
      </div>

      {/* Email section */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-800">
          <span className="text-indigo-600">📧</span> Email 通知
        </h2>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Email 地址 <span className="text-gray-400">（選填）</span>
          </label>
          <input
            type="email"
            value={form.emailAddress ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, emailAddress: e.target.value }))}
            placeholder="your@email.com"
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="mt-1 text-xs text-gray-400">清空此欄位即可停用 Email 通知</p>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {saving ? '儲存中...' : '儲存設定'}
      </button>
    </form>
  )
}
