/**
 * Discord notification via Webhook.
 *
 * New item triggers a Discord Embed notification via the user's Webhook URL
 * Discord Embed is sent with item details
 * Embed color reflects the platform
 */

interface Item {
  name: string
  price: number | null
  url: string
  image_url: string | null
  platform: string
  item_id: string
  seller_name?: string | null
  isPriceDrop?: boolean
  originalPrice?: number
}

const PLATFORM_COLORS: Record<string, number> = {
  shopee: 0xee4d2d,  // Shopee orange-red
  ruten: 0x0066cc,   // Ruten blue
}

const PLATFORM_LABELS: Record<string, string> = {
  shopee: '蝦皮購物',
  ruten: '露天拍賣',
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

  const priceText =
    item.price != null
      ? `NT$ ${item.price.toLocaleString('zh-TW')}`
      : '價格未知'

  const platformLabel = PLATFORM_LABELS[item.platform] ?? item.platform
  const color = PLATFORM_COLORS[item.platform] ?? 0x7289da

  // User mention is included when discordUserId is set
  // No mention when discordUserId is null
  const content = discordUserId
    ? `<@${discordUserId}> 發現新商品！`
    : '發現新商品！'

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
 * More than 10 new items are chunked into multiple Webhook calls (max 10 embeds per call).
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

  // Cap items at MAX_NOTIFY_PER_BATCH (default 10)
  const maxBatch = parseInt(process.env.MAX_NOTIFY_PER_BATCH ?? '10', 10) || 10
  const capped = items.slice(0, maxBatch)
  const omitted = items.length - capped.length

  const totalLabel = items.length > maxBatch ? `${maxBatch}/${items.length}` : String(items.length)
  const content = discordUserId
    ? `<@${discordUserId}> 關鍵字「${keyword}」發現 ${totalLabel} 個新商品！`
    : `關鍵字「${keyword}」發現 ${totalLabel} 個新商品！`

  const toEmbed = (item: Item) => {
    const platformLabel = PLATFORM_LABELS[item.platform] ?? item.platform
    // Price drop uses green color (0x57F287), otherwise platform color
    const color = item.isPriceDrop
      ? 0x57f287
      : (PLATFORM_COLORS[item.platform] ?? 0x7289da)
    const priceText =
      item.price != null
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

  // Split capped items into chunks of max 10 embeds per Webhook call
  const CHUNK_SIZE = 10
  const chunks: Item[][] = []
  for (let i = 0; i < capped.length; i += CHUNK_SIZE) {
    chunks.push(capped.slice(i, i + CHUNK_SIZE))
  }

  for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
    const chunk = chunks[chunkIdx]
    const isFirst = chunkIdx === 0
    const isLast = chunkIdx === chunks.length - 1

    const embeds = chunk.map((item, itemIdx) => {
      const embed = toEmbed(item)
      // Add overflow notice field to the very last embed of the last chunk
      if (isLast && itemIdx === chunk.length - 1 && omitted > 0) {
        return {
          ...embed,
          fields: [
            ...(embed.fields ?? []),
            {
              name: '⚠️ 提示',
              value: `還有 ${omitted} 筆未顯示，請縮小關鍵字範圍`,
              inline: false,
            },
          ],
        }
      }
      return embed
    })

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: isFirst ? content : undefined,
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
