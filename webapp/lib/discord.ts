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

  const content = discordUserId
    ? `<@${discordUserId}> 關鍵字「${keyword}」發現 ${items.length} 個新商品！`
    : `關鍵字「${keyword}」發現 ${items.length} 個新商品！`

  const toEmbed = (item: Item) => {
    const platformLabel = PLATFORM_LABELS[item.platform] ?? item.platform
    const color = PLATFORM_COLORS[item.platform] ?? 0x7289da
    const priceText =
      item.price != null
        ? `NT$ ${item.price.toLocaleString('zh-TW')}`
        : '價格未知'

    const fields: Array<{ name: string; value: string; inline: boolean }> = [
      { name: '平台', value: platformLabel, inline: true },
      { name: '價格', value: priceText, inline: true },
      { name: '關鍵字', value: keyword, inline: true },
    ]
    if (item.seller_name) {
      fields.push({ name: '賣家', value: item.seller_name, inline: true })
    }

    return {
      title: item.name.length > 256 ? item.name.slice(0, 253) + '...' : item.name,
      url: item.url,
      color,
      fields,
      ...(item.image_url ? { thumbnail: { url: item.image_url } } : {}),
      footer: { text: 'Shop Watcher' },
      timestamp: new Date().toISOString(),
    }
  }

  // Split into chunks of max 10 embeds per Webhook call
  const CHUNK_SIZE = 10
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const chunk = items.slice(i, i + CHUNK_SIZE)
    const isFirst = i === 0
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: isFirst ? content : undefined,
          embeds: chunk.map(toEmbed),
        }),
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        console.error(`[discord] Batch webhook chunk ${i / CHUNK_SIZE + 1} returned ${res.status}: ${text}`)
      }
    } catch (err) {
      console.error(`[discord] Batch webhook chunk ${i / CHUNK_SIZE + 1} failed:`, err)
    }
  }
}
