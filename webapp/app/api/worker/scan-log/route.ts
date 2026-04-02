import { verifyWorkerToken } from '@/lib/worker-auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

/**
 * POST /api/worker/scan-log
 * Records scan completion time. Upserts a single global ScanLog row.
 * Protected by WORKER_SECRET Bearer token.
 *
 * Worker records scan completion time to API
 */
export async function POST(request: Request) {
  const authError = verifyWorkerToken(request)
  if (authError) return authError

  let scannedAt: Date
  try {
    const body = await request.json()
    const raw = body?.scannedAt
    const parsed = raw ? new Date(raw) : new Date()
    scannedAt = isNaN(parsed.getTime()) ? new Date() : parsed
  } catch {
    scannedAt = new Date()
  }

  await prisma.scanLog.upsert({
    where: { id: 'global' },
    update: { scannedAt },
    create: { id: 'global', scannedAt },
  })

  return NextResponse.json({ ok: true })
}
