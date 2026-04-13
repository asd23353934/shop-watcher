## Context

Shop Watcher 由兩個獨立部署的前端組成：
- `docs/index.html`：靜態 Landing Page，部署於 GitHub Pages，是唯一可被搜尋引擎公開索引的入口
- `webapp/`：Next.js 15 App Router SaaS，部署於 Vercel，絕大多數路由需要 Google OAuth 登入

目前的問題：
- `docs/index.html` 只有基礎 `<title>` 和 `<meta name="description">`，分享到 Discord/LINE/Twitter 時無法顯示預覽卡片
- `webapp/app/layout.tsx` 的 metadata 仍是 `"Create Next App"` 預設文字
- 沒有 robots.txt，搜尋引擎爬蟲無法辨識哪些路由應被索引
- 沒有 sitemap，搜尋引擎無法主動發現公開頁面

## Goals / Non-Goals

**Goals:**

- Landing Page 分享連結在 Discord、LINE、Twitter 顯示美觀的預覽卡片
- Google 可正確理解 Shop Watcher 是一個 SoftwareApplication
- 搜尋引擎不會爬取需要登入的路由
- Webapp 的 `<title>` 與 `<meta description>` 顯示正確的產品資訊

**Non-Goals:**

- 不製作自訂 og:image 圖片（使用 `og:image` 指向現有 icon 即可，或省略）
- 不為 `/dashboard`、`/settings` 等內部頁面個別設定 metadata
- 不安裝任何第三方 SEO 套件
- 不新增多語言支援

## Decisions

### 使用 Next.js 原生 Metadata API 而非 next-seo

Next.js 15 的 Metadata API（`export const metadata`）已完整支援 Open Graph、Twitter Card、robots 及 sitemap。引入 `next-seo` 套件會增加依賴但沒有額外收益。

**替代方案**：安裝 `next-seo` 套件 → 不採用，因為 Next.js 原生 API 已足夠。

### robots.ts 封鎖所有需要登入的路由

受保護路由（`/dashboard`、`/settings`、`/keywords`、`/history`、`/circles`、`/status`）不應出現在搜尋結果中，且爬取這些路由只會得到 redirect 到 `/login`，浪費 crawl budget。

規則：
- `Allow: /login`
- `Allow: /` （僅作 redirect，但允許）
- `Disallow: /dashboard`、`/settings`、`/keywords`、`/history`、`/circles`、`/status`
- `Disallow: /api/`

### sitemap.ts 只列公開路由

只有 `/login` 是真正公開且有意義的頁面（根路由 `/` 立即 redirect）。sitemap 列出 `https://shop-watcher.vercel.app/login`。

### Landing Page 使用 `og:image` 指向現有 favicon

`docs/` 目錄若無自訂 og 圖片，使用 `/favicon.ico` 或 Vercel 部署的 `/_next/static/...` 路徑意義不大。Landing Page 的 `og:image` 指向 GitHub Pages 同域下的 icon（若無則省略，不設 og:image），避免破圖。

**替代方案**：使用 Vercel 的 `webapp` 路徑 → 不採用，因為 Landing Page 是獨立靜態站。

### JSON-LD 使用 SoftwareApplication + Organization 雙 schema

SoftwareApplication 讓 Google 知道這是一個可訂閱/使用的應用程式；Organization 提供品牌資訊，兩者可以 `@graph` 組合在同一個 `<script>` 標籤中。

## Risks / Trade-offs

- [Risk] `og:image` 若省略，分享預覽無圖片 → 可接受，純文字卡片仍比無 OG 標籤好
- [Risk] `metadataBase` 設定若與 Vercel 部署網址不符，OG URL 會錯誤 → 使用環境變數 `NEXT_PUBLIC_SITE_URL` 或 hardcode `https://shop-watcher.vercel.app`
- [Risk] Landing Page 修改為純靜態 HTML，若未來遷移到 SSG 需重寫 → 可接受，當前範圍內不考慮
