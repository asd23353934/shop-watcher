import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CONTACT_EMAIL, Section } from "@/components/policy-section"

export const metadata: Metadata = {
  title: "服務條款",
  description: "Shop Watcher 服務條款 - 使用本服務前請詳閱以下條款",
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回首頁
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            服務條款
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            最後更新日期：2026 年 4 月 15 日
          </p>
        </div>

        <div className="space-y-8 text-foreground">
          <Section title="接受條款">
            <p className="text-muted-foreground">
              使用 Shop Watcher（以下簡稱「本服務」）即表示您同意遵守本服務條款。若您不同意本條款，請勿使用本服務。
            </p>
          </Section>

          <hr className="border-border" />

          <Section title="服務說明">
            <p className="text-muted-foreground">
              Shop Watcher 是一項自動監控台灣及日本電商平台新上架商品的 SaaS 服務，透過 Discord Webhook 或電子郵件即時通知使用者。本服務監控之平台包括露天、PChome、MOMO、Animate、Yahoo 拍賣、Mandarake、買動漫、金石堂、BOOTH、DLsite、Toranoana、Melonbooks 等。
            </p>
          </Section>

          <hr className="border-border" />

          <Section title="帳戶責任">
            <ul className="list-inside list-disc space-y-2 text-muted-foreground">
              <li>您須透過 Google OAuth 登入，並對帳戶內的所有活動負責</li>
              <li>請勿將帳戶分享或轉讓給他人</li>
              <li>如發現帳戶遭未授權使用，請立即通知我們</li>
            </ul>
          </Section>

          <hr className="border-border" />

          <Section title="使用限制">
            <p className="mb-4 text-muted-foreground">您同意不得將本服務用於以下用途：</p>
            <ul className="list-inside list-disc space-y-2 text-muted-foreground">
              <li>任何違法或未經授權的目的</li>
              <li>干擾、破壞或過度佔用本服務的伺服器或網路資源</li>
              <li>嘗試繞過本服務的安全機制</li>
              <li>大量抓取或自動化存取本服務的 API</li>
            </ul>
          </Section>

          <hr className="border-border" />

          <Section title="服務可用性">
            <p className="text-muted-foreground">
              我們盡力維持服務穩定運行，但不保證服務永遠不中斷。本服務可能因維護、更新或不可抗力因素而暫時停止。我們不對因服務中斷造成的任何損失承擔責任。
            </p>
          </Section>

          <hr className="border-border" />

          <Section title="第三方平台">
            <p className="text-muted-foreground">
              本服務監控之電商平台為各自獨立的第三方網站，其內容、價格及商品資訊由各平台自行維護。我們不對第三方平台的準確性、完整性或可用性作出任何保證。
            </p>
          </Section>

          <hr className="border-border" />

          <Section title="免責聲明">
            <p className="text-muted-foreground">
              本服務依「現狀」提供，不附任何明示或默示的保證。在法律允許的最大範圍內，我們不對因使用或無法使用本服務所導致的任何直接、間接、附帶或後果性損害承擔責任。
            </p>
          </Section>

          <hr className="border-border" />

          <Section title="條款變更">
            <p className="text-muted-foreground">
              我們保留隨時修改本服務條款的權利。重大變更將透過電子郵件或網站公告通知您。繼續使用本服務即表示您接受修改後的條款。
            </p>
          </Section>

          <hr className="border-border" />

          <Section title="聯絡我們">
            <p className="text-muted-foreground">
              若您對本服務條款有任何疑問，歡迎透過以下方式與我們聯繫：
            </p>
            <p className="mt-2 text-muted-foreground">
              電子郵件：
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-foreground underline underline-offset-4 hover:text-muted-foreground"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
          </Section>
        </div>

        <hr className="my-8 border-border" />

        <footer className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Shop Watcher. 保留所有權利。
        </footer>
      </div>
    </main>
  )
}
