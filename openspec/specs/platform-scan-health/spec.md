# platform-scan-health Specification

## Purpose

TBD - created by archiving change 'worker-scalability'. Update Purpose after archive.

## Requirements

### Requirement: Worker records per-platform scan health status after each scan cycle

The system SHALL upsert a `PlatformScanStatus` record for each platform at the end of each scan cycle via `PATCH /api/worker/platform-status`. Each record SHALL store: `platform` (unique string identifier), `userId` (associated user), `lastSuccess` (datetime of last successful scan, nullable), `lastError` (last error message string, nullable), `failCount` (consecutive failure count, reset to 0 on success).

#### Scenario: Successful platform scan updates lastSuccess and resets failCount

- **WHEN** all keyword scans for platform `ruten` complete without exceptions in a cycle
- **THEN** `PlatformScanStatus.lastSuccess` for `ruten` SHALL be updated to the current timestamp
- **AND** `PlatformScanStatus.failCount` for `ruten` SHALL be reset to `0`
- **AND** `PlatformScanStatus.lastError` SHALL be set to `null`

#### Scenario: Failed platform scan increments failCount and records error

- **WHEN** one or more keyword scans for platform `booth` raise exceptions in a cycle
- **THEN** `PlatformScanStatus.failCount` for `booth` SHALL be incremented by 1
- **AND** `PlatformScanStatus.lastError` SHALL be set to the most recent exception message
- **AND** `PlatformScanStatus.lastSuccess` SHALL remain unchanged

#### Scenario: Platform status is upserted, not appended

- **WHEN** `PATCH /api/worker/platform-status` is called for platform `dlsite`
- **AND** a `PlatformScanStatus` row for `dlsite` already exists
- **THEN** the existing row SHALL be updated (upsert)
- **AND** no duplicate rows SHALL be created

#### Scenario: Worker platform-status API requires WORKER_SECRET authentication

- **WHEN** `PATCH /api/worker/platform-status` is called without a valid `Authorization: Bearer <WORKER_SECRET>` header
- **THEN** the API SHALL return HTTP 401
- **AND** no database write SHALL occur


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
### Requirement: Dashboard displays per-platform scan health status

The system SHALL display a platform health section on the Dashboard page (`/`) showing each platform's `lastSuccess` timestamp (formatted as relative time, e.g., "3 分鐘前") and `failCount`. Platforms with `failCount >= 3` SHALL be displayed with a visual warning indicator.

#### Scenario: Dashboard shows last success time for each platform

- **WHEN** an authenticated user navigates to the Dashboard
- **AND** `PlatformScanStatus` records exist for platforms `ruten`, `booth`, `dlsite`
- **THEN** each platform SHALL display its `lastSuccess` as a relative time string (e.g., "5 分鐘前")

#### Scenario: Dashboard shows warning indicator for platforms with failCount >= 3

- **WHEN** a platform's `PlatformScanStatus.failCount` is `3` or greater
- **THEN** the platform row SHALL display a visual warning indicator (e.g., orange or red badge)
- **AND** the `lastError` message SHALL be shown in a tooltip or expandable section

#### Scenario: Dashboard shows no data state for platform with no scan record

- **WHEN** a platform has no `PlatformScanStatus` record (e.g., newly added platform)
- **THEN** the platform row SHALL display "尚無掃描記錄" instead of a timestamp

#### Scenario: Platform health data is fetched from dedicated API endpoint

- **WHEN** the Dashboard page loads
- **THEN** it SHALL call `GET /api/platform-status` to retrieve platform health records
- **AND** the response SHALL include all `PlatformScanStatus` records for the authenticated user

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
### Requirement: Scrapers perform DOM structure check before extracting items

Each platform scraper module under `src/scrapers/` SHALL implement a `_check_dom_structure(page)` helper that verifies the presence of the outermost, stable container element that hosts search results on that platform (e.g., the main product list wrapper). The scraper's entry function `scrape_<platform>()` SHALL invoke this check before extracting items and SHALL include the boolean result in its return structure as `dom_intact`.

#### Scenario: DOM structure check passes when container is present

- **WHEN** `scrape_ruten(page, keyword)` loads the search results page
- **AND** the expected product list container is present in the DOM
- **THEN** `_check_dom_structure(page)` SHALL return `true`
- **AND** `scrape_ruten` SHALL report `dom_intact=true` in its result

#### Scenario: DOM structure check fails when container is missing

- **WHEN** `scrape_booth(page, keyword)` loads the search results page
- **AND** the expected product list container is absent (site redesign)
- **THEN** `_check_dom_structure(page)` SHALL return `false`
- **AND** `scrape_booth` SHALL report `dom_intact=false`
- **AND** `scrape_booth` SHALL return an empty item list without raising

#### Scenario: DOM check result propagates to canary reporting

- **WHEN** the Worker runs a canary scrape for platform `melonbooks`
- **AND** the scraper returns `dom_intact=false`
- **THEN** the canary record sent via `PATCH /api/worker/canary-status` SHALL include `domIntact=false` for that platform

