# email-notify Specification

## Purpose

TBD - created by archiving change 'saas-webapp'. Update Purpose after archive.

## Requirements

### Requirement: New item triggers an Email notification via Resend

When new items pass deduplication in a batch, the system SHALL send one Email listing all new items in a single HTML table. Each row in the table SHALL represent one item.

#### Scenario: Batch email lists all new items with seller name

- **WHEN** a batch of N new items passes deduplication and the user has an `emailAddress` configured
- **THEN** exactly one email SHALL be sent to `emailAddress`
- **AND** the email subject SHALL be `[Shop Watcher] 關鍵字「{keyword}」發現 {N} 個新商品`
- **AND** the email body SHALL contain an HTML table with one row per item
- **AND** each row SHALL include: item name (linked to item URL), platform label, price (`NT$ {n:,}` or `價格未知`), and seller name (`未知` if null)
- **AND** if an item has a non-null `image_url`, a thumbnail image SHALL be shown in its row

#### Scenario: Seller name is unknown in batch email

- **WHEN** an item in the batch has a null `seller_name`
- **THEN** the seller cell in that row SHALL display `未知`


<!-- @trace
source: notification-and-search-improvements
updated: 2026-04-01
code:
  - src/scheduler.py
  - webapp/components/KeywordForm.tsx
  - webapp/prisma/migrations/20260401020513_add_keyword_blocklist/migration.sql
  - webapp/scripts/cleanup.ts
  - src/scrapers/ruten.py
  - webapp/app/settings/page.tsx
  - src/watchers/base.py
  - webapp/package.json
  - webapp/app/api/history/route.ts
  - webapp/components/NotificationForm.tsx
  - webapp/lib/email.ts
  - webapp/app/history/page.tsx
  - webapp/app/api/settings/test-webhook/route.ts
  - webapp/prisma/schema.prisma
  - webapp/app/api/worker/keywords/route.ts
  - webapp/app/dashboard/page.tsx
  - webapp/app/api/keywords/[id]/route.ts
  - webapp/app/dashboard/layout.tsx
  - .github/workflows/cleanup.yml
  - webapp/app/api/worker/notify/batch/route.ts
  - webapp/prisma/migrations/20260401023619_add_seen_item_last_price/migration.sql
  - src/scrapers/shopee.py
  - webapp/app/api/worker/scan-log/route.ts
  - src/api_client.py
  - webapp/lib/discord.ts
  - webapp/app/api/keywords/route.ts
  - webapp/prisma/migrations/20260401023108_add_scan_log/migration.sql
-->

---
### Requirement: Resend API errors do not block the notify response

The system SHALL NOT propagate Resend API errors to the Worker. If the email send fails, the item is still recorded as seen and the API returns a success response.

#### Scenario: Resend API error is logged and does not block

- **WHEN** the Resend SDK call returns an error (network error or API error)
- **THEN** the error SHALL be logged server-side with the item ID and user ID
- **AND** the `POST /api/worker/notify` response SHALL still return HTTP 200
- **AND** the `SeenItem` row SHALL have already been inserted before the email send attempt


