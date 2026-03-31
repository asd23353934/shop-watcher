import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import KeywordList from '@/components/KeywordList'
import KeywordFormWrapper from '@/components/KeywordFormWrapper'

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  // Authenticated user can create a keyword, Authenticated user can edit an existing keyword,
  // Authenticated user can delete a keyword
  const keywords = await prisma.keyword.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">關鍵字監控</h1>
        <p className="mt-1 text-sm text-gray-500">
          管理您的商品監控關鍵字，發現新商品時即時通知
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <KeywordList initialKeywords={JSON.parse(JSON.stringify(keywords))} />
        </div>
        <div>
          <KeywordFormWrapper />
        </div>
      </div>
    </div>
  )
}
