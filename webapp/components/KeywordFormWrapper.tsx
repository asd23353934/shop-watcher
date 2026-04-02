'use client'

import type { Keyword } from '@/types/keyword'
import KeywordForm from './KeywordForm'

interface KeywordFormWrapperProps {
  onAdd: (keyword: Keyword) => void
}

export default function KeywordFormWrapper({ onAdd }: KeywordFormWrapperProps) {
  return <KeywordForm onSuccess={onAdd} />
}
