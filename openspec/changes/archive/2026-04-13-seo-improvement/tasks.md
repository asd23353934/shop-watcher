## 1. Landing Page SEO（docs/index.html）

- [x] 1.1 在 `<head>` 中加入 Open Graph meta tags：`og:type`、`og:title`、`og:description`、`og:url`、`og:locale`、`og:site_name`；依設計決策「Landing Page 使用 `og:image` 指向現有 favicon」，docs/ 目錄無自訂 og 圖片，因此省略 og:image（Landing page includes Open Graph meta tags）
- [x] 1.2 在 `<head>` 中加入 Twitter Card meta tags：`twitter:card`、`twitter:title`、`twitter:description`（Landing page includes Twitter Card meta tags）
- [x] 1.3 在 `<head>` 中加入 `<link rel="canonical">` 指向 GitHub Pages URL（Landing page includes canonical URL）
- [x] 1.4 在 `<head>` 中加入 `<script type="application/ld+json">` 包含 `@graph`，含 SoftwareApplication + Organization 雙 schema（JSON-LD 使用 SoftwareApplication + Organization 雙 schema；Landing page includes JSON-LD structured data）

## 2. Webapp Root Layout Metadata（webapp/app/layout.tsx）

- [x] 2.1 更新 `metadata` export：設定 `title.default`、`title.template`、`description`、`metadataBase`、`openGraph`（og:type、og:locale、og:siteName）、`twitter.card`，使用 Next.js 原生 Metadata API 而非 next-seo（Webapp root layout exports correct product metadata）

## 3. Webapp robots.ts（webapp/app/robots.ts）

- [x] 3.1 建立 `webapp/app/robots.ts`，export `robots()` 函式，Allow `/` 和 `/login`，Disallow `/dashboard`、`/settings`、`/keywords`、`/history`、`/circles`、`/status`、`/api/`，並宣告 sitemap URL（robots.ts 封鎖所有需要登入的路由；Webapp serves robots.txt via app/robots.ts）

## 4. Webapp sitemap.ts（webapp/app/sitemap.ts）

- [x] 4.1 建立 `webapp/app/sitemap.ts`，export `sitemap()` 函式，只列出 `/login` 一筆公開路由（sitemap.ts 只列公開路由；Webapp serves sitemap via app/sitemap.ts）
