import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isHttpUrl(url: string | null | undefined): url is string {
  return typeof url === 'string' && (url.startsWith('https://') || url.startsWith('http://'))
}

export const CACHE_CONTROL_PRIVATE_SWR_60 = 'private, stale-while-revalidate=60'
