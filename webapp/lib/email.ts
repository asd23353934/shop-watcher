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
  price_text?: string | null
  url: string
  image_url: string | null
  platform: string
  item_id: string
  seller_name?: string | null
  isPriceDrop?: boolean
  originalPrice?: number
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
  const priceText = item.price_text
    ? `NT$ ${item.price_text}`
    : item.price != null
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

/**
 * Sends a single batch email listing all new items.
 * Subject: [Shop Watcher] 關鍵字「{keyword}」發現 {N} 個新商品
 * HTML body: table with image thumbnail, name (link), platform, price, seller.
 *
 * New item triggers an Email notification via Resend
 * Batch email lists all new items with seller name
 */
export async function sendEmailBatchNotification(
  emailAddress: string | null,
  items: Item[],
  keyword: string
): Promise<void> {
  if (!emailAddress || items.length === 0) return

  const from = process.env.RESEND_FROM_EMAIL
  if (!from) {
    console.error('RESEND_FROM_EMAIL is not configured')
    return
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  const subject = `[Shop Watcher] 關鍵字「${keyword}」發現 ${items.length} 個新商品`

  const rows = items
    .map((item) => {
      const platformLabel = PLATFORM_LABELS[item.platform] ?? item.platform
      const priceText = item.price_text
        ? `NT$ ${item.price_text}`
        : item.price != null
          ? `NT$ ${item.price.toLocaleString('zh-TW')}`
          : '價格未知'
      const sellerText = item.seller_name ?? '未知'
      const thumbnail = item.image_url
        ? `<img src="${item.image_url}" alt="" style="width:60px;height:60px;object-fit:cover;border-radius:4px;" />`
        : ''

      // Price drop: show badge and original price
      const priceDropBadge = item.isPriceDrop
        ? `<span style="background:#dcfce7;color:#16a34a;font-size:11px;padding:2px 6px;border-radius:4px;font-weight:bold;">↓ 降價</span> `
        : ''
      const originalPriceCell =
        item.isPriceDrop && item.originalPrice != null
          ? `<span style="text-decoration:line-through;color:#9ca3af;margin-right:4px;">NT$ ${item.originalPrice.toLocaleString('zh-TW')}</span>`
          : ''

      return `
      <tr style="${item.isPriceDrop ? 'background:#f0fdf4;' : ''}">
        <td style="padding:8px;border:1px solid #eee;text-align:center;">${thumbnail}</td>
        <td style="padding:8px;border:1px solid #eee;">
          ${priceDropBadge}<a href="${item.url}" style="color:#4f46e5;text-decoration:none;">${item.name}</a>
        </td>
        <td style="padding:8px;border:1px solid #eee;">${platformLabel}</td>
        <td style="padding:8px;border:1px solid #eee;">${originalPriceCell}${priceText}</td>
        <td style="padding:8px;border:1px solid #eee;">${sellerText}</td>
      </tr>`
    })
    .join('')

  const html = `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8" />
  <title>${subject}</title>
</head>
<body style="font-family:sans-serif;max-width:700px;margin:0 auto;padding:20px;color:#333;">
  <h2 style="color:#4f46e5;">🛍️ Shop Watcher — 發現新商品</h2>
  <p>關鍵字「<strong>${keyword}</strong>」共發現 <strong>${items.length}</strong> 個新商品：</p>
  <table style="border-collapse:collapse;width:100%;">
    <thead>
      <tr style="background:#f3f4f6;">
        <th style="padding:8px;border:1px solid #eee;width:70px;">圖片</th>
        <th style="padding:8px;border:1px solid #eee;text-align:left;">商品名稱</th>
        <th style="padding:8px;border:1px solid #eee;">平台</th>
        <th style="padding:8px;border:1px solid #eee;">價格</th>
        <th style="padding:8px;border:1px solid #eee;">賣家</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
  <p style="margin-top:20px;font-size:12px;color:#888;">
    由 Shop Watcher 自動發送。在設定頁面清空 Email 欄位即可停用此通知。
  </p>
</body>
</html>`.trim()

  try {
    const { error } = await resend.emails.send({
      from,
      to: emailAddress,
      subject,
      html,
    })

    if (error) {
      console.error('[email] Resend batch error:', error)
    }
  } catch (err) {
    console.error('[email] Failed to send batch email:', err)
  }
}
