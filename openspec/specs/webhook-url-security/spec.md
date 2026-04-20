# webhook-url-security Specification

## Purpose

TBD - created by archiving change 'fix-security-vulnerabilities'. Update Purpose after archive.

## Requirements

### Requirement: Discord webhook URL validation prevents SSRF

The system SHALL provide a shared utility function `isValidDiscordWebhookUrl(url)` in `webapp/lib/webhook-validation.ts`. This function SHALL validate that a Discord webhook URL is safe to make an outbound HTTP request to. A valid URL MUST use `https:` protocol, MUST have a hostname of exactly `discord.com`, and MUST have a pathname beginning with `/api/webhooks/`. The function SHALL reject any URL whose resolved hostname matches a private IP range (127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16) or IPv6 loopback/link-local. All API routes that accept a `discordWebhookUrl` parameter SHALL use this function instead of `startsWith` checks.

#### Scenario: Valid Discord webhook URL passes validation

- **WHEN** `isValidDiscordWebhookUrl("https://discord.com/api/webhooks/123/abc")` is called
- **THEN** the function SHALL return `true`

#### Scenario: Non-Discord hostname is rejected

- **WHEN** `isValidDiscordWebhookUrl("https://evil.com/api/webhooks/123/abc")` is called
- **THEN** the function SHALL return `false`

#### Scenario: HTTP protocol is rejected

- **WHEN** `isValidDiscordWebhookUrl("http://discord.com/api/webhooks/123/abc")` is called
- **THEN** the function SHALL return `false`

#### Scenario: Path traversal bypass attempt is rejected

- **WHEN** `isValidDiscordWebhookUrl("https://discord.com/api/webhooks/../../../localhost:6379/")` is called
- **THEN** the URL parsing SHALL resolve the pathname
- **AND** the function SHALL return `false` because the resolved pathname does not start with `/api/webhooks/` after normalization, OR the hostname check on the original `URL.hostname` catches the attempt

#### Scenario: Private IP address in URL is rejected

- **WHEN** `isValidDiscordWebhookUrl("https://192.168.1.1/api/webhooks/123/abc")` is called
- **THEN** the function SHALL return `false`

#### Scenario: Invalid URL string is rejected

- **WHEN** `isValidDiscordWebhookUrl("not-a-url")` is called
- **THEN** the function SHALL return `false`

#### Scenario: All API routes use shared validator

- **WHEN** any of the following routes receive a `discordWebhookUrl` in the request body: `POST /api/keywords`, `PATCH /api/keywords/[id]`, `POST /api/circles`, `PATCH /api/circles/[id]`, `PATCH /api/settings`, `POST /api/settings/test-webhook`
- **THEN** each route SHALL call `isValidDiscordWebhookUrl()` from `webapp/lib/webhook-validation.ts`
- **AND** SHALL NOT implement its own inline `startsWith` check

<!-- @trace
source: fix-security-vulnerabilities
updated: 2026-04-20
code:
  - webapp/components/ui/card.tsx
  - webapp/app/status/page.tsx
  - webapp/app/api/settings/test-email/route.ts
  - webapp/app/settings/page.tsx
  - webapp/components/KeywordList.tsx
  - src/scrapers/toranoana.py
  - src/scheduler.py
  - webapp/app/api/keywords/[id]/blocklist/route.ts
  - webapp/app/api/settings/test-webhook/route.ts
  - webapp/app/settings/loading.tsx
  - webapp/app/api/keywords/route.ts
  - webapp/components/NotificationStatus.tsx
  - webapp/prisma/migrations/20260420022937_add_tag_rules/migration.sql
  - src/scrapers/myacg.py
  - webapp/lib/utils.ts
  - webapp/components/DashboardStats.tsx
  - webapp/app/circles/page.tsx
  - webapp/components/KeywordClientSection.tsx
  - webapp/app/api/platform-status/route.ts
  - webapp/components/theme-provider.tsx
  - src/scrapers/dlsite.py
  - webapp/app/history/page.tsx
  - webapp/components/KeywordCard.tsx
  - webapp/components/policy-section.tsx
  - webapp/components/KeywordForm.tsx
  - .github/workflows/ci.yml
  - webapp/app/globals.css
  - webapp/app/api/history/route.ts
  - webapp/app/login/page.tsx
  - .github/workflows/cleanup.yml
  - webapp/lib/keyword-validation.ts
  - webapp/vercel.json
  - webapp/prisma/migrations/20260420030000_remove_tag_system/migration.sql
  - webapp/app/dashboard/layout.tsx
  - webapp/app/circles/layout.tsx
  - src/scrapers/ruten.py
  - webapp/app/status/layout.tsx
  - src/scrapers/_dom_signal.py
  - webapp/app/dashboard/page.tsx
  - webapp/app/keywords/new/layout.tsx
  - webapp/lib/email.ts
  - webapp/lib/webhook-validation.ts
  - .github/workflows/warmup.yml
  - webapp/app/api/worker/keywords/route.ts
  - webapp/app/api/circles/route.ts
  - webapp/next.config.ts
  - src/scrapers/yahoo_auction.py
  - webapp/components/PlatformScanHealthSection.tsx
  - webapp/app/terms/page.tsx
  - webapp/prisma/migrations/20260420014921_add_tags/migration.sql
  - webapp/components/ChartsRow.tsx
  - webapp/app/api/circles/[id]/route.ts
  - src/scrapers/animate.py
  - src/watchers/base.py
  - webapp/components/CircleFollowForm.tsx
  - src/canary.py
  - src/scrapers/pchome.py
  - webapp/app/api/keywords/[id]/route.ts
  - webapp/app/api/settings/route.ts
  - webapp/app/api/worker/canary-status/route.ts
  - webapp/prisma/migrations/20260414000000_replace_email_address_with_email_enabled/migration.sql
  - src/scrapers/mandarake.py
  - CLAUDE.md
  - webapp/app/dashboard/loading.tsx
  - webapp/package.json
  - webapp/app/privacy/page.tsx
  - src/scrapers/momo.py
  - src/scrapers/shopee.py
  - webapp/app/history/layout.tsx
  - webapp/app/circles/loading.tsx
  - .github/workflows/worker.yml
  - webapp/components/ScanLogSection.tsx
  - src/scrapers/_price_utils.py
  - webapp/app/keywords/new/page.tsx
  - webapp/components/DashboardCharts.tsx
  - webapp/app/history/loading.tsx
  - webapp/app/layout.tsx
  - webapp/lib/discord.ts
  - webapp/app/api/worker/notify/route.ts
  - webapp/components/Navbar.tsx
  - webapp/components/PlatformScanHealthBadge.tsx
  - webapp/auth.ts
  - webapp/prisma/migrations/20260416000000_add_active_userid_indexes/migration.sql
  - webapp/prisma/schema.prisma
  - README.md
  - src/scrapers/kingstone.py
  - webapp/app/api/worker/notify/batch/route.ts
  - webapp/constants/platform.ts
  - src/scrapers/booth.py
  - webapp/app/api/worker/platform-status/route.ts
  - webapp/app/settings/layout.tsx
  - src/scrapers/melonbooks.py
  - webapp/components/NotificationForm.tsx
  - src/watchers/shopee.py
  - webapp/prisma/migrations/20260417000000_add_platform_canary_status/migration.sql
  - src/api_client.py
  - webapp/components/KeywordSection.tsx
-->