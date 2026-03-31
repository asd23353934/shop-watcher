'use client'

import { useRouter } from 'next/navigation'
import KeywordForm from './KeywordForm'

export default function KeywordFormWrapper() {
  const router = useRouter()

  return (
    <KeywordForm
      onSuccess={() => {
        router.refresh()
      }}
    />
  )
}
