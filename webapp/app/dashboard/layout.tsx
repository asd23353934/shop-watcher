import { auth, signOut } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
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
            <Link href="/history" className="text-sm text-gray-600 hover:text-gray-900">
              通知記錄
            </Link>
            <Link href="/settings" className="text-sm text-gray-600 hover:text-gray-900">
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

            {/* Authenticated user can sign out */}
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

      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  )
}
