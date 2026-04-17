import { prisma } from '@/lib/prisma'
import KeywordClientSection from '@/components/KeywordClientSection'

interface Props {
  userId: string
}

// Fetches keywords server-side, passes to client component for optimistic updates
export default async function KeywordSection({ userId }: Props) {
  const [keywords, canaries] = await Promise.all([
    prisma.keyword.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.platformCanaryStatus.findMany({
      where: { healthState: 'unhealthy' },
      select: { platform: true, unhealthyReason: true, lastRunAt: true },
    }),
  ])

  const platformHealth = Object.fromEntries(
    canaries.map((c) => [
      c.platform,
      {
        unhealthyReason: c.unhealthyReason,
        lastRunAt: c.lastRunAt ? c.lastRunAt.toISOString() : null,
      },
    ]),
  )

  // Serialize Prisma result (dates → strings) before crossing server/client boundary
  return (
    <KeywordClientSection
      initialKeywords={JSON.parse(JSON.stringify(keywords))}
      platformHealth={platformHealth}
    />
  )
}
