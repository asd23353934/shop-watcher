# watcher-scheduler Specification

## Purpose

TBD - created by archiving change 'keyword-shop-watcher'. Update Purpose after archive.

## Requirements

### Requirement: Scheduler fetches keyword list from Next.js API before each scan cycle

The system SHALL call `GET /api/worker/keywords` at the start of every scan cycle to retrieve the current list of active keywords and their configurations. It SHALL NOT read from a local `config.yaml` file.

#### Scenario: Keyword list is fetched successfully before scanning

- **WHEN** a scan cycle begins
- **THEN** the scheduler SHALL call `WorkerApiClient.get_keywords()` which issues `GET /api/worker/keywords`
- **AND** the returned keyword list SHALL be used for the current scan cycle
- **AND** keywords added or removed between cycles SHALL be reflected automatically

#### Scenario: Empty keyword list skips the scan cycle

- **WHEN** `GET /api/worker/keywords` returns an empty array
- **THEN** no Playwright browser SHALL be launched
- **AND** the scheduler SHALL log "No active keywords, skipping scan" and sleep until the next interval

#### Scenario: API error on keyword fetch skips the scan cycle

- **WHEN** `GET /api/worker/keywords` returns a non-2xx status or raises a network exception
- **THEN** the scheduler SHALL log the error details
- **AND** no Playwright browser SHALL be launched for that cycle
- **AND** the scheduler SHALL continue to the next cycle after sleeping `CHECK_INTERVAL` seconds


<!-- @trace
source: keyword-shop-watcher
updated: 2026-03-31
code:
  - .env.example
  - src/scrapers/shopee.py
  - src/scrapers/__init__.py
  - config.example.yaml
  - src/database.py
  - src/scheduler.py
  - fly.toml
  - Dockerfile
  - requirements.txt
  - src/api_client.py
  - poc/screenshots/ruten.png
  - src/scrapers/ruten.py
  - .github/workflows/ci.yml
  - src/config.py
  - src/notifier.py
  - poc/screenshots/shopee.png
  - main.py
-->

---
### Requirement: Scheduler runs all keyword searches on a configurable interval

The system SHALL execute all keyword×platform search tasks concurrently using `asyncio.gather(return_exceptions=True)`, replacing the previous sequential nested loop. A per-platform `asyncio.Semaphore` SHALL limit concurrent connections per platform to `SEMAPHORE_PER_PLATFORM` (default: `3`). A failure in one keyword-platform task MUST NOT prevent other tasks from executing. The entire task batch SHALL be protected by `asyncio.wait_for(timeout=SCAN_TIMEOUT_SECONDS)`.

#### Scenario: Each keyword-platform pair is searched independently

- **WHEN** a keyword has platforms `["shopee", "ruten"]`
- **THEN** the scheduler SHALL submit `ShopeeWatcher.search(keyword)` and `RutenWatcher.search(keyword)` as concurrent async tasks
- **AND** a failure on one platform MUST NOT prevent the other platform from being searched

#### Scenario: All keyword-platform tasks are gathered concurrently

- **WHEN** a scan cycle begins with N keywords across M platforms
- **THEN** all N×M tasks SHALL be submitted to `asyncio.gather()` simultaneously
- **AND** per-platform Semaphore SHALL limit each platform to at most `SEMAPHORE_PER_PLATFORM` concurrent tasks

#### Scenario: Scheduler sleeps between scans

- **WHEN** a full scan cycle completes (or times out)
- **THEN** the scheduler SHALL sleep for exactly `CHECK_INTERVAL` seconds before starting the next cycle
- **AND** `CHECK_INTERVAL` SHALL be read from the `CHECK_INTERVAL` environment variable (default: `300`)

#### Scenario: Scheduler runs indefinitely until interrupted

- **WHEN** the application starts
- **THEN** the scheduler SHALL loop indefinitely using `asyncio.run()`
- **AND** the loop MUST exit cleanly when a `KeyboardInterrupt` or `SIGTERM` is received


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

---
### Requirement: Found items are reported to Next.js API immediately after each search

The system SHALL call `POST /api/worker/notify` for each item found by a keyword-platform search, passing the item data and the corresponding `keyword_id`.

#### Scenario: Each found item triggers a notify API call

- **WHEN** `ShopeeWatcher.search` or `RutenWatcher.search` returns a non-empty list
- **THEN** the scheduler SHALL call `WorkerApiClient.notify_item(keyword_id, item)` for each item in the list
- **AND** the call SHALL NOT be skipped even if a previous item's notify call failed

#### Scenario: Notify API call failure does not abort remaining items

- **WHEN** `POST /api/worker/notify` returns a non-2xx status for one item
- **THEN** the scheduler SHALL log the failure and continue reporting remaining items
- **AND** the scheduler MUST NOT raise an exception that stops the scan cycle


<!-- @trace
source: keyword-shop-watcher
updated: 2026-03-31
code:
  - .env.example
  - src/scrapers/shopee.py
  - src/scrapers/__init__.py
  - config.example.yaml
  - src/database.py
  - src/scheduler.py
  - fly.toml
  - Dockerfile
  - requirements.txt
  - src/api_client.py
  - poc/screenshots/ruten.png
  - src/scrapers/ruten.py
  - .github/workflows/ci.yml
  - src/config.py
  - src/notifier.py
  - poc/screenshots/shopee.png
  - main.py
-->

---
### Requirement: Per-scan summary is logged to stdout

The system SHALL print a one-line summary after each keyword-platform scan.

#### Scenario: Log line shows scan result counts

- **WHEN** a scan of keyword `"PS5"` on `shopee` finds 20 items
- **THEN** a log line SHALL be printed in the format: `[shopee] PS5 — 20 found, {n} reported`

#### Scenario: Log line shows zero items found

- **WHEN** a scan finds no items
- **THEN** the log line SHALL still be printed with `0 found`


<!-- @trace
source: keyword-shop-watcher
updated: 2026-03-31
code:
  - .env.example
  - src/scrapers/shopee.py
  - src/scrapers/__init__.py
  - config.example.yaml
  - src/database.py
  - src/scheduler.py
  - fly.toml
  - Dockerfile
  - requirements.txt
  - src/api_client.py
  - poc/screenshots/ruten.png
  - src/scrapers/ruten.py
  - .github/workflows/ci.yml
  - src/config.py
  - src/notifier.py
  - poc/screenshots/shopee.png
  - main.py
-->

---
### Requirement: Application environment is validated before the scheduler starts

The system SHALL verify that required environment variables are present before entering the scheduler loop.

#### Scenario: Missing WORKER_SECRET raises an error at startup

- **WHEN** the `WORKER_SECRET` environment variable is not set
- **THEN** the application SHALL exit with the message `WORKER_SECRET is required` before the scheduler starts

#### Scenario: Missing NEXT_PUBLIC_API_URL raises an error at startup

- **WHEN** the `NEXT_PUBLIC_API_URL` environment variable is not set
- **THEN** the application SHALL exit with the message `NEXT_PUBLIC_API_URL is required` before the scheduler starts

<!-- @trace
source: keyword-shop-watcher
updated: 2026-03-31
code:
  - .env.example
  - src/scrapers/shopee.py
  - src/scrapers/__init__.py
  - config.example.yaml
  - src/database.py
  - src/scheduler.py
  - fly.toml
  - Dockerfile
  - requirements.txt
  - src/api_client.py
  - poc/screenshots/ruten.png
  - src/scrapers/ruten.py
  - .github/workflows/ci.yml
  - src/config.py
  - src/notifier.py
  - poc/screenshots/shopee.png
  - main.py
-->