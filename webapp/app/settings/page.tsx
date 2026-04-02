import NotificationForm from '@/components/NotificationForm'

// Notification settings are isolated per user — only session user's settings are loaded
// Auth check is handled by settings/layout.tsx
export default function SettingsPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">通知設定</h1>
        <p className="mt-1 text-sm text-gray-500">設定 Discord Webhook 或 Email 接收新商品通知</p>
      </div>
      <NotificationForm />
    </>
  )
}
