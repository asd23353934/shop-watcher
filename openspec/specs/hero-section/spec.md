# hero-section Specification

## Purpose

TBD - created by archiving change 'landing-page'. Update Purpose after archive.

## Requirements

### Requirement: Hero section displays project name, tagline, and feature highlights

The landing page SHALL render a full-width hero section at the top of the page containing the project name, a one-sentence tagline, and a row of feature highlight tags.

#### Scenario: Project name is prominently displayed

- **WHEN** a user opens the landing page
- **THEN** the text "Shop Watcher" SHALL be visible as the largest heading (`<h1>`) on the page
- **AND** the heading SHALL use a font size of at least 3rem on desktop

#### Scenario: Tagline communicates the core value proposition

- **WHEN** a user views the hero section
- **THEN** a subtitle SHALL be displayed below the project name
- **AND** the subtitle SHALL convey that the tool monitors e-commerce platforms and sends Discord notifications for new listings

#### Scenario: Feature highlight tags are displayed in a row

- **WHEN** a user views the hero section
- **THEN** at least 4 feature tags SHALL be visible: 蝦皮 Shopee, 露天拍賣 Ruten, Discord 即時通知, and 關鍵字監控
- **AND** each tag SHALL have a colored background (Shopee tag: `#EE4D2D`; Ruten tag: `#0066CC`; others: neutral)

#### Scenario: Hero section CTA button links to installation guide

- **WHEN** a user clicks the "開始使用" (Get Started) button in the hero section
- **THEN** the page SHALL scroll smoothly to the installation guide section
- **AND** the button's `href` SHALL be `#installation`

#### Scenario: Hero section is responsive on mobile

- **WHEN** the page is viewed on a screen width of 375px
- **THEN** the heading font size SHALL reduce to at least 1.875rem
- **AND** the feature tags SHALL wrap to multiple lines without horizontal overflow

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