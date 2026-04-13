import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const PRIVATE_URL_PATTERN =
  /^https?:\/\/(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.)/

export function isHttpUrl(url: string | null | undefined): url is string {
  if (typeof url !== 'string') return false
  if (!url.startsWith('https://')) return false
  if (PRIVATE_URL_PATTERN.test(url)) return false
  return true
}

export const CACHE_CONTROL_PRIVATE_SWR_60 = 'private, stale-while-revalidate=60'
