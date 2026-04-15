import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { CONTACT_EMAIL, Section, Subsection } from "@/components/policy-section"

export const metadata: Metadata = {
  title: "隱私權政策",
  description: "Shop Watcher 隱私權政策 - 了解我們如何收集、使用與保護您的個人資料",
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            返回首頁
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            隱私權政策
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            最後更新日期：2026 年 4 月 15 日
          </p>
        </div>

        <div className="space-y-8 text-foreground">
          <Section title="概述">
            <p>
              Shop Watcher 是一項監控台灣及日本電商平台新商品上架的 SaaS
              服務，並透過 Discord Webhook 或電子郵件通知使用者。本隱私權政策說明我們如何收集、使用、儲存及保護您的個人資料。
            </p>
          </Section>

          <hr className="border-border" />

          <Section title="我們收集的資料">
            <div className="space-y-4">
              <Subsection title="帳戶資料（透過 Google OAuth 登入）">
                <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                  <li>電子郵件地址</li>
                  <li>姓名</li>
                  <li>個人頭像</li>
                </ul>
                <p className="mt-2 text-sm text-muted-foreground">
                  這些資料僅用於帳戶識別與登入驗證，我們不會將其用於其他目的。
                </p>
              </Subsection>

              <Subsection title="使用者設定資料">
                <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                  <li>搜尋關鍵字</li>
                  <li>價格篩選條件</li>
                  <li>Discord Webhook URL</li>
                  <li>Discord 使用者 ID</li>
                  <li>賣家封鎖清單</li>
                </ul>
              </Subsection>

              <Subsection title="掃描產生的資料">
                <p className="text-muted-foreground">
                  當系統掃描到符合您設定條件的商品時，我們會儲存以下資訊作為通知紀錄：
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                  <li>商品名稱</li>
                  <li>商品價格</li>
                  <li>商品連結（URL）</li>
                  <li>商品圖片</li>
                </ul>
              </Subsection>
            </div>
          </Section>

          <hr className="border-border" />

          <Section title="資料的使用方式">
            <ul className="list-inside list-disc space-y-2 text-muted-foreground">
              <li>提供商品監控與通知服務</li>
              <li>依據您的設定篩選並比對新上架商品</li>
              <li>透過電子郵件或 Discord 發送通知</li>
              <li>改善服務品質與使用者體驗</li>
            </ul>
          </Section>

          <hr className="border-border" />

          <Section title="第三方服務">
            <div className="space-y-4">
              <Subsection title="Resend（電子郵件發送服務）">
                <p className="text-muted-foreground">
                  若您啟用電子郵件通知，我們會透過 Resend
                  發送通知信件。Resend
                  會接收您的電子郵件地址及符合條件的商品資訊（商品名稱、價格、連結、圖片）。
                </p>
              </Subsection>

              <Subsection title="Discord（透過使用者提供的 Webhook）">
                <p className="text-muted-foreground">
                  若您設定 Discord Webhook，符合條件的商品資訊（商品名稱、價格、連結、圖片）及相關關鍵字將會發送至您指定的
                  Discord 頻道。此 Webhook URL 由您自行提供與管理。
                </p>
              </Subsection>
            </div>
          </Section>

          <hr className="border-border" />

          <Section title="資料保留期限">
            <ul className="list-inside list-disc space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">已查看商品紀錄：</strong>
                自動於 30 天後刪除
              </li>
              <li>
                <strong className="text-foreground">掃描日誌：</strong>
                自動於 7 天後刪除
              </li>
              <li>
                <strong className="text-foreground">帳戶資料與設定：</strong>
                保留至您刪除帳戶為止
              </li>
            </ul>
          </Section>

          <hr className="border-border" />

          <Section title="您的權利">
            <p className="mb-4 text-muted-foreground">
              您隨時可以執行以下操作：
            </p>
            <ul className="list-inside list-disc space-y-2 text-muted-foreground">
              <li>停用電子郵件通知</li>
              <li>移除已設定的 Discord Webhook</li>
              <li>刪除所有通知紀錄</li>
            </ul>
            <p className="mt-4 text-muted-foreground">
              如需行使上述權利，請至設定頁面操作，或透過下方聯絡方式與我們聯繫。
            </p>
          </Section>

          <hr className="border-border" />

          <Section title="資料安全">
            <p className="text-muted-foreground">
              我們採用業界標準的安全措施保護您的個人資料，包括資料傳輸加密（HTTPS）、存取控制及定期安全稽核。然而，網際網路上的資料傳輸無法保證絕對安全，我們會盡最大努力保護您的資料。
            </p>
          </Section>

          <hr className="border-border" />

          <Section title="政策變更">
            <p className="text-muted-foreground">
              我們可能會不定期更新本隱私權政策。若有重大變更，我們將透過電子郵件或網站公告通知您。建議您定期查閱本頁面以了解最新政策內容。
            </p>
          </Section>

          <hr className="border-border" />

          <Section title="聯絡我們">
            <p className="text-muted-foreground">
              若您對本隱私權政策有任何疑問，歡迎透過以下方式與我們聯繫：
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
