## ADDED Requirements

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