<!-- @trace
source: saas-webapp
updated: 2026-03-31
code:
  - webapp/app/api/keywords/[id]/route.ts
  - src/scrapers/ruten.py
  - webapp/app/globals.css
  - webapp/package.json
  - webapp/app/favicon.ico
  - webapp/public/file.svg
  - webapp/tsconfig.json
  - webapp/middleware.ts
  - webapp/prisma/migrations/migration_lock.toml
  - webapp/app/api/worker/notify/route.ts
  - webapp/app/login/page.tsx
  - webapp/eslint.config.mjs
  - webapp/public/globe.svg
  - webapp/types/next-auth.d.ts
  - webapp/next.config.ts
  - webapp/public/vercel.svg
  - webapp/vercel.json
  - main.py
  - poc/screenshots/shopee.png
  - webapp/app/dashboard/layout.tsx
  - .github/workflows/worker.yml
  - .env.example
  - webapp/lib/email.ts
  - webapp/lib/prisma.ts
  - webapp/components/KeywordForm.tsx
  - webapp/app/api/worker/keywords/route.ts
  - webapp/components/NotificationForm.tsx
  - fly.toml
  - src/database.py
  - webapp/app/api/keywords/route.ts
  - src/api_client.py
  - webapp/app/api/settings/route.ts
  - webapp/postcss.config.mjs
  - webapp/app/dashboard/page.tsx
  - config.example.yaml
  - webapp/app/page.tsx
  - webapp/components/KeywordFormWrapper.tsx
  - poc/screenshots/ruten.png
  - webapp/lib/worker-auth.ts
  - src/config.py
  - webapp/app/settings/page.tsx
  - webapp/prisma/migrations/20260331075111_init/migration.sql
  - requirements.txt
  - webapp/components/KeywordList.tsx
  - webapp/prisma/schema.prisma
  - .github/workflows/ci.yml
  - src/scheduler.py
  - src/scrapers/shopee.py
  - webapp/app/api/auth/[...nextauth]/route.ts
  - webapp/auth.ts
  - webapp/lib/discord.ts
  - webapp/public/window.svg
  - webapp/app/layout.tsx
  - webapp/public/next.svg
  - src/scrapers/__init__.py
  - src/notifier.py
  - Dockerfile
  - run_once.py
  - webapp/README.md
-->

---
### Requirement: Sender email address is configurable via environment variable

The system SHALL read the email sender address from the `RESEND_FROM_EMAIL` environment variable.

#### Scenario: RESEND_FROM_EMAIL is used as the sender address

- **WHEN** `RESEND_FROM_EMAIL=noreply@shopwatcher.app` is set
- **THEN** all outgoing emails SHALL use `noreply@shopwatcher.app` as the `from` address

#### Scenario: Missing RESEND_FROM_EMAIL causes a startup configuration error

- **WHEN** `RESEND_FROM_EMAIL` is not set and an email send is attempted
- **THEN** the system SHALL log an error `RESEND_FROM_EMAIL is not configured`
- **AND** the email SHALL NOT be sent

<!-- @trace
source: saas-webapp
updated: 2026-03-31
code:
  - webapp/app/api/keywords/[id]/route.ts
  - src/scrapers/ruten.py
  - webapp/app/globals.css
  - webapp/package.json
  - webapp/app/favicon.ico
  - webapp/public/file.svg
  - webapp/tsconfig.json
  - webapp/middleware.ts
  - webapp/prisma/migrations/migration_lock.toml
  - webapp/app/api/worker/notify/route.ts
  - webapp/app/login/page.tsx
  - webapp/eslint.config.mjs
  - webapp/public/globe.svg
  - webapp/types/next-auth.d.ts
  - webapp/next.config.ts
  - webapp/public/vercel.svg
  - webapp/vercel.json
  - main.py
  - poc/screenshots/shopee.png
  - webapp/app/dashboard/layout.tsx
  - .github/workflows/worker.yml
  - .env.example
  - webapp/lib/email.ts
  - webapp/lib/prisma.ts
  - webapp/components/KeywordForm.tsx
  - webapp/app/api/worker/keywords/route.ts
  - webapp/components/NotificationForm.tsx
  - fly.toml
  - src/database.py
  - webapp/app/api/keywords/route.ts
  - src/api_client.py
  - webapp/app/api/settings/route.ts
  - webapp/postcss.config.mjs
  - webapp/app/dashboard/page.tsx
  - config.example.yaml
  - webapp/app/page.tsx
  - webapp/components/KeywordFormWrapper.tsx
  - poc/screenshots/ruten.png
  - webapp/lib/worker-auth.ts
  - src/config.py
  - webapp/app/settings/page.tsx
  - webapp/prisma/migrations/20260331075111_init/migration.sql
  - requirements.txt
  - webapp/components/KeywordList.tsx
  - webapp/prisma/schema.prisma
  - .github/workflows/ci.yml
  - src/scheduler.py
  - src/scrapers/shopee.py
  - webapp/app/api/auth/[...nextauth]/route.ts
  - webapp/auth.ts
  - webapp/lib/discord.ts
  - webapp/public/window.svg
  - webapp/app/layout.tsx
  - webapp/public/next.svg
  - src/scrapers/__init__.py
  - src/notifier.py
  - Dockerfile
  - run_once.py
  - webapp/README.md
-->