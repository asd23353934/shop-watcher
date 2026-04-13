## Why

Shop Watcher 的 Landing Page 與 Webapp 缺乏基本 SEO 設定，Root Layout 仍使用 Next.js 預設樣板文字，且完全沒有 Open Graph、JSON-LD、robots.txt、sitemap 等結構，導致社群分享無法顯示預覽卡片，搜尋引擎也無法正確爬取索引。

## What Changes

- **Landing Page (`docs/index.html`)**：加入 Open Graph 標籤（og:title、og:description、og:image、og:url、og:type）、Twitter Card 標籤、canonical URL，以及 JSON-LD 結構化資料（SoftwareApplication + Organization schema）
- **Webapp Root Layout (`webapp/app/layout.tsx`)**：將預設樣板 metadata 更新為正確的產品標題、描述、OG 標籤，並設定 `metadataBase`
- **`webapp/app/robots.ts`**：建立 Next.js robots 設定，明確允許爬取 `/login`、`/` 並封鎖 `/dashboard`、`/settings`、`/keywords`、`/history`、`/circles`、`/status` 等需要登入的路由
- **`webapp/app/sitemap.ts`**：建立 Next.js sitemap，僅列出公開可存取的路由（`/login`）

## Non-Goals

- 不製作 og:image 預覽圖（需要設計資源，超出本次範圍）
- 不新增多語言 hreflang 支援
- 不為受認證保護的 `/dashboard`、`/settings` 等頁面加入個別 metadata
- 不安裝第三方 SEO 套件（使用 Next.js 原生 Metadata API 即可）

## Capabilities

### New Capabilities

- `landing-page-seo`: Landing Page 的 Open Graph、Twitter Card、canonical URL 及 JSON-LD 結構化資料
- `webapp-seo-metadata`: Webapp Root Layout 的 metadata、OG 標籤、robots.ts、sitemap.ts

### Modified Capabilities

（無）

## Impact

- 影響的檔案：
  - `docs/index.html`
  - `webapp/app/layout.tsx`
  - `webapp/app/robots.ts`（新增）
  - `webapp/app/sitemap.ts`（新增）
- 無 API 變更、無資料庫變更、無依賴套件新增
