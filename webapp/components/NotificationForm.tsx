'use client'

import { useState, useEffect } from 'react'

interface NotificationSettings {
  discordWebhookUrl: string | null
  discordUserId: string | null
  emailAddress: string | null
}

// Module-level cache — avoids re-fetching when revisiting the settings page
// within the same SPA session. Resets on full page reload (memory cleared).
let cachedSettings: NotificationSettings | null = null

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
  const [webhookTesting, setWebhookTesting] = useState(false)
  const [webhookTestResult, setWebhookTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  // Settings are pre-filled with existing values on load.
  // Use module-level cache on subsequent loads within the same session.
  useEffect(() => {
    if (cachedSettings !== null) {
      // Serve from cache — skip API call
      setForm(cachedSettings)
      setLoading(false)
      return
    }

    // First load — fetch from API
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        const loaded: NotificationSettings = {
          discordWebhookUrl: data.discordWebhookUrl ?? '',
          discordUserId: data.discordUserId ?? '',
          emailAddress: data.emailAddress ?? '',
        }
        setForm(loaded)
        cachedSettings = loaded
      })
      .catch(() => setError('載入設定失敗'))
      .finally(() => setLoading(false))
  }, [session?.user?.id])

  const handleTestWebhook = async () => {
    setWebhookTestResult(null)
    setWebhookTesting(true)
    try {
      const res = await fetch('/api/settings/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: form.discordWebhookUrl }),
      })
      const data = await res.json()
      if (data.ok) {
        setWebhookTestResult({ ok: true, message: '✓ 測試訊息已送出' })
      } else {
        setWebhookTestResult({ ok: false, message: `✗ ${data.error ?? '測試失敗'}` })
      }
    } catch {
      setWebhookTestResult({ ok: false, message: '✗ 網路錯誤，請再試一次' })
    } finally {
      setWebhookTesting(false)
    }
  }

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

      // 5.2: Update cache after successful save so next visit skips the API call
      cachedSettings = {
        discordWebhookUrl: form.discordWebhookUrl || null,
        discordUserId: form.discordUserId || null,
        emailAddress: form.emailAddress || null,
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
          <div className="flex gap-2">
            <input
              type="url"
              value={form.discordWebhookUrl ?? ''}
              onChange={(e) => {
                setForm((p) => ({ ...p, discordWebhookUrl: e.target.value }))
                setWebhookTestResult(null)
              }}
              placeholder="https://discord.com/api/webhooks/..."
              className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={handleTestWebhook}
              disabled={webhookTesting || !form.discordWebhookUrl}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              {webhookTesting ? '測試中...' : '測試'}
            </button>
          </div>
          {webhookTestResult && (
            <p className={`mt-1 text-xs font-medium ${webhookTestResult.ok ? 'text-green-600' : 'text-red-600'}`}>
              {webhookTestResult.message}
            </p>
          )}
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