<!-- @trace
source: platform-health-two-layer-detection
updated: 2026-04-17
code:
  - src/scrapers/ruten.py
  - src/scrapers/pchome.py
  - src/scrapers/momo.py
  - src/scrapers/animate.py
  - src/scrapers/yahoo_auction.py
  - src/scrapers/mandarake.py
  - src/scrapers/myacg.py
  - src/scrapers/kingstone.py
  - src/scrapers/melonbooks.py
  - src/scrapers/toranoana.py
  - src/scrapers/booth.py
  - src/scrapers/dlsite.py
  - src/watchers/base.py
-->


<!-- @trace
source: platform-health-two-layer-detection
updated: 2026-04-17
code:
  - src/scheduler.py
  - CLAUDE.md
  - src/scrapers/melonbooks.py
  - src/canary.py
  - src/scrapers/myacg.py
  - src/scrapers/ruten.py
  - src/scrapers/yahoo_auction.py
  - README.md
  - src/scrapers/_dom_signal.py
  - webapp/app/api/platform-status/route.ts
  - webapp/components/KeywordSection.tsx
  - webapp/prisma/migrations/20260417000000_add_platform_canary_status/migration.sql
  - src/api_client.py
  - src/scrapers/animate.py
  - webapp/components/KeywordClientSection.tsx
  - src/scrapers/pchome.py
  - src/scrapers/dlsite.py
  - webapp/components/KeywordList.tsx
  - src/scrapers/kingstone.py
  - webapp/components/PlatformScanHealthBadge.tsx
  - src/scrapers/booth.py
  - webapp/components/PlatformScanHealthSection.tsx
  - webapp/app/api/worker/canary-status/route.ts
  - webapp/constants/platform.ts
  - src/scrapers/momo.py
  - webapp/prisma/schema.prisma
  - webapp/components/KeywordCard.tsx
  - src/scrapers/toranoana.py
  - src/scrapers/mandarake.py
-->

---
### Requirement: Dashboard displays canary unhealthy badge next to platform scan health

The Dashboard platform health section SHALL display a warning badge for any platform whose `canaryHealthState` from `GET /api/platform-status` is `unhealthy`. The badge SHALL be visually distinct from the existing `failCount >= 3` indicator so that operators can tell the two signals apart. Hovering the badge SHALL reveal a tooltip containing the `canaryUnhealthyReason` (`empty_canary` or `dom_broken`) and `canaryLastRunAt` formatted as relative time.

#### Scenario: Dashboard shows canary warning badge when platform is unhealthy

- **WHEN** an authenticated user navigates to the Dashboard
- **AND** `GET /api/platform-status` returns `canaryHealthState=unhealthy, canaryUnhealthyReason=dom_broken` for platform `booth`
- **THEN** the Dashboard platform health row for `booth` SHALL display a canary warning badge
- **AND** the badge SHALL be visually distinct from the existing failCount warning indicator

#### Scenario: Dashboard hides canary badge when platform is healthy

- **WHEN** `GET /api/platform-status` returns `canaryHealthState=healthy` for platform `ruten`
- **THEN** the Dashboard platform health row for `ruten` SHALL NOT display a canary warning badge

#### Scenario: Tooltip shows unhealthyReason and lastRunAt

- **WHEN** the user hovers the canary warning badge for platform `melonbooks`
- **THEN** a tooltip SHALL display `canaryUnhealthyReason` (translated to a human-readable label, e.g., "canary 連續 0 筆" or "頁面結構異常")
- **AND** the tooltip SHALL display `canaryLastRunAt` as relative time (e.g., "15 分鐘前")

<!-- @trace
source: platform-health-two-layer-detection
updated: 2026-04-17
code:
  - webapp/components/PlatformScanHealthBadge.tsx
  - webapp/components/PlatformScanHealthSection.tsx
  - webapp/app/api/platform-status/route.ts
  - webapp/constants/platform.ts
-->

<!-- @trace
source: platform-health-two-layer-detection
updated: 2026-04-17
code:
  - src/scheduler.py
  - CLAUDE.md
  - src/scrapers/melonbooks.py
  - src/canary.py
  - src/scrapers/myacg.py
  - src/scrapers/ruten.py
  - src/scrapers/yahoo_auction.py
  - README.md
  - src/scrapers/_dom_signal.py
  - webapp/app/api/platform-status/route.ts
  - webapp/components/KeywordSection.tsx
  - webapp/prisma/migrations/20260417000000_add_platform_canary_status/migration.sql
  - src/api_client.py
  - src/scrapers/animate.py
  - webapp/components/KeywordClientSection.tsx
  - src/scrapers/pchome.py
  - src/scrapers/dlsite.py
  - webapp/components/KeywordList.tsx
  - src/scrapers/kingstone.py
  - webapp/components/PlatformScanHealthBadge.tsx
  - src/scrapers/booth.py
  - webapp/components/PlatformScanHealthSection.tsx
  - webapp/app/api/worker/canary-status/route.ts
  - webapp/constants/platform.ts
  - src/scrapers/momo.py
  - webapp/prisma/schema.prisma
  - webapp/components/KeywordCard.tsx
  - src/scrapers/toranoana.py
  - src/scrapers/mandarake.py
-->