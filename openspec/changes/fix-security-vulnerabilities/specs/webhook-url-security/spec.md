## ADDED Requirements

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
