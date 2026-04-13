const PRIVATE_IP_PATTERN =
  /^(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.)/

const PRIVATE_IPV6_PATTERN = /^(::1$|fc00:|fe80:)/i

/**
 * Validates that a Discord webhook URL is safe to make an outbound request to.
 * Prevents SSRF by enforcing:
 * - Protocol must be https:
 * - Hostname must be exactly discord.com
 * - Pathname must start with /api/webhooks/
 * - Hostname must not resolve to a private IP range
 */
export function isValidDiscordWebhookUrl(url: unknown): url is string {
  if (typeof url !== 'string' || url.trim() === '') return false

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }

  if (parsed.protocol !== 'https:') return false
  if (parsed.hostname !== 'discord.com') return false
  if (!parsed.pathname.startsWith('/api/webhooks/')) return false
  if (PRIVATE_IP_PATTERN.test(parsed.hostname)) return false
  if (PRIVATE_IPV6_PATTERN.test(parsed.hostname)) return false

  return true
}
