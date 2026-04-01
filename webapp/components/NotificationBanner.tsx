import Link from 'next/link'

/**
 * 顯示於 Dashboard — 當用戶尚未設定任何通知方式（Discord Webhook 或 Email）時顯示。
 * 已設定任一通知方式的用戶不會看到此 Banner。
 * Banner 僅為引導，不阻擋關鍵字新增操作。
 */
export default function NotificationBanner() {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
      <span className="mt-0.5 text-base">⚠️</span>
      <div>
        <p className="font-medium">尚未設定通知方式</p>
        <p className="mt-0.5 text-yellow-700">
          目前未設定 Discord Webhook 或 Email，關鍵字命中時將無法收到通知。
          <Link
            href="/settings"
            className="ml-1 font-medium underline underline-offset-2 hover:text-yellow-900"
          >
            前往設定 →
          </Link>
        </p>
      </div>
    </div>
  )
}
