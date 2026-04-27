import { ImageResponse } from 'next/og'
import { LogoArt, LOGO_GRADIENT_CSS } from '@/app/_logo-art'

const ICON_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=31536000, immutable',
}

interface RenderOptions {
  size: number
  /**
   * 內層 SVG 尺寸；maskable 版本需小於 size 以將主視覺壓在中央 80% 安全區，
   * 避免被 Android launcher 切割成圓形/squircle 時內容被裁掉。
   */
  artSize?: number
}

export function renderIconResponse({ size, artSize = size }: RenderOptions) {
  if (!Number.isInteger(size) || size <= 0) {
    throw new Error(`renderIconResponse: size must be a positive integer, got ${size}`)
  }
  if (!Number.isInteger(artSize) || artSize <= 0 || artSize > size) {
    throw new Error(`renderIconResponse: artSize must be a positive integer ≤ size, got ${artSize}`)
  }
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: LOGO_GRADIENT_CSS,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width={artSize} height={artSize} viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
          <LogoArt />
        </svg>
      </div>
    ),
    { width: size, height: size, headers: ICON_CACHE_HEADERS }
  )
}
