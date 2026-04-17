import { verifyWorkerToken } from '@/lib/worker-auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

interface CanaryReportItem {
  platform: string
  itemCount: number
  domIntact: boolean
  ranAt: string
}

interface CanaryReportPayload {
  records: CanaryReportItem[]
}

type HealthState = 'healthy' | 'unhealthy'
type UnhealthyReason = 'dom_broken' | 'empty_canary' | null

const EMPTY_THRESHOLD = 2

function computeHealth(
  consecutiveEmptyCount: number,
  domIntact: boolean,
): { healthState: HealthState; unhealthyReason: UnhealthyReason } {
  if (!domIntact) return { healthState: 'unhealthy', unhealthyReason: 'dom_broken' }
  if (consecutiveEmptyCount >= EMPTY_THRESHOLD) return { healthState: 'unhealthy', unhealthyReason: 'empty_canary' }
  return { healthState: 'healthy', unhealthyReason: null }
}

function validateRecord(raw: unknown, index: number): CanaryReportItem | { error: string } {
  if (!raw || typeof raw !== 'object') return { error: `records[${index}] must be an object` }
  const r = raw as Record<string, unknown>
  if (typeof r.platform !== 'string' || !r.platform) return { error: `records[${index}].platform is required` }
  if (typeof r.itemCount !== 'number' || !Number.isFinite(r.itemCount) || r.itemCount < 0) {
    return { error: `records[${index}].itemCount must be a non-negative number` }
  }
  if (typeof r.domIntact !== 'boolean') return { error: `records[${index}].domIntact must be a boolean` }
  if (typeof r.ranAt !== 'string' || !r.ranAt) return { error: `records[${index}].ranAt is required` }
  return { platform: r.platform, itemCount: r.itemCount, domIntact: r.domIntact, ranAt: r.ranAt }
}

export async function PATCH(request: Request) {
  const authError = verifyWorkerToken(request)
  if (authError) return authError

  let body: CanaryReportPayload
  try {
    body = (await request.json()) as CanaryReportPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body || !Array.isArray(body.records)) {
    return NextResponse.json({ error: 'records array is required' }, { status: 400 })
  }

  const validated: CanaryReportItem[] = []
  for (let i = 0; i < body.records.length; i++) {
    const result = validateRecord(body.records[i], i)
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    validated.push(result)
  }

  try {
    const updated = await Promise.all(
      validated.map(async (record) => {
        const existing = await prisma.platformCanaryStatus.findUnique({
          where: { platform: record.platform },
          select: { consecutiveEmptyCount: true },
        })
        const prevCount = existing?.consecutiveEmptyCount ?? 0
        const nextConsecutiveEmpty = record.itemCount === 0 ? prevCount + 1 : 0
        const { healthState, unhealthyReason } = computeHealth(nextConsecutiveEmpty, record.domIntact)

        const ranAt = new Date(record.ranAt)
        const lastRunAt = Number.isNaN(ranAt.getTime()) ? new Date() : ranAt

        return prisma.platformCanaryStatus.upsert({
          where: { platform: record.platform },
          create: {
            platform: record.platform,
            lastRunAt,
            itemCount: record.itemCount,
            domIntact: record.domIntact,
            consecutiveEmptyCount: nextConsecutiveEmpty,
            healthState,
            unhealthyReason,
          },
          update: {
            lastRunAt,
            itemCount: record.itemCount,
            domIntact: record.domIntact,
            consecutiveEmptyCount: nextConsecutiveEmpty,
            healthState,
            unhealthyReason,
          },
        })
      }),
    )

    return NextResponse.json({
      ok: true,
      updated: updated.map((u) => ({
        platform: u.platform,
        healthState: u.healthState,
        unhealthyReason: u.unhealthyReason,
      })),
    })
  } catch (err: unknown) {
    console.error('canary-status PATCH error:', err)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}
