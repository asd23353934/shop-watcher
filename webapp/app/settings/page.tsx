import { auth } from '@/auth'
import NotificationForm from '@/components/NotificationForm'

export default async function SettingsPage() {
  const session = await auth()
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">通知設定</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          設定 Discord Webhook 或 Email 接收新商品通知
        </p>
      </div>
      <NotificationForm displayEmail={session?.user?.email} />
    </>
  )
}
