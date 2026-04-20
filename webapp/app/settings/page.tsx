import Link from 'next/link'
import { auth } from '@/auth'
import NotificationForm from '@/components/NotificationForm'
import { TagManager } from '@/components/TagManager'
import { TagRuleManager } from '@/components/TagRuleManager'

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

      <div className="mt-8 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">標籤管理</h2>
        <TagManager />
      </div>

      <div className="mt-8 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">標籤規則</h2>
        <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
          規則會比對新商品的名稱（regex，忽略大小寫），命中則自動套用對應標籤
        </p>
        <TagRuleManager />
      </div>

      <p className="mt-8 text-center text-xs text-gray-400 dark:text-gray-600">
        <Link href="/privacy" className="hover:underline">隱私政策</Link>
        {' · '}
        <Link href="/terms" className="hover:underline">服務條款</Link>
      </p>
    </>
  )
}
