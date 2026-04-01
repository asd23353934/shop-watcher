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

  let scannedAt: string
  try {
    const body = await request.json()
    scannedAt = body?.scannedAt ?? new Date().toISOString()
  } catch {
    scannedAt = new Date().toISOString()
  }

  await prisma.scanLog.upsert({
    where: { id: 'global' },
    update: { scannedAt: new Date(scannedAt) },
    create: { id: 'global', scannedAt: new Date(scannedAt) },
  })

  return NextResponse.json({ ok: true })
}
