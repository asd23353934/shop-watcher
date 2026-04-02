import { prisma } from '@/lib/prisma'
import KeywordClientSection from '@/components/KeywordClientSection'

interface Props {
  userId: string
}

// Fetches keywords server-side, passes to client component for optimistic updates
export default async function KeywordSection({ userId }: Props) {
  const keywords = await prisma.keyword.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  // Serialize Prisma result (dates → strings) before crossing server/client boundary
  return (
    <KeywordClientSection
      initialKeywords={JSON.parse(JSON.stringify(keywords))}
    />
  )
}
