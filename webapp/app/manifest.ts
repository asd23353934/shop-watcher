import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Shop Watcher',
    short_name: 'Shop Watcher',
    description: '多販售平台新品即時監控，Discord/Email 通知',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0B0F19',
    theme_color: '#6366F1',
    lang: 'zh-TW',
    categories: ['shopping', 'utilities', 'productivity'],
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/icon-192', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
