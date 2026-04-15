import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const PRIVATE_URL_PATTERN =
  /^https:\/\/(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.)/

const PRIVATE_IPV6_PATTERN = /^https:\/\/\[(::1|fc00:|fe80:)/i

export function isHttpUrl(url: string | null | undefined): url is string {
  if (typeof url !== 'string') return false
  if (!url.startsWith('https://')) return false
  if (PRIVATE_URL_PATTERN.test(url)) return false
  if (PRIVATE_IPV6_PATTERN.test(url)) return false
  return true
}

export const CACHE_CONTROL_PRIVATE_SWR_60 = 'private, stale-while-revalidate=60'

// Discord snowflake ID: 17–20 digit numeric string
export const DISCORD_USER_ID_RE = /^\d{17,20}$/

export function isValidEmail(email: unknown): email is string {
  if (typeof email !== 'string') return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

/** Converts an unknown value to a deduplicated, trimmed string array. Non-arrays and non-string elements are ignored. */
export function toStringSet(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  return [...new Set(
    (input as unknown[])
      .filter((w): w is string => typeof w === 'string')
      .map((w) => w.trim())
      .filter((w) => w.length > 0)
  )]
}
