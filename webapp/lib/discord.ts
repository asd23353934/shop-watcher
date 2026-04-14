/**
 * Discord notification via Webhook.
 *
 * New item triggers a Discord Embed notification via the user's Webhook URL
 * Discord Embed is sent with item details
 * Embed color reflects the platform
 */

import { DISCORD_USER_ID_RE } from '@/lib/utils'

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

const PLATFORM_COLORS: Record<string, number> = {
  shopee: 0xee4d2d,    // Shopee orange-red
  ruten: 0x0066cc,     // Ruten blue
  pchome: 0x0059b3,    // PChome blue
  momo: 0xe60026,      // momo red
  animate: 0x3b6fd4,   // Animate blue
  'yahoo-auction': 0x720e9e, // Yahoo purple
  mandarake: 0x111111, // Mandarake dark
  myacg: 0xdd4444,     // MyACG red
  kingstone: 0x005bac, // Kingstone blue
  booth: 0xe4335a,     // BOOTH pink-red
  dlsite: 0x4f46e5,    // DLsite indigo
  toranoana: 0xd97706, // Toranoana amber
  melonbooks: 0x0d9488, // Melonbooks teal
}

const PLATFORM_LABELS: Record<string, string> = {
  shopee: '蝦皮購物',
  ruten: '露天拍賣',
  pchome: 'PChome 24h',
  momo: 'momo 購物',
  animate: 'Animate Online',
  'yahoo-auction': 'Yahoo! 拍賣',
  mandarake: 'Mandarake',
  myacg: 'MyACG',
  kingstone: '金石堂',
  booth: 'BOOTH',
  dlsite: 'DLsite',
  toranoana: '虎之穴',
  melonbooks: 'Melonbooks',
}

/**
 * Sends a Discord Embed notification for a newly found item.
 *
 * Discord notification is skipped when no Webhook URL is configured
 * Discord Webhook errors do not block the notify response
 */
export async function sendDiscordNotification(
  webhookUrl: string | null,
  discordUserId: string | null,
  item: Item,
  keyword: string
): Promise<void> {
  // Discord notification is skipped when no Webhook URL is configured
  if (!webhookUrl) return

  const priceText = item.price_text
    ? `NT$ ${item.price_text}`
    : item.price != null
      ? `NT$ ${item.price.toLocaleString('zh-TW')}`
      : '價格未知'

  const platformLabel = PLATFORM_LABELS[item.platform] ?? item.platform
  const color = PLATFORM_COLORS[item.platform] ?? 0x7289da

  const safeMention = discordUserId && DISCORD_USER_ID_RE.test(discordUserId) ? `<@${discordUserId}>` : null
  const content = safeMention ? `${safeMention} 發現新商品！` : '發現新商品！'

  const fields: Array<{ name: string; value: string; inline: boolean }> = [
    { name: '平台', value: platformLabel, inline: true },
    { name: '價格', value: priceText, inline: true },
    { name: '關鍵字', value: keyword, inline: true },
  ]
  if (item.seller_name) {
    fields.push({ name: '賣家', value: item.seller_name, inline: true })
  }

  const embed = {
    title: item.name.length > 256 ? item.name.slice(0, 253) + '...' : item.name,
    url: item.url,
    color,
    fields,
    ...(item.image_url ? { thumbnail: { url: item.image_url } } : {}),
    footer: { text: 'Shop Watcher' },
    timestamp: new Date().toISOString(),
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, embeds: [embed] }),
    })

    // Discord Webhook errors do not block the notify response — log only
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error(`[discord] Webhook returned ${res.status}: ${text}`)
    }
  } catch (err) {
    console.error('[discord] Webhook request failed:', err)
  }
}

/**
 * Sends batch Discord Embed notifications for multiple newly found items.
 * Items are chunked into multiple Webhook calls (max 10 embeds per call).
 * A 500ms delay is inserted between calls to avoid Discord rate limits.
 *
 * New item triggers a Discord Embed notification via the user's Webhook URL
 * More than 10 new items are chunked into multiple Webhook calls
 * Seller name is shown when available
 */
export async function sendDiscordBatchNotification(
  webhookUrl: string | null,
  discordUserId: string | null,
  items: Item[],
  keyword: string
): Promise<void> {
  if (!webhookUrl || items.length === 0) return

  const safeMention = discordUserId && DISCORD_USER_ID_RE.test(discordUserId) ? `<@${discordUserId}>` : null
  const content = safeMention
    ? `${safeMention} 關鍵字「${keyword}」發現 ${items.length} 個新商品！`
    : `關鍵字「${keyword}」發現 ${items.length} 個新商品！`

  const toEmbed = (item: Item) => {
    const platformLabel = PLATFORM_LABELS[item.platform] ?? item.platform
    // Price drop uses green color (0x57F287), otherwise platform color
    const color = item.isPriceDrop
      ? 0x57f287
      : (PLATFORM_COLORS[item.platform] ?? 0x7289da)
    const priceText = item.price_text
      ? `NT$ ${item.price_text}`
      : item.price != null
        ? `NT$ ${item.price.toLocaleString('zh-TW')}`
        : '價格未知'

    const fields: Array<{ name: string; value: string; inline: boolean }> = [
      { name: '平台', value: platformLabel, inline: true },
    ]

    if (item.isPriceDrop && item.originalPrice != null) {
      // Price drop: show original price and new price separately
      fields.push({
        name: '原價',
        value: `NT$ ${item.originalPrice.toLocaleString('zh-TW')}`,
        inline: true,
      })
      fields.push({ name: '現價', value: priceText, inline: true })
    } else {
      fields.push({ name: '價格', value: priceText, inline: true })
    }

    fields.push({ name: '關鍵字', value: keyword, inline: true })
    if (item.seller_name) {
      fields.push({ name: '賣家', value: item.seller_name, inline: true })
    }

    // Price drop items get [降價] prefix in title
    const titleBase = item.name.length > 250 ? item.name.slice(0, 247) + '...' : item.name
    const title = item.isPriceDrop ? `[降價] ${titleBase}` : titleBase

    return {
      title: title.length > 256 ? title.slice(0, 253) + '...' : title,
      url: item.url,
      color,
      fields,
      ...(item.image_url ? { thumbnail: { url: item.image_url } } : {}),
      footer: { text: 'Shop Watcher' },
      timestamp: new Date().toISOString(),
    }
  }

  // Split all items into chunks of max 10 embeds per Webhook call
  const CHUNK_SIZE = 10
  const chunks: Item[][] = []
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    chunks.push(items.slice(i, i + CHUNK_SIZE))
  }

  for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
    // Respect Discord rate limit: 5 requests / 2s per webhook
    if (chunkIdx > 0) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    const chunk = chunks[chunkIdx]
    const embeds = chunk.map(item => toEmbed(item))

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: chunkIdx === 0 ? content : undefined,
          embeds,
        }),
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        console.error(`[discord] Batch webhook chunk ${chunkIdx + 1} returned ${res.status}: ${text}`)
      }
    } catch (err) {
      console.error(`[discord] Batch webhook chunk ${chunkIdx + 1} failed:`, err)
    }
  }
}
