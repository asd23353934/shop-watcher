# item-deduplication Specification

## Purpose

TBD - created by archiving change 'keyword-shop-watcher'. Update Purpose after archive.

## Requirements

### Requirement: SeenItem table records notified items with user, platform, and item_id as unique key

The system SHALL maintain a SeenItem table in PostgreSQL. Each row records a unique combination of (userId, platform, itemId) along with the last known price. A SeenItem row is created when a new item is first seen, and updated when the item's price changes downward.

#### Scenario: SeenItem row is created for a first-time item

- **WHEN** POST /api/worker/notify/batch is called with an item whose (userId, platform, itemId) does not exist in SeenItem
- **THEN** a new SeenItem row SHALL be inserted with userId, platform, itemId, keyword, firstSeen (current UTC timestamp), and lastPrice (the item's current price or null)

#### Scenario: SeenItem unique constraint prevents duplicate rows for same price

- **WHEN** POST /api/worker/notify/batch is called with an item that already exists in SeenItem and the price has not dropped
- **THEN** no new SeenItem row SHALL be inserted
- **AND** the response SHALL count the item as duplicate

#### Scenario: SeenItem lastPrice is updated on price drop

- **WHEN** POST /api/worker/notify/batch is called with an item that already exists in SeenItem
- **AND** the new price is lower than SeenItem.lastPrice
- **THEN** SeenItem.lastPrice SHALL be updated to the new price
- **AND** the item SHALL be treated as a notification-worthy event (price drop)


<!-- @trace
source: price-drop-alert
updated: 2026-04-01
code:
  - webapp/app/dashboard/page.tsx
  - webapp/app/api/history/route.ts
  - webapp/app/api/worker/notify/batch/route.ts
  - src/scrapers/ruten.py
  - webapp/app/api/keywords/route.ts
  - src/scheduler.py
  - webapp/prisma/schema.prisma
  - webapp/app/api/worker/scan-log/route.ts
  - webapp/app/api/settings/test-webhook/route.ts
  - webapp/prisma/migrations/20260401023108_add_scan_log/migration.sql
  - webapp/app/dashboard/layout.tsx
  - webapp/app/api/keywords/[id]/route.ts
  - webapp/app/api/worker/keywords/route.ts
  - webapp/lib/email.ts
  - webapp/package.json
  - webapp/prisma/migrations/20260401023619_add_seen_item_last_price/migration.sql
  - webapp/scripts/cleanup.ts
  - webapp/lib/discord.ts
  - webapp/app/history/page.tsx
  - webapp/prisma/migrations/20260401020513_add_keyword_blocklist/migration.sql
  - webapp/app/settings/page.tsx
  - src/api_client.py
  - webapp/components/KeywordForm.tsx
  - webapp/components/NotificationForm.tsx
  - .github/workflows/cleanup.yml
  - src/watchers/base.py
  - src/scrapers/shopee.py
-->

---
### Requirement: Deduplication is scoped per user

The system SHALL allow different users to be notified of the same item. A `SeenItem` row blocks notifications only for the specific user who already received it.

#### Scenario: Same item can be notified to two different users

- **WHEN** User A and User B both have a keyword matching the same item on Shopee
- **THEN** User A SHALL receive a notification if `(userA_id, "shopee", itemId)` is not in `SeenItem`
- **AND** User B SHALL also receive a notification if `(userB_id, "shopee", itemId)` is not in `SeenItem`
- **AND** the presence of a `SeenItem` row for User A SHALL NOT block User B's notification


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
### Requirement: SeenItem rows are preserved after a keyword is deleted

The system SHALL retain `SeenItem` rows even when the corresponding `Keyword` is deleted, to prevent re-notification if the keyword is re-created.

#### Scenario: Deleting a keyword does not delete its SeenItem history

- **WHEN** a user deletes a `Keyword` row
- **THEN** all `SeenItem` rows associated with that user and the keyword text SHALL remain in the database
- **AND** if the same keyword is re-created, previously seen items SHALL be treated as duplicates and SHALL NOT trigger new notifications

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