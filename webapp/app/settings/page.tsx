import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import NotificationForm from '@/components/NotificationForm'
import Link from 'next/link'
import { signOut } from '@/auth'

// Notification settings are isolated per user — only session user's settings are loaded
export default async function SettingsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <nav className="flex items-center gap-6">
            <span className="text-lg font-bold text-gray-900">Shop Watcher</span>
            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
              關鍵字
            </Link>
            <Link href="/settings" className="text-sm font-medium text-indigo-600">
              通知設定
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {session.user.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt={session.user.name ?? ''}
                className="h-8 w-8 rounded-full"
              />
            )}
            <span className="text-sm text-gray-700">{session.user.name}</span>
            <form
              action={async () => {
                'use server'
                await signOut({ redirectTo: '/login' })
              }}
            >
              <button
                type="submit"
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
              >
                登出
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">通知設定</h1>
          <p className="mt-1 text-sm text-gray-500">設定 Discord Webhook 或 Email 接收新商品通知</p>
        </div>

        {/* User can save Discord notification settings, User can save Email notification settings */}
        <NotificationForm />
      </main>
    </div>
  )
}
