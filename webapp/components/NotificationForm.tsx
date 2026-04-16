'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Send, Mail, Shield, AlertTriangle, Loader2, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

interface NotificationSettings {
  discordWebhookUrl: string | null
  discordUserId: string | null
  emailEnabled: boolean
  globalSellerBlocklist: string[]
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  )
}

export default function NotificationForm({ displayEmail }: { displayEmail?: string | null }) {
  const [form, setForm] = useState<NotificationSettings>({
    discordWebhookUrl: null,
    discordUserId: null,
    emailEnabled: false,
    globalSellerBlocklist: [],
  })
  const [loading, setLoading]               = useState(true)
  const [savingDiscord, setSavingDiscord]   = useState(false)
  const [savingEmail, setSavingEmail]       = useState(false)
  const [savingBlocklist, setSavingBlocklist] = useState(false)
  const [webhookTesting, setWebhookTesting] = useState(false)
  const [webhookTestResult, setWebhookTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [emailTesting, setEmailTesting]     = useState(false)
  const [emailTestResult, setEmailTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [sellerInput, setSellerInput]       = useState('')
  const [clearingHistory, setClearingHistory] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/settings', { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => setForm({
        discordWebhookUrl:    data.discordWebhookUrl ?? '',
        discordUserId:        data.discordUserId ?? '',
        emailEnabled:         data.emailEnabled ?? false,
        globalSellerBlocklist: data.globalSellerBlocklist ?? [],
      }))
      .catch((err) => { if (err.name !== 'AbortError') toast.error('載入設定失敗') })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [])

  const patchSettings = async (patch: Partial<NotificationSettings>) => {
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? '儲存失敗')
    }
  }

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
      setWebhookTestResult(data.ok
        ? { ok: true,  message: '✓ 測試訊息已送出' }
        : { ok: false, message: `✗ ${data.error ?? '測試失敗'}` })
    } catch {
      setWebhookTestResult({ ok: false, message: '✗ 網路錯誤，請再試一次' })
    } finally {
      setWebhookTesting(false)
    }
  }

  const handleSaveDiscord = async () => {
    setSavingDiscord(true)
    try {
      await patchSettings({
        discordWebhookUrl: form.discordWebhookUrl || null,
        discordUserId:     form.discordUserId || null,
      })
      toast.success('Discord 設定已儲存')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '儲存失敗')
    } finally {
      setSavingDiscord(false)
    }
  }

  const handleTestEmail = async () => {
    setEmailTestResult(null)
    setEmailTesting(true)
    try {
      const res = await fetch('/api/settings/test-email', { method: 'POST' })
      const data = await res.json()
      setEmailTestResult(data.ok
        ? { ok: true,  message: '✓ 測試信已送出，請檢查收件匣（含垃圾郵件）' }
        : { ok: false, message: `✗ ${data.error ?? '測試失敗'}` })
    } catch {
      setEmailTestResult({ ok: false, message: '✗ 網路錯誤，請再試一次' })
    } finally {
      setEmailTesting(false)
    }
  }

  const handleToggleEmail = async (enabled: boolean) => {
    const prev = form.emailEnabled
    setForm((p) => ({ ...p, emailEnabled: enabled }))
    setEmailTestResult(null)
    setSavingEmail(true)
    try {
      await patchSettings({ emailEnabled: enabled })
      toast.success(enabled ? 'Email 通知已啟用' : 'Email 通知已停用')
    } catch (err) {
      setForm((p) => ({ ...p, emailEnabled: prev }))
      toast.error(err instanceof Error ? err.message : '儲存失敗')
    } finally {
      setSavingEmail(false)
    }
  }

  const handleSaveBlocklist = async () => {
    setSavingBlocklist(true)
    try {
      await patchSettings({ globalSellerBlocklist: form.globalSellerBlocklist })
      toast.success('屏蔽清單已儲存')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '儲存失敗')
    } finally {
      setSavingBlocklist(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-6 space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    )
  }

  const discordConfigured = !!form.discordWebhookUrl

  return (
    <div className="space-y-6">
      {/* Discord card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              <DiscordIcon className="h-5 w-5 text-purple-600" />
              Discord Webhook 通知
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className={cn('h-2 w-2 rounded-full', discordConfigured ? 'bg-green-500' : 'bg-gray-400')} />
              <span className="text-sm text-gray-500">{discordConfigured ? '已設定' : '未設定'}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Webhook URL</label>
            <input
              type="url" placeholder="https://discord.com/api/webhooks/..."
              value={form.discordWebhookUrl ?? ''}
              onChange={(e) => { setForm((p) => ({ ...p, discordWebhookUrl: e.target.value })); setWebhookTestResult(null) }}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-400 mt-1">從 Discord 頻道設定 → 整合 → Webhooks 取得</p>
          </div>

          {webhookTestResult && (
            <p className={`text-xs font-medium ${webhookTestResult.ok ? 'text-green-600' : 'text-red-600'}`}>
              {webhookTestResult.message}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleTestWebhook}
              disabled={webhookTesting || !form.discordWebhookUrl}>
              {webhookTesting ? <Loader2 className="inline h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
              測試
            </Button>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={handleSaveDiscord} disabled={savingDiscord}>
              {savingDiscord ? <><Loader2 className="inline h-4 w-4 animate-spin mr-1" />儲存中</> : '儲存'}
            </Button>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
              Discord 使用者 ID（選填）
            </label>
            <input type="text" placeholder="例：123456789012345678"
              value={form.discordUserId ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, discordUserId: e.target.value }))}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              在 Discord 開啟開發者模式後，右鍵點擊自己即可複製 User ID
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Email card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              <Mail className="h-5 w-5 text-blue-500" />
              Email 通知
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className={cn('h-2 w-2 rounded-full', form.emailEnabled ? 'bg-green-500' : 'bg-gray-400')} />
              <span className="text-sm text-gray-500">{form.emailEnabled ? '已啟用' : '未啟用'}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">發送 Email 通知</p>
              <p className="text-xs text-gray-400 mt-0.5">
                通知將寄送至：<span className="font-medium text-gray-600 dark:text-gray-300">{displayEmail ?? '—'}</span>
              </p>
            </div>
            <Switch
              checked={form.emailEnabled}
              onCheckedChange={handleToggleEmail}
              disabled={savingEmail}
            />
          </div>

          {emailTestResult && (
            <p className={`text-xs font-medium ${emailTestResult.ok ? 'text-green-600' : 'text-red-600'}`}>
              {emailTestResult.message}
            </p>
          )}

          {form.emailEnabled && (
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleTestEmail} disabled={emailTesting}>
                {emailTesting ? <Loader2 className="inline h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                測試
              </Button>
            </div>
          )}

          <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              ℹ️ Email 通知與 Discord 通知可同時啟用，兩者都會收到通知。
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Global seller blocklist card */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Shield className="h-5 w-5 text-orange-500" />
            全域屏蔽賣場
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            加入此名單的賣家或社團，所有關鍵字的通知都會過濾（不分大小寫，substring 比對）
          </p>
          {form.globalSellerBlocklist.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.globalSellerBlocklist.map((store) => (
                <span key={store} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-sm">
                  {store}
                  <button type="button"
                    onClick={() => setForm((p) => ({ ...p, globalSellerBlocklist: p.globalSellerBlocklist.filter((w) => w !== store) }))}
                    className="hover:opacity-70 rounded-full">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <input type="text" placeholder="輸入賣家名稱後按 Enter"
            value={sellerInput} onChange={(e) => setSellerInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                const word = sellerInput.trim()
                if (word && !form.globalSellerBlocklist.includes(word)) {
                  setForm((p) => ({ ...p, globalSellerBlocklist: [...p.globalSellerBlocklist, word] }))
                  setSellerInput('')
                }
              }
            }}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">目前共屏蔽 {form.globalSellerBlocklist.length} 個賣場</p>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={handleSaveBlocklist} disabled={savingBlocklist}>
              {savingBlocklist ? <><Loader2 className="inline h-4 w-4 animate-spin mr-1" />儲存中</> : '儲存屏蔽清單'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="text-red-600">
            <AlertTriangle className="h-5 w-5" />
            危險操作
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button variant="outline" className="border-red-300 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
                  清除所有通知歷史
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>確定要清除所有通知歷史？</AlertDialogTitle>
                <AlertDialogDescription>
                  此操作無法復原，所有已通知商品記錄將被永久刪除，下次掃描時同樣商品會再次觸發通知。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                  disabled={clearingHistory}
                  onClick={async () => {
                    setClearingHistory(true)
                    try {
                      const res = await fetch('/api/history', { method: 'DELETE' })
                      if (res.ok) {
                        toast.success('通知歷史已清除')
                      } else {
                        console.error('[clear-history] DELETE failed:', res.status)
                        toast.error('清除失敗，請再試一次')
                      }
                    } catch { toast.error('網路錯誤，請再試一次') }
                    finally { setClearingHistory(false) }
                  }}>
                  {clearingHistory ? <><Loader2 className="inline h-4 w-4 mr-1 animate-spin" />清除中</> : '確認清除'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
