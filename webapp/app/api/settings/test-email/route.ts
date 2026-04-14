import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { isValidEmail } from '@/lib/utils'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'

/**
 * POST /api/settings/test-email
 * Sends a test email to the user's configured address.
 * Requires authenticated session.
 */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  let emailAddress: string
  try {
    const body = await request.json()
    emailAddress = body?.emailAddress ?? ''
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 })
  }

  if (!isValidEmail(emailAddress)) {
    return NextResponse.json({ ok: false, error: '請輸入有效的 Email 地址' }, { status: 400 })
  }

  // Only allow sending to the user's own configured email address
  const settings = await prisma.notificationSetting.findUnique({
    where: { userId: session.user.id },
    select: { emailAddress: true },
  })
  if (!settings?.emailAddress || settings.emailAddress !== emailAddress.trim()) {
    return NextResponse.json({ ok: false, error: '只能寄送至已儲存的 Email 地址' }, { status: 403 })
  }

  const from = process.env.RESEND_FROM_EMAIL
  if (!from) {
    return NextResponse.json({ ok: false, error: 'RESEND_FROM_EMAIL 未設定，請聯繫管理員' }, { status: 200 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: false, error: 'RESEND_API_KEY 未設定，請聯繫管理員' }, { status: 200 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    const { error } = await resend.emails.send({
      from,
      to: emailAddress.trim(),
      subject: '[Shop Watcher] Email 通知測試',
      html: `
<!DOCTYPE html>
<html lang="zh-TW">
<head><meta charset="UTF-8" /><title>Shop Watcher 測試信</title></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">
  <h2 style="color:#4f46e5;">🛍️ Shop Watcher — Email 測試</h2>
  <p>✅ 您的 Email 通知設定正常，此為測試信。</p>
  <p style="color:#6b7280;font-size:14px;">當監控關鍵字發現新商品時，通知信件將寄送至此信箱。</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />
  <p style="font-size:12px;color:#9ca3af;">由 Shop Watcher 自動發送。在設定頁面清空 Email 欄位即可停用此通知。</p>
</body>
</html>`.trim(),
    })

    if (error) {
      console.error('[test-email] Resend error:', error)
      return NextResponse.json({ ok: false, error: '發送失敗，請確認設定是否正確' }, { status: 200 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[test-email] Failed to send:', err)
    return NextResponse.json({ ok: false, error: '發送失敗，請確認設定是否正確' }, { status: 200 })
  }
}
