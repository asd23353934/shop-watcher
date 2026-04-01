# worker-scan-log Specification

## Purpose

TBD - created by archiving change 'dashboard-observability'. Update Purpose after archive.

## Requirements

### Requirement: Worker records scan completion time to API

After each scan cycle completes, the Worker SHALL POST to /api/worker/scan-log to record the scan completion timestamp. The Dashboard SHALL display the last scan time.

#### Scenario: Worker posts scan log after cycle

- **WHEN** run_scan_cycle() completes (with or without found items)
- **THEN** the Worker SHALL call POST /api/worker/scan-log with { scannedAt: ISO8601 }
- **AND** the server SHALL upsert a ScanLog row using a fixed global record identifier

#### Scenario: Dashboard shows last scan time

- **WHEN** an authenticated user views the dashboard
- **THEN** the page SHALL display the most recent scan completion time from ScanLog
- **AND** if no ScanLog exists, the dashboard SHALL display "尚未掃描"

<!-- @trace
source: dashboard-observability
updated: 2026-04-01
code:
  - webapp/app/api/history/route.ts
  - src/scrapers/ruten.py
  - webapp/app/dashboard/page.tsx
  - webapp/prisma/migrations/20260401023619_add_seen_item_last_price/migration.sql
  - webapp/prisma/schema.prisma
  - webapp/app/api/keywords/route.ts
  - webapp/app/api/worker/keywords/route.ts
  - src/api_client.py
  - src/scheduler.py
  - webapp/prisma/migrations/20260401020513_add_keyword_blocklist/migration.sql
  - webapp/app/api/worker/notify/batch/route.ts
  - webapp/components/NotificationForm.tsx
  - webapp/lib/discord.ts
  - src/scrapers/shopee.py
  - webapp/package.json
  - webapp/scripts/cleanup.ts
  - webapp/app/history/page.tsx
  - webapp/app/api/settings/test-webhook/route.ts
  - .github/workflows/cleanup.yml
  - webapp/app/api/keywords/[id]/route.ts
  - webapp/app/dashboard/layout.tsx
  - src/watchers/base.py
  - webapp/app/settings/page.tsx
  - webapp/components/KeywordForm.tsx
  - webapp/lib/email.ts
  - webapp/prisma/migrations/20260401023108_add_scan_log/migration.sql
  - webapp/app/api/worker/scan-log/route.ts
-->