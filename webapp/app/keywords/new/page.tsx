'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Keyword } from '@/types/keyword'
import KeywordForm from '@/components/KeywordForm'

export default function KeywordsNewPage() {
  const router = useRouter()

  const handleSuccess = (_k: Keyword) => {
    router.push('/dashboard')
  }

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          ← 返回關鍵字列表
        </Link>
      </div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">新增關鍵字</h1>
      <KeywordForm onSuccess={handleSuccess} />
    </>
  )
}
