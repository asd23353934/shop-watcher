# circle-follow Specification

## Purpose

TBD - created by archiving change 'enhance-monitoring-conditions'. Update Purpose after archive.

## Requirements

### Requirement: User can follow a BOOTH shop or DLsite circle for new work alerts

The system SHALL support a `CircleFollow` model allowing users to subscribe to a specific BOOTH shop or DLsite circle. The Worker SHALL independently scan each followed circle's new-arrival page and notify the user of new works. Deduplication uses the existing `SeenItem(userId, platform, itemId)` unique key; the `keyword` field SHALL be set to `circle:{circleName}`.

#### Scenario: User creates a CircleFollow subscription

- **WHEN** a user submits `POST /api/circles` with `{ "platform": "booth", "circleId": "my-circle", "circleName": "My Circle", "webhookUrl": null }`
- **THEN** a `CircleFollow` row SHALL be created with `userId` set to the authenticated user's ID and `active: true`
- **AND** the API SHALL return HTTP 201 with the created record

#### Scenario: Duplicate CircleFollow is rejected

- **WHEN** a user attempts to create a `CircleFollow` with the same `platform` and `circleId` they already have
- **THEN** the API SHALL return HTTP 409 Conflict
- **AND** no duplicate row SHALL be created

#### Scenario: User can toggle CircleFollow active status

- **WHEN** a user calls `PATCH /api/circles/{id}` with `{ "active": false }`
- **THEN** `CircleFollow.active` SHALL be set to `false`
- **AND** the Worker SHALL skip this circle on the next scan cycle

#### Scenario: User can delete a CircleFollow

- **WHEN** a user calls `DELETE /api/circles/{id}` for a record they own
- **THEN** the `CircleFollow` row SHALL be deleted
- **AND** associated `SeenItem` rows with `keyword` matching `circle:{circleName}` SHALL remain (historical record preserved)

#### Scenario: CircleFollow is isolated per user

- **WHEN** a user calls `GET /api/circles`
- **THEN** only `CircleFollow` rows where `userId` matches the authenticated user SHALL be returned


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

---
### Requirement: Worker scans CircleFollow new-arrival pages each cycle

The Worker SHALL call `GET /api/worker/circles` to retrieve all active `CircleFollow` records each scan cycle. For each record, it SHALL scrape the platform's circle/shop new-arrival page and POST found items to `POST /api/worker/notify/batch` using the `keywordId: null` and `keyword: "circle:{circleName}"` fields.

#### Scenario: BOOTH shop new-arrival page is scraped for followed circle

- **WHEN** a `CircleFollow` has `platform: "booth"` and `circleId: "sample-shop"`
- **THEN** the Worker SHALL fetch `https://sample-shop.booth.pm/?adult=t&sort=new_arrival`
- **AND** parse `li.item-card[data-product-id]` elements
- **AND** POST found items to `/api/worker/notify/batch` with `keyword: "circle:sample-shop"`

#### Scenario: DLsite circle new-arrival page is scraped for followed circle

- **WHEN** a `CircleFollow` has `platform: "dlsite"` and `circleId: "RG12345"`
- **THEN** the Worker SHALL fetch `https://www.dlsite.com/maniax/circle/profile/=/maker_id/RG12345.html` and parse new works
- **AND** POST found items to `/api/worker/notify/batch` with `keyword: "circle:RG12345"`

#### Scenario: CircleFollow uses per-follow webhookUrl if set

- **WHEN** a `CircleFollow` has a non-null `webhookUrl`
- **THEN** notifications for that circle SHALL be sent to `webhookUrl` instead of the user's global webhook

#### Scenario: New work from followed circle is deduplicated via SeenItem

- **WHEN** a work from a followed circle was already notified in a previous scan cycle
- **THEN** `SeenItem(userId, platform, itemId)` unique key prevents re-insertion
- **AND** no duplicate notification SHALL be sent

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

---
### Requirement: GET /api/circles responds with cache headers

The API SHALL include a `Cache-Control: private, stale-while-revalidate=60` response header on all successful GET requests.

#### Scenario: Circles API returns cache header

- **WHEN** an authenticated user calls `GET /api/circles`
- **THEN** the response SHALL include `Cache-Control: private, stale-while-revalidate=60`
- **AND** the response body SHALL be unchanged from current behavior


<!-- @trace
source: perf-optimization
updated: 2026-04-13
code:
  - webapp/app/api/circles/route.ts
  - webapp/prisma/migrations/20260413035933_add_perf_indexes_v2/migration.sql
  - webapp/app/api/history/route.ts
  - webapp/lib/utils.ts
  - webapp/app/api/keywords/route.ts
  - webapp/prisma/schema.prisma
  - webapp/prisma/migrations/20260413035653_add_perf_indexes/migration.sql
-->

---
### Requirement: CircleFollow userId query uses index

The database SHALL have a composite index on `CircleFollow(userId, createdAt DESC)` to support efficient retrieval of a user's followed circles sorted by creation time.

#### Scenario: Circle follows list query uses index

- **WHEN** `GET /api/circles` is called for a user with multiple circle follows
- **THEN** the query SHALL resolve via the `(userId, createdAt)` index without a full table scan
- **AND** response time SHALL be under 300ms for tables with up to 10,000 CircleFollow rows

<!-- @trace
source: perf-optimization
updated: 2026-04-13
code:
  - webapp/app/api/circles/route.ts
  - webapp/prisma/migrations/20260413035933_add_perf_indexes_v2/migration.sql
  - webapp/app/api/history/route.ts
  - webapp/lib/utils.ts
  - webapp/app/api/keywords/route.ts
  - webapp/prisma/schema.prisma
  - webapp/prisma/migrations/20260413035653_add_perf_indexes/migration.sql
-->