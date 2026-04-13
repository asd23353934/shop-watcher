## ADDED Requirements

### Requirement: Webapp root layout exports correct product metadata

`webapp/app/layout.tsx` SHALL export a `metadata` object with:
- `title.default` set to `"Shop Watcher"`
- `title.template` set to `"%s | Shop Watcher"`
- `description` describing the multi-platform monitoring service (繁體中文，max 160 characters)
- `metadataBase` set to the production URL (`https://shop-watcher.vercel.app`)
- `openGraph.type` set to `"website"`
- `openGraph.locale` set to `"zh_TW"`
- `openGraph.siteName` set to `"Shop Watcher"`
- `twitter.card` set to `"summary"`

#### Scenario: Browser tab shows correct title on login page

- **WHEN** a user navigates to `/login`
- **THEN** the browser tab title SHALL display `"Shop Watcher"` (not `"Create Next App"`)

#### Scenario: Open Graph tags present in HTML head

- **WHEN** a crawler fetches the webapp root URL
- **THEN** the HTML `<head>` SHALL contain `<meta property="og:site_name" content="Shop Watcher">`


<!-- @trace
source: seo-improvement
updated: 2026-04-13
code:
  - webapp/app/sitemap.ts
  - webapp/app/layout.tsx
  - webapp/app/robots.ts
  - docs/index.html
-->

### Requirement: Webapp serves robots.txt via app/robots.ts

`webapp/app/robots.ts` SHALL export a `robots()` function returning rules that:
- Allow crawling of `/` and `/login`
- Disallow crawling of `/dashboard`, `/settings`, `/keywords`, `/history`, `/circles`, `/status`, `/api/`
- Set `sitemap` pointing to `https://shop-watcher.vercel.app/sitemap.xml`

#### Scenario: Search engine respects disallow rules

- **WHEN** a crawler fetches `https://shop-watcher.vercel.app/robots.txt`
- **THEN** the response SHALL contain `Disallow: /dashboard` and `Disallow: /api/`

#### Scenario: Sitemap URL declared in robots.txt

- **WHEN** a crawler fetches `/robots.txt`
- **THEN** the response SHALL contain `Sitemap: https://shop-watcher.vercel.app/sitemap.xml`


<!-- @trace
source: seo-improvement
updated: 2026-04-13
code:
  - webapp/app/sitemap.ts
  - webapp/app/layout.tsx
  - webapp/app/robots.ts
  - docs/index.html
-->

### Requirement: Webapp serves sitemap via app/sitemap.ts

`webapp/app/sitemap.ts` SHALL export a `sitemap()` function returning an array containing:
- `{ url: "https://shop-watcher.vercel.app/login", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 }`

#### Scenario: Sitemap XML contains login page

- **WHEN** a crawler fetches `https://shop-watcher.vercel.app/sitemap.xml`
- **THEN** the XML SHALL contain a `<url>` entry with `<loc>https://shop-watcher.vercel.app/login</loc>`

#### Scenario: Sitemap does not contain protected routes

- **WHEN** the sitemap XML is parsed
- **THEN** it SHALL NOT contain any `<loc>` entries for `/dashboard`, `/settings`, `/keywords`, `/history`, `/circles`, or `/status`

## Requirements


<!-- @trace
source: seo-improvement
updated: 2026-04-13
code:
  - webapp/app/sitemap.ts
  - webapp/app/layout.tsx
  - webapp/app/robots.ts
  - docs/index.html
-->

### Requirement: Webapp root layout exports correct product metadata

`webapp/app/layout.tsx` SHALL export a `metadata` object with:
- `title.default` set to `"Shop Watcher"`
- `title.template` set to `"%s | Shop Watcher"`
- `description` describing the multi-platform monitoring service (繁體中文，max 160 characters)
- `metadataBase` set to the production URL (`https://shop-watcher.vercel.app`)
- `openGraph.type` set to `"website"`
- `openGraph.locale` set to `"zh_TW"`
- `openGraph.siteName` set to `"Shop Watcher"`
- `twitter.card` set to `"summary"`

#### Scenario: Browser tab shows correct title on login page

- **WHEN** a user navigates to `/login`
- **THEN** the browser tab title SHALL display `"Shop Watcher"` (not `"Create Next App"`)

#### Scenario: Open Graph tags present in HTML head

- **WHEN** a crawler fetches the webapp root URL
- **THEN** the HTML `<head>` SHALL contain `<meta property="og:site_name" content="Shop Watcher">`

---
### Requirement: Webapp serves robots.txt via app/robots.ts

`webapp/app/robots.ts` SHALL export a `robots()` function returning rules that:
- Allow crawling of `/` and `/login`
- Disallow crawling of `/dashboard`, `/settings`, `/keywords`, `/history`, `/circles`, `/status`, `/api/`
- Set `sitemap` pointing to `https://shop-watcher.vercel.app/sitemap.xml`

#### Scenario: Search engine respects disallow rules

- **WHEN** a crawler fetches `https://shop-watcher.vercel.app/robots.txt`
- **THEN** the response SHALL contain `Disallow: /dashboard` and `Disallow: /api/`

#### Scenario: Sitemap URL declared in robots.txt

- **WHEN** a crawler fetches `/robots.txt`
- **THEN** the response SHALL contain `Sitemap: https://shop-watcher.vercel.app/sitemap.xml`

---
### Requirement: Webapp serves sitemap via app/sitemap.ts

`webapp/app/sitemap.ts` SHALL export a `sitemap()` function returning an array containing:
- `{ url: "https://shop-watcher.vercel.app/login", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 }`

#### Scenario: Sitemap XML contains login page

- **WHEN** a crawler fetches `https://shop-watcher.vercel.app/sitemap.xml`
- **THEN** the XML SHALL contain a `<url>` entry with `<loc>https://shop-watcher.vercel.app/login</loc>`

#### Scenario: Sitemap does not contain protected routes

- **WHEN** the sitemap XML is parsed
- **THEN** it SHALL NOT contain any `<loc>` entries for `/dashboard`, `/settings`, `/keywords`, `/history`, `/circles`, or `/status`