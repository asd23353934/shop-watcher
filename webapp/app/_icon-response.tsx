import { ImageResponse } from 'next/og'

/**
 * 完整 logo SVG（含背景漸層 rounded square）。
 * Satori 對 inline <svg> 子元素的渲染不可靠（會只輸出背景），
 * 改以 SVG 字串 + data URI 包進 <img> 才能正確光柵化成 PNG。
 *
 * 內容必須與 webapp/app/icon.svg、webapp/app/_logo-art.tsx、webapp/components/Logo.tsx 同步。
 */
const FULL_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6366F1"/><stop offset="100%" stop-color="#9333EA"/></linearGradient></defs><rect width="256" height="256" rx="56" fill="url(#bg)"/><path d="M44 140 C 80 92, 172 92, 208 140 C 172 188, 80 188, 44 140 Z" fill="white"/><circle cx="126" cy="140" r="36" fill="#3730A3"/><circle cx="126" cy="140" r="17" fill="#0B0F19"/><circle cx="118" cy="132" r="7.5" fill="white" opacity="0.95"/><path d="M196 44 L202 70 L228 76 L202 82 L196 108 L190 82 L164 76 L190 70 Z" fill="#FCD34D"/><path d="M196 56 L199 70 L213 73 L199 76 L196 90 L193 76 L179 73 L193 70 Z" fill="#FEF3C7" opacity="0.9"/></svg>`

/**
 * 主視覺 only（無背景 rect / rounded corner），給 maskable 版本用。
 * Maskable 由外層 div 提供 full-bleed 漸層背景，主視覺僅佔中央 80% 安全區。
 */
const EYE_SPARKLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none"><path d="M44 140 C 80 92, 172 92, 208 140 C 172 188, 80 188, 44 140 Z" fill="white"/><circle cx="126" cy="140" r="36" fill="#3730A3"/><circle cx="126" cy="140" r="17" fill="#0B0F19"/><circle cx="118" cy="132" r="7.5" fill="white" opacity="0.95"/><path d="M196 44 L202 70 L228 76 L202 82 L196 108 L190 82 L164 76 L190 70 Z" fill="#FCD34D"/><path d="M196 56 L199 70 L213 73 L199 76 L196 90 L193 76 L179 73 L193 70 Z" fill="#FEF3C7" opacity="0.9"/></svg>`

const FULL_LOGO_DATA_URI = `data:image/svg+xml;utf8,${encodeURIComponent(FULL_LOGO_SVG)}`
const EYE_SPARKLE_DATA_URI = `data:image/svg+xml;utf8,${encodeURIComponent(EYE_SPARKLE_SVG)}`

// 固定 URL 不能用 immutable（會卡住一年無法傳播 logo 改版）；改 1 天 TTL，瀏覽器與 CDN 都會在合理時間內取回新版本
const ICON_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=86400, must-revalidate',
}

interface RenderOptions {
  size: number
  /**
   * Maskable: 主視覺壓在中央 80% 安全區，背景填滿整個 canvas，
   * 避免被 Android launcher 切割成圓形/squircle 時內容被裁掉。
   */
  maskable?: boolean
}

export function renderIconResponse({ size, maskable = false }: RenderOptions) {
  if (!Number.isInteger(size) || size <= 0) {
    throw new Error(`renderIconResponse: size must be a positive integer, got ${size}`)
  }

  if (maskable) {
    const artSize = Math.round(size * 0.8)
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #6366F1 0%, #9333EA 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={EYE_SPARKLE_DATA_URI} width={artSize} height={artSize} alt="" />
        </div>
      ),
      { width: size, height: size, headers: ICON_CACHE_HEADERS }
    )
  }

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={FULL_LOGO_DATA_URI} width={size} height={size} alt="" />
      </div>
    ),
    { width: size, height: size, headers: ICON_CACHE_HEADERS }
  )
}
