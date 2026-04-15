import { isValidDiscordWebhookUrl } from '@/lib/webhook-validation'
import { NextResponse } from 'next/server'

export const MIN_KEYWORD_LENGTH = 2
export const VALID_MATCH_MODES = ['any', 'all', 'exact'] as const

/**
 * Validates discordWebhookUrl and maxNotifyPerScan fields shared by
 * the keyword create (POST) and update (PATCH) routes.
 * Returns an error response if invalid, or null if valid.
 */
export function validateKeywordFields(body: Record<string, unknown>): NextResponse | null {
  const { discordWebhookUrl, maxNotifyPerScan } = body

  if (discordWebhookUrl !== undefined && discordWebhookUrl !== null) {
    if (!isValidDiscordWebhookUrl(discordWebhookUrl)) {
      return NextResponse.json(
        { error: 'Invalid Discord Webhook URL' },
        { status: 400 }
      )
    }
  }

  if (maxNotifyPerScan !== undefined && maxNotifyPerScan !== null) {
    const n = Number(maxNotifyPerScan)
    if (!Number.isInteger(n) || n < 1 || n > 10000) {
      return NextResponse.json(
        { error: 'maxNotifyPerScan must be a positive integer between 1 and 10000' },
        { status: 400 }
      )
    }
  }

  return null
}
