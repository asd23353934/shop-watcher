'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Logo } from '@/components/Logo'

const STORAGE_KEY = 'sw-ios-install-dismissed'

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean
}

/**
 * iOS Safari 加入主畫面引導提示。
 * iOS 不支援 beforeinstallprompt，需手動透過分享 → 加入主畫面流程；其他瀏覽器/已安裝者直接隱藏。
 */
export function IOSInstallHint() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Safari 私密模式下 localStorage 操作會 throw；遇錯時不影響其他偵測流程，但也不再顯示提示以避免無限重出
    let dismissed = false
    try {
      dismissed = localStorage.getItem(STORAGE_KEY) !== null
    } catch (err) {
      console.warn('[IOSInstallHint] localStorage unavailable, hint suppressed', err)
      return
    }
    if (dismissed) return

    const ua = navigator.userAgent
    const isIOS = /iPad|iPhone|iPod/.test(ua)
    // 只在「正版 iOS Safari」顯示；in-app browser（Line / FB / IG / GSA / Twitter / Threads）UA 都帶 "Safari" 但無法觸發加入主畫面
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|Line|FBAN|FBAV|Instagram|GSA|Twitter|Threads/.test(ua)
    const nav = navigator as NavigatorWithStandalone
    const isStandalone =
      nav.standalone === true || window.matchMedia('(display-mode: standalone)').matches

    if (isIOS && isSafari && !isStandalone) {
      setShow(true)
    }
  }, [])

  if (!show) return null

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch (err) {
      // 私密模式仍允許關閉，只是下次造訪會再次出現
      console.warn('[IOSInstallHint] localStorage write failed, dismissal not persisted', err)
    }
    setShow(false)
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:max-w-sm z-50 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl shadow-2xl shadow-indigo-500/30 p-4 pr-10 animate-in slide-in-from-bottom-4 duration-500">
      <button
        type="button"
        onClick={dismiss}
        aria-label="關閉提示"
        className="absolute top-2 right-2 p-1 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3">
        <Logo size={36} className="rounded-lg flex-shrink-0" />
        <div className="text-sm leading-relaxed">
          <div className="font-semibold mb-0.5">加入主畫面，當 App 用</div>
          <div className="text-white/85 text-xs">
            點 Safari 下方<span className="mx-1 px-1.5 py-0.5 bg-white/15 rounded font-mono">⎋ 分享</span>
            →「<span className="mx-0.5 px-1.5 py-0.5 bg-white/15 rounded">加入主畫面</span>」
          </div>
        </div>
      </div>
    </div>
  )
}
