# feature-section Specification

## Purpose

TBD - created by archiving change 'landing-page'. Update Purpose after archive.

## Requirements

### Requirement: Feature section displays three capability cards

The landing page SHALL render a feature section with exactly 3 cards laid out in a responsive grid, each describing one core capability of Shop Watcher.

#### Scenario: Three feature cards are rendered

- **WHEN** a user scrolls to the feature section
- **THEN** exactly 3 cards SHALL be visible with the following titles:
  1. 多平台監控 — 同時監控蝦皮與露天拍賣
  2. Discord 即時通知 — 發現新商品立即 Ping 指定用戶
  3. 靈活設定 — 關鍵字、價格範圍、掃描間隔自由配置

#### Scenario: Each card contains an icon, title, and description

- **WHEN** a user views a feature card
- **THEN** the card SHALL contain an icon (SVG or emoji), a bold title, and a 2–3 sentence description
- **AND** the description for the notification card SHALL mention that different keywords can mention different Discord users (`discord_user_id`)

#### Scenario: Feature grid is responsive

- **WHEN** the page is viewed on a screen width ≥ 768px
- **THEN** the 3 cards SHALL be displayed in a single row (3-column grid)
- **WHEN** the page is viewed on a screen width < 768px
- **THEN** the cards SHALL stack vertically in a single column

#### Scenario: Feature section has a visible section heading

- **WHEN** a user views the feature section
- **THEN** a section heading (`<h2>`) with text "核心功能" SHALL be displayed above the cards

<!-- @trace
source: landing-page
updated: 2026-03-31
code:
  - webapp/app/api/worker/keywords/route.ts
  - webapp/public/file.svg
  - requirements.txt
  - .github/workflows/worker.yml
  - docs/index.html
  - src/scrapers/__init__.py
  - poc/screenshots/shopee.png
  - webapp/next.config.ts
  - .github/workflows/pages.yml
  - src/scrapers/shopee.py
  - webapp/prisma/migrations/20260331075111_init/migration.sql
  - webapp/app/api/settings/route.ts
  - webapp/public/next.svg
  - fly.toml
  - src/database.py
  - src/notifier.py
  - webapp/eslint.config.mjs
  - webapp/public/window.svg
  - webapp/app/layout.tsx
  - webapp/app/favicon.ico
  - webapp/package.json
  - config.example.yaml
  - webapp/README.md
  - webapp/components/KeywordForm.tsx
  - webapp/auth.ts
  - src/api_client.py
  - .github/workflows/ci.yml
  - src/scheduler.py
  - webapp/app/api/worker/notify/route.ts
  - webapp/app/page.tsx
  - webapp/postcss.config.mjs
  - poc/screenshots/ruten.png
  - webapp/app/dashboard/layout.tsx
  - webapp/app/dashboard/page.tsx
  - webapp/lib/worker-auth.ts
  - webapp/lib/prisma.ts
  - webapp/public/globe.svg
  - src/config.py
  - webapp/components/KeywordFormWrapper.tsx
  - run_once.py
  - webapp/middleware.ts
  - webapp/app/api/keywords/route.ts
  - webapp/app/login/page.tsx
  - webapp/components/KeywordList.tsx
  - webapp/prisma/schema.prisma
  - webapp/tsconfig.json
  - webapp/app/api/auth/[...nextauth]/route.ts
  - webapp/public/vercel.svg
  - Dockerfile
  - main.py
  - webapp/lib/discord.ts
  - .env.example
  - webapp/app/globals.css
  - webapp/lib/email.ts
  - webapp/app/api/keywords/[id]/route.ts
  - webapp/components/NotificationForm.tsx
  - webapp/app/settings/page.tsx
  - webapp/prisma/migrations/migration_lock.toml
  - webapp/vercel.json
  - webapp/types/next-auth.d.ts
  - src/scrapers/ruten.py
-->