# parallel-scraping Specification

## Purpose

TBD - created by archiving change 'worker-scalability'. Update Purpose after archive.

## Requirements

### Requirement: Scheduler executes all keyword-platform scans in parallel using asyncio

The system SHALL replace the sequential nested loop in `run_scan_cycle()` with `asyncio.gather()` so that all keyword×platform scan tasks execute concurrently. Each platform SHALL have a dedicated `asyncio.Semaphore` limiting concurrent connections to that platform, with the concurrency limit configurable via the `SEMAPHORE_PER_PLATFORM` environment variable (default: `3`).

#### Scenario: All keyword-platform tasks run concurrently

- **WHEN** a scan cycle begins with 10 keywords each targeting 12 platforms
- **THEN** all 120 scan tasks SHALL be submitted to `asyncio.gather()` simultaneously
- **AND** the cycle SHALL complete in approximately `(total_tasks / (num_platforms × semaphore_limit)) × avg_request_time` seconds rather than `total_tasks × avg_request_time` seconds

#### Scenario: Per-platform Semaphore limits concurrent connections

- **WHEN** multiple tasks target the same platform (e.g., `ruten`) simultaneously
- **THEN** at most `SEMAPHORE_PER_PLATFORM` (default: `3`) tasks for `ruten` SHALL execute concurrently
- **AND** remaining tasks for `ruten` SHALL wait until a Semaphore slot is released before executing

#### Scenario: One platform failure does not block other platforms

- **WHEN** a scan task for keyword "PS5" on platform `shopee` raises an exception
- **THEN** all other running tasks (e.g., keyword "PS5" on `ruten`, or keyword "switch" on `shopee`) SHALL continue executing
- **AND** the exception SHALL be caught and logged with the keyword and platform details
- **AND** `asyncio.gather(return_exceptions=True)` SHALL be used to prevent exception propagation

#### Scenario: SEMAPHORE_PER_PLATFORM is configurable via environment variable

- **WHEN** `SEMAPHORE_PER_PLATFORM=1` is set in the environment
- **THEN** only 1 task per platform SHALL execute concurrently, effectively approximating sequential behavior per platform
- **AND** the total number of concurrent tasks at any time SHALL not exceed `num_platforms × 1`

#### Scenario: All scrapers are async-compatible

- **WHEN** any scraper (shopee, ruten, booth, dlsite, toranoana, melonbooks, etc.) is called within asyncio.gather
- **THEN** the scraper SHALL use `async_playwright` and `async/await` syntax throughout
- **AND** no blocking synchronous I/O call SHALL be made inside the async scraper without wrapping in `asyncio.to_thread`

<!-- @trace
source: worker-scalability
updated: 2026-04-13
code:
  - webapp/app/api/worker/platform-status/route.ts
  - webapp/lib/discord.ts
  - webapp/app/api/worker/keywords/route.ts
  - webapp/app/api/platform-status/route.ts
  - src/scrapers/yahoo_auction.py
  - webapp/app/api/history/route.ts
  - src/watchers/base.py
  - src/scrapers/melonbooks.py
  - src/scrapers/booth.py
  - webapp/app/api/keywords/[id]/route.ts
  - webapp/components/Navbar.tsx
  - webapp/app/api/settings/route.ts
  - README.md
  - webapp/scripts/test-batch-api.mjs
  - webapp/app/api/worker/notify/batch/route.ts
  - webapp/components/KeywordClientSection.tsx
  - src/scheduler.py
  - .github/workflows/worker.yml
  - src/scrapers/pchome.py
  - webapp/app/api/circles/[id]/route.ts
  - webapp/prisma/schema.prisma
  - webapp/app/keywords/new/page.tsx
  - webapp/app/circles/layout.tsx
  - webapp/prisma/migrations/20260407070500_worker_scalability/migration.sql
  - webapp/components/KeywordList.tsx
  - src/scrapers/toranoana.py
  - webapp/types/keyword.ts
  - webapp/app/layout.tsx
  - webapp/app/api/worker/circles/route.ts
  - webapp/prisma/migrations/20260407072920_enhance_monitoring_conditions/migration.sql
  - src/scrapers/ruten.py
  - src/api_client.py
  - webapp/app/sitemap.ts
  - webapp/app/status/page.tsx
  - webapp/app/api/circles/route.ts
  - webapp/app/keywords/new/layout.tsx
  - webapp/components/CircleFollowForm.tsx
  - webapp/components/KeywordForm.tsx
  - src/scrapers/myacg.py
  - webapp/components/KeywordCard.tsx
  - webapp/app/robots.ts
  - webapp/app/api/keywords/route.ts
  - requirements.txt
  - webapp/app/history/page.tsx
  - webapp/components/NotificationForm.tsx
  - webapp/components/PlatformScanHealthBadge.tsx
  - webapp/components/PlatformScanHealthSection.tsx
  - webapp/app/circles/page.tsx
  - docs/index.html
  - webapp/app/status/layout.tsx
  - webapp/app/dashboard/page.tsx
  - webapp/constants/platform.ts
  - CLAUDE.md
  - src/scrapers/dlsite.py
  - webapp/components/DashboardStats.tsx
-->