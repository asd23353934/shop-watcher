import { renderIconResponse } from '@/app/_icon-response'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return renderIconResponse({ size: 180 })
}
