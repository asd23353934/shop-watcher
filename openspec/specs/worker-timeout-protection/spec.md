# worker-timeout-protection Specification

## Purpose

TBD - created by archiving change 'worker-scalability'. Update Purpose after archive.

## Requirements

### Requirement: Python scan cycle is protected by asyncio.wait_for timeout

The system SHALL wrap the entire scan cycle execution in `asyncio.wait_for(run_scan_tasks(), timeout=300)`. When `asyncio.TimeoutError` is raised, the system SHALL send a Discord alert via `SYSTEM_ALERT_WEBHOOK` before exiting the cycle. The timeout value SHALL be configurable via the `SCAN_TIMEOUT_SECONDS` environment variable (default: `300`).

#### Scenario: Scan cycle completes within timeout

- **WHEN** all scan tasks complete within 300 seconds
- **THEN** the cycle SHALL finish normally
- **AND** no timeout alert SHALL be sent

#### Scenario: Scan cycle exceeds timeout and triggers alert

- **WHEN** the scan cycle has been running for more than `SCAN_TIMEOUT_SECONDS` seconds
- **THEN** `asyncio.TimeoutError` SHALL be raised, cancelling remaining tasks
- **AND** the system SHALL POST a Discord embed to `SYSTEM_ALERT_WEBHOOK` with title "⏱ 掃描逾時" and body containing the timeout duration and cycle start timestamp
- **AND** the system SHALL log the timeout event to stdout

#### Scenario: SYSTEM_ALERT_WEBHOOK not set silences alert but does not crash

- **WHEN** `asyncio.TimeoutError` is raised
- **AND** `SYSTEM_ALERT_WEBHOOK` is not set in the environment
- **THEN** the system SHALL log the timeout event to stdout only
- **AND** the system SHALL NOT raise an exception or exit the process


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
### Requirement: GitHub Actions worker job notifies on timeout and cancellation

The system SHALL ensure that all notification steps in `.github/workflows/worker.yml` use the condition `if: failure() || cancelled()` so that both job crashes and GitHub Actions timeout/cancellation events trigger the notification step.

#### Scenario: Job timeout triggers notification step

- **WHEN** the GitHub Actions job exceeds `timeout-minutes` and is marked as `cancelled`
- **THEN** the notification step with `if: failure() || cancelled()` SHALL execute
- **AND** the notification message SHALL indicate the job was timed out or cancelled
- **AND** a notification step using only `if: failure()` SHALL NOT execute in this scenario

#### Scenario: Job crash triggers notification step

- **WHEN** the GitHub Actions job exits with a non-zero exit code and is marked as `failure`
- **THEN** the notification step with `if: failure() || cancelled()` SHALL execute

#### Scenario: Job success does not trigger notification step

- **WHEN** the GitHub Actions job completes successfully
- **THEN** the notification step with `if: failure() || cancelled()` SHALL NOT execute


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
### Requirement: GitHub Actions concurrency group prevents overlapping worker jobs

The system SHALL configure `concurrency: { group: "worker-scan", cancel-in-progress: false }` at the workflow level in `worker.yml` so that a new job triggered while a previous job is still running will wait in queue rather than running concurrently or cancelling the previous job.

#### Scenario: New cron trigger waits when previous job is still running

- **WHEN** a GitHub Actions cron trigger fires
- **AND** a previous `worker-scan` concurrency group job is still executing
- **THEN** the new job SHALL be queued and wait for the previous job to complete
- **AND** the running job SHALL NOT be cancelled

#### Scenario: No overlap when sequential triggers run within the same window

- **WHEN** two cron triggers fire within the same 10-minute window
- **THEN** only one job SHALL run at a time in the `worker-scan` concurrency group

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