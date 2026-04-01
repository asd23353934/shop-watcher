# data-cleanup Specification

## Purpose

TBD - created by archiving change 'data-lifecycle'. Update Purpose after archive.

## Requirements

### Requirement: Expired SeenItem rows are deleted daily

The system SHALL run a daily cleanup job that deletes SeenItem rows older than SEEN_ITEM_RETENTION_DAYS (default 30 days).

#### Scenario: Old SeenItems are deleted

- **WHEN** the cleanup job runs
- **THEN** all SeenItem rows where firstSeen < (now - SEEN_ITEM_RETENTION_DAYS) SHALL be deleted
- **AND** SeenItem rows within the retention period SHALL NOT be deleted

#### Scenario: Cleanup job outputs deletion count

- **WHEN** the cleanup job completes successfully
- **THEN** the job SHALL output the number of deleted SeenItem rows to stdout


<!-- @trace
source: data-lifecycle
updated: 2026-04-01
code:
  - webapp/app/dashboard/layout.tsx
  - webapp/prisma/migrations/20260401020513_add_keyword_blocklist/migration.sql
  - webapp/lib/email.ts
  - webapp/prisma/migrations/20260401023619_add_seen_item_last_price/migration.sql
  - webapp/app/api/history/route.ts
  - webapp/app/api/settings/test-webhook/route.ts
  - webapp/lib/discord.ts
  - webapp/app/history/page.tsx
  - webapp/app/api/worker/notify/batch/route.ts
  - webapp/app/api/worker/keywords/route.ts
  - webapp/app/dashboard/page.tsx
  - .github/workflows/cleanup.yml
  - src/scrapers/shopee.py
  - webapp/components/KeywordForm.tsx
  - webapp/app/settings/page.tsx
  - webapp/prisma/schema.prisma
  - webapp/app/api/worker/scan-log/route.ts
  - webapp/app/api/keywords/route.ts
  - webapp/scripts/cleanup.ts
  - src/scrapers/ruten.py
  - webapp/prisma/migrations/20260401023108_add_scan_log/migration.sql
  - webapp/package.json
  - src/api_client.py
  - webapp/app/api/keywords/[id]/route.ts
  - src/watchers/base.py
  - webapp/components/NotificationForm.tsx
  - src/scheduler.py
-->

---
### Requirement: Expired ScanLog rows are deleted daily

The system SHALL delete ScanLog rows older than SCAN_LOG_RETENTION_DAYS (default 7 days) during the daily cleanup job.

#### Scenario: Old ScanLogs are deleted

- **WHEN** the cleanup job runs
- **THEN** all ScanLog rows where scannedAt < (now - SCAN_LOG_RETENTION_DAYS) SHALL be deleted
- **AND** ScanLog rows within the retention period SHALL NOT be deleted

<!-- @trace
source: data-lifecycle
updated: 2026-04-01
code:
  - webapp/app/dashboard/layout.tsx
  - webapp/prisma/migrations/20260401020513_add_keyword_blocklist/migration.sql
  - webapp/lib/email.ts
  - webapp/prisma/migrations/20260401023619_add_seen_item_last_price/migration.sql
  - webapp/app/api/history/route.ts
  - webapp/app/api/settings/test-webhook/route.ts
  - webapp/lib/discord.ts
  - webapp/app/history/page.tsx
  - webapp/app/api/worker/notify/batch/route.ts
  - webapp/app/api/worker/keywords/route.ts
  - webapp/app/dashboard/page.tsx
  - .github/workflows/cleanup.yml
  - src/scrapers/shopee.py
  - webapp/components/KeywordForm.tsx
  - webapp/app/settings/page.tsx
  - webapp/prisma/schema.prisma
  - webapp/app/api/worker/scan-log/route.ts
  - webapp/app/api/keywords/route.ts
  - webapp/scripts/cleanup.ts
  - src/scrapers/ruten.py
  - webapp/prisma/migrations/20260401023108_add_scan_log/migration.sql
  - webapp/package.json
  - src/api_client.py
  - webapp/app/api/keywords/[id]/route.ts
  - src/watchers/base.py
  - webapp/components/NotificationForm.tsx
  - src/scheduler.py
-->