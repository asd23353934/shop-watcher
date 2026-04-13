# notify-rate-limit Specification

## Purpose

TBD - created by archiving change 'enhance-monitoring-conditions'. Update Purpose after archive.

## Requirements

### Requirement: Per-keyword scan notification cap prevents notification floods

The system SHALL support a `maxNotifyPerScan: Int?` field on `Keyword`. When a batch notification request is processed for a keyword, if the number of new (non-duplicate) items exceeds `maxNotifyPerScan`, the system SHALL truncate to the first `maxNotifyPerScan` items (preserving scraper-returned order, newest first) and skip the remainder. Items beyond the cap SHALL NOT be inserted into `SeenItem` and SHALL NOT trigger any notification. When `maxNotifyPerScan` is null, the system-level `MAX_NOTIFY_PER_BATCH` environment variable applies as the default.

#### Scenario: Batch exceeds per-keyword maxNotifyPerScan cap

- **WHEN** `POST /api/worker/notify/batch` receives 20 new items for keyword K
- **AND** keyword K has `maxNotifyPerScan: 5`
- **THEN** only the first 5 items SHALL be inserted into SeenItem
- **AND** only those 5 items SHALL trigger Discord / Email notification
- **AND** the remaining 15 items SHALL be silently dropped (not recorded, not notified)
- **AND** the API response SHALL indicate 5 notified and 15 capped

#### Scenario: Batch within cap notifies all items

- **WHEN** `POST /api/worker/notify/batch` receives 3 new items for keyword K
- **AND** keyword K has `maxNotifyPerScan: 5`
- **THEN** all 3 items SHALL be inserted into SeenItem and notified

#### Scenario: maxNotifyPerScan null uses system default MAX_NOTIFY_PER_BATCH

- **WHEN** keyword K has `maxNotifyPerScan: null`
- **AND** environment variable `MAX_NOTIFY_PER_BATCH` is `10`
- **THEN** the effective cap for that keyword SHALL be 10

#### Scenario: Keyword created with maxNotifyPerScan

- **WHEN** a user submits `POST /api/keywords` with `{ "maxNotifyPerScan": 3 }`
- **THEN** the `Keyword` row SHALL be created with `maxNotifyPerScan: 3`

#### Scenario: maxNotifyPerScan must be a positive integer

- **WHEN** a user submits `POST /api/keywords` with `{ "maxNotifyPerScan": 0 }` or `{ "maxNotifyPerScan": -1 }`
- **THEN** the API SHALL return HTTP 400
- **AND** no `Keyword` row SHALL be created

#### Scenario: Keyword maxNotifyPerScan updated via PATCH

- **WHEN** a user calls `PATCH /api/keywords/{id}` with `{ "maxNotifyPerScan": 10 }`
- **THEN** `Keyword.maxNotifyPerScan` SHALL be updated to 10
- **AND** subsequent batch notifications SHALL apply the new cap

<!-- @trace
source: enhance-monitoring-conditions
updated: 2026-04-13
code:
  - webapp/components/KeywordClientSection.tsx
  - webapp/prisma/migrations/20260407072920_enhance_monitoring_conditions/migration.sql
  - webapp/app/layout.tsx
  - webapp/app/circles/page.tsx
  - requirements.txt
  - webapp/app/api/circles/[id]/route.ts
  - src/scrapers/dlsite.py
  - .github/workflows/worker.yml
  - src/scrapers/ruten.py
  - webapp/constants/platform.ts
  - webapp/components/NotificationForm.tsx
  - src/scrapers/booth.py
  - webapp/app/api/circles/route.ts
  - webapp/components/PlatformScanHealthBadge.tsx
  - webapp/app/api/worker/notify/batch/route.ts
  - webapp/app/history/page.tsx
  - webapp/app/api/settings/route.ts
  - CLAUDE.md
  - webapp/app/dashboard/page.tsx
  - webapp/components/CircleFollowForm.tsx
  - webapp/scripts/test-batch-api.mjs
  - src/scrapers/melonbooks.py
  - webapp/components/DashboardStats.tsx
  - src/watchers/base.py
  - webapp/lib/discord.ts
  - webapp/prisma/schema.prisma
  - webapp/components/KeywordList.tsx
  - webapp/components/Navbar.tsx
  - webapp/prisma/migrations/20260407070500_worker_scalability/migration.sql
  - README.md
  - webapp/app/api/history/route.ts
  - webapp/app/keywords/new/page.tsx
  - src/scrapers/pchome.py
  - webapp/app/robots.ts
  - webapp/app/api/worker/platform-status/route.ts
  - webapp/components/KeywordCard.tsx
  - src/api_client.py
  - webapp/app/api/platform-status/route.ts
  - webapp/app/status/page.tsx
  - webapp/app/api/worker/keywords/route.ts
  - webapp/app/api/worker/circles/route.ts
  - src/scrapers/myacg.py
  - webapp/app/circles/layout.tsx
  - webapp/components/KeywordForm.tsx
  - webapp/types/keyword.ts
  - webapp/app/api/keywords/route.ts
  - src/scrapers/toranoana.py
  - docs/index.html
  - webapp/app/sitemap.ts
  - webapp/app/keywords/new/layout.tsx
  - src/scheduler.py
  - webapp/app/api/keywords/[id]/route.ts
  - webapp/components/PlatformScanHealthSection.tsx
  - src/scrapers/yahoo_auction.py
  - webapp/app/status/layout.tsx
-->