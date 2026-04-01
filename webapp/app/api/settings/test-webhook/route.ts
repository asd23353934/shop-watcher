import { auth } from '@/auth'
import { NextResponse } from 'next/server'

/**
 * POST /api/settings/test-webhook
 * Sends a test Discord Embed to the provided Webhook URL.
 * Requires authenticated session.
 *
 * User can test Discord Webhook URL before saving
 * Invalid Webhook URL returns error to user
 */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  let webhookUrl: string
  try {
    const body = await request.json()
    webhookUrl = body?.webhookUrl ?? ''
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 })
  }

  if (!webhookUrl || typeof webhookUrl !== 'string' || !webhookUrl.startsWith('https://')) {
    return NextResponse.json({ ok: false, error: 'Invalid Webhook URL' }, { status: 400 })
  }

  const testEmbed = {
    title: 'Shop Watcher 連線測試',
    color: 0x5865f2,
    description: '✅ Webhook 設定成功！',
    footer: { text: 'Shop Watcher' },
    timestamp: new Date().toISOString(),
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [testEmbed] }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return NextResponse.json(
        { ok: false, error: `Discord 回傳錯誤 ${res.status}：${text.slice(0, 200)}` },
        { status: 200 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: `無法連線：${message}` }, { status: 200 })
  }
}
