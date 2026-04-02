import { auth, signOut } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import HistoryFeedbackButton from '@/components/HistoryFeedbackButton'
import EmptyState from '@/components/EmptyState'

const PLATFORM_LABELS: Record<string, string> = {
  shopee: '蝦皮',
  ruten: '露天',
}

export default async function HistoryPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  // User can view notification history — newest first, max 50
  const items = await prisma.seenItem.findMany({
    where: { userId: session.user.id },
    orderBy: { firstSeen: 'desc' },
    take: 50,
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <nav className="flex items-center gap-6">
            <span className="text-lg font-bold text-gray-900">Shop Watcher</span>
            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
              關鍵字
            </Link>
            <Link href="/history" className="text-sm font-medium text-indigo-600">
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

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">通知記錄</h1>
          <p className="mt-1 text-sm text-gray-500">最近 50 筆已通知商品記錄</p>
        </div>

        {items.length === 0 ? (
          // Empty history shows guided empty state
          <div className="rounded-xl border bg-white shadow-sm">
            <EmptyState
              heading="尚無通知紀錄"
              subtitle="當有新商品符合你的關鍵字時，通知紀錄會顯示在這裡"
            />
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">關鍵字</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">平台</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">商品 ID</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">首次通知時間</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{item.keyword}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        {PLATFORM_LABELS[item.platform] ?? item.platform}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.itemId}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(item.firstSeen).toLocaleString('zh-TW', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <HistoryFeedbackButton keywordId={item.keywordId ?? null} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
