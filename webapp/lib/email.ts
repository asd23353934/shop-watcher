import { Resend } from 'resend'

/**
 * Email notification via Resend SDK.
 *
 * Resend SDK 發送 Email；每次 notify 累積後單封彙整
 * New item triggers an Email notification via Resend
 */

interface Item {
  name: string
  price: number | null
  url: string
  image_url: string | null
  platform: string
  item_id: string
}

const PLATFORM_LABELS: Record<string, string> = {
  shopee: '蝦皮購物',
  ruten: '露天拍賣',
}

/**
 * Sends an email notification for a newly found item.
 *
 * Email is skipped when no email address is configured
 * Resend API errors do not block the notify response
 * Sender email address is configurable via environment variable
 * Missing RESEND_FROM_EMAIL causes a startup configuration error
 */
export async function sendEmailNotification(
  emailAddress: string | null,
  item: Item,
  keyword: string
): Promise<void> {
  // Email is skipped when no email address is configured
  if (!emailAddress) return

  // Sender email address is configurable via environment variable
  const from = process.env.RESEND_FROM_EMAIL
  if (!from) {
    // Missing RESEND_FROM_EMAIL causes a startup configuration error
    console.error('RESEND_FROM_EMAIL is not configured')
    return
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  const platformLabel = PLATFORM_LABELS[item.platform] ?? item.platform
  const priceText =
    item.price != null
      ? `NT$ ${item.price.toLocaleString('zh-TW')}`
      : '價格未知'

  // Email subject shows item name truncated to 60 characters
  const rawSubject = `[Shop Watcher] ${item.name}`
  const subject =
    rawSubject.length > 60 ? rawSubject.slice(0, 57) + '...' : rawSubject

  const html = `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8" />
  <title>${subject}</title>
</head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <h2 style="color: #4f46e5;">🛍️ Shop Watcher — 發現新商品</h2>
  <p>關鍵字「<strong>${keyword}</strong>」出現新商品：</p>

  ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}" style="max-width: 200px; border-radius: 8px; margin-bottom: 12px;" />` : ''}

  <table style="border-collapse: collapse; width: 100%;">
    <tr>
      <td style="padding: 8px; border: 1px solid #eee; font-weight: bold; width: 30%;">商品名稱</td>
      <td style="padding: 8px; border: 1px solid #eee;">${item.name}</td>
    </tr>
    <tr>
      <td style="padding: 8px; border: 1px solid #eee; font-weight: bold;">平台</td>
      <td style="padding: 8px; border: 1px solid #eee;">${platformLabel}</td>
    </tr>
    <tr>
      <td style="padding: 8px; border: 1px solid #eee; font-weight: bold;">價格</td>
      <td style="padding: 8px; border: 1px solid #eee;">${priceText}</td>
    </tr>
    <tr>
      <td style="padding: 8px; border: 1px solid #eee; font-weight: bold;">連結</td>
      <td style="padding: 8px; border: 1px solid #eee;">
        <a href="${item.url}" style="color: #4f46e5;">查看商品</a>
      </td>
    </tr>
  </table>

  <p style="margin-top: 20px; font-size: 12px; color: #888;">
    由 Shop Watcher 自動發送。在設定頁面清空 Email 欄位即可停用此通知。
  </p>
</body>
</html>
  `.trim()

  try {
    const { error } = await resend.emails.send({
      from,
      to: emailAddress,
      subject,
      html,
    })

    if (error) {
      // Resend API errors do not block the notify response — log only
      console.error(`[email] Resend error for item ${item.item_id}:`, error)
    }
  } catch (err) {
    console.error(`[email] Failed to send email for item ${item.item_id}:`, err)
  }
}
