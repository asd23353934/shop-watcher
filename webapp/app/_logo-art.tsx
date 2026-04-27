/**
 * Shop Watcher logo 主視覺幾何（眼睛 + 閃光），不含背景 rect/漸層。
 * Satori 與瀏覽器皆支援 path/circle，因此可同時用於 ImageResponse 與一般 React render。
 * 必須包在 256×256 viewBox 的 <svg> 內。
 */
export function LogoArt() {
  return (
    <>
      <path d="M44 140 C 80 92, 172 92, 208 140 C 172 188, 80 188, 44 140 Z" fill="white" />
      <circle cx="126" cy="140" r="36" fill="#3730A3" />
      <circle cx="126" cy="140" r="17" fill="#0B0F19" />
      <circle cx="118" cy="132" r="7.5" fill="white" opacity="0.95" />
      <path d="M196 44 L202 70 L228 76 L202 82 L196 108 L190 82 L164 76 L190 70 Z" fill="#FCD34D" />
      <path d="M196 56 L199 70 L213 73 L199 76 L196 90 L193 76 L179 73 L193 70 Z" fill="#FEF3C7" opacity="0.9" />
    </>
  )
}

export const LOGO_GRADIENT_FROM = '#6366F1'
export const LOGO_GRADIENT_TO = '#9333EA'
export const LOGO_GRADIENT_CSS = `linear-gradient(135deg, ${LOGO_GRADIENT_FROM} 0%, ${LOGO_GRADIENT_TO} 100%)`
