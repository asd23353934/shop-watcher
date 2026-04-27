import { renderIconResponse } from '@/app/_icon-response'

export const runtime = 'edge'

export async function GET() {
  return renderIconResponse({ size: 512, artSize: 410 })
}
