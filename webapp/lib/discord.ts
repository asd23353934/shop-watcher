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

  const embed = {
    title: item.name.length > 256 ? item.name.slice(0, 253) + '...' : item.name,
    url: item.url,
    color,
    fields: [
      { name: '平台', value: platformLabel, inline: true },
      { name: '價格', value: priceText, inline: true },
      { name: '關鍵字', value: keyword, inline: true },
    ],
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
