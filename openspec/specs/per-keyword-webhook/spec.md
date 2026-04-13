# per-keyword-webhook Specification

## Purpose

TBD - created by archiving change 'enhance-monitoring-conditions'. Update Purpose after archive.

## Requirements

### Requirement: Keyword notification routes to per-keyword Discord webhook when set

The system SHALL support a `discordWebhookUrl: String?` field on `Keyword`. When a keyword triggers a Discord notification, the system SHALL use the keyword's `discordWebhookUrl` if non-null. If `discordWebhookUrl` is null, the system SHALL fall back to the user's `NotificationSetting.discordWebhookUrl`. This allows different IPs/franchises to be routed to separate Discord channels.

#### Scenario: Notification uses keyword-level webhook when set

- **WHEN** a keyword has `discordWebhookUrl: "https://discord.com/api/webhooks/111/aaa"`
- **AND** the user's global webhook is `"https://discord.com/api/webhooks/999/zzz"`
- **THEN** the Discord notification SHALL be POSTed to `https://discord.com/api/webhooks/111/aaa`
- **AND** the global webhook SHALL NOT receive this notification

#### Scenario: Notification falls back to global webhook when keyword webhook is null

- **WHEN** a keyword has `discordWebhookUrl: null`
- **AND** the user's global webhook is `"https://discord.com/api/webhooks/999/zzz"`
- **THEN** the Discord notification SHALL be POSTed to `https://discord.com/api/webhooks/999/zzz`

#### Scenario: No notification sent when both webhooks are null

- **WHEN** a keyword has `discordWebhookUrl: null`
- **AND** the user's `NotificationSetting.discordWebhookUrl` is also null
- **THEN** no Discord HTTP request SHALL be made
- **AND** the system SHALL proceed to check Email notification settings

#### Scenario: Keyword created with discordWebhookUrl

- **WHEN** a user submits `POST /api/keywords` with `{ "discordWebhookUrl": "https://discord.com/api/webhooks/111/aaa" }`
- **THEN** the `Keyword` row SHALL be created with that `discordWebhookUrl`

#### Scenario: Invalid discordWebhookUrl format is rejected at keyword creation

- **WHEN** a user submits `POST /api/keywords` with a `discordWebhookUrl` that does not start with `https://discord.com/api/webhooks/`
- **THEN** the API SHALL return HTTP 400
- **AND** no `Keyword` row SHALL be created

#### Scenario: Keyword discordWebhookUrl updated via PATCH

- **WHEN** a user calls `PATCH /api/keywords/{id}` with `{ "discordWebhookUrl": "https://discord.com/api/webhooks/222/bbb" }`
- **THEN** `Keyword.discordWebhookUrl` SHALL be updated
- **AND** subsequent notifications for that keyword SHALL use the new URL

#### Scenario: GET /api/worker/keywords includes discordWebhookUrl

- **WHEN** the Worker calls `GET /api/worker/keywords`
- **THEN** each keyword in the response SHALL include `discordWebhookUrl` (null or string)
- **AND** the Worker SHALL pass this value to the notify batch API

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