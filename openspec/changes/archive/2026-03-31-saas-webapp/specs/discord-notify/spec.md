## ADDED Requirements

### Requirement: New item triggers a Discord Embed notification via the user's Webhook URL

When a new item passes deduplication, the system SHALL send a Discord Webhook POST request with a rich Embed payload to the URL stored in the user's `NotificationSetting.discordWebhookUrl`.

#### Scenario: Discord Embed is sent with item details

- **WHEN** a new item passes the deduplication check and the user has a `discordWebhookUrl` configured
- **THEN** the system SHALL POST to `discordWebhookUrl` with a JSON payload containing an `embeds` array
- **AND** the embed `title` SHALL be the item name (truncated to 256 characters) and SHALL link to the item URL
- **AND** the embed SHALL include inline fields: platform label, price formatted as `NT$ {n:,}` (or `價格未知` if null), and matched keyword
- **AND** if `image_url` is non-null, the embed SHALL include a `thumbnail` with that URL

#### Scenario: Embed color reflects the platform

- **WHEN** the item platform is `shopee`
- **THEN** the embed `color` SHALL be `0xEE4D2D`
- **WHEN** the item platform is `ruten`
- **THEN** the embed `color` SHALL be `0x0066CC`

#### Scenario: User mention is included when discordUserId is set

- **WHEN** the user's `NotificationSetting.discordUserId` is non-null (e.g., `"123456789012345678"`)
- **THEN** the Discord message `content` field SHALL be `<@123456789012345678> 發現新商品！`
- **AND** only the user with that ID receives a Discord ping

#### Scenario: No mention when discordUserId is null

- **WHEN** the user's `NotificationSetting.discordUserId` is null or empty
- **THEN** the Discord message `content` field SHALL be `發現新商品！` with no `<@>` mention

---

### Requirement: Discord Webhook errors do not block the notify response

The system SHALL NOT propagate Discord Webhook HTTP errors to the Worker. If the Webhook call fails, the item is still recorded as seen and the API returns a success response.

#### Scenario: Non-2xx Discord Webhook response is logged and does not block

- **WHEN** the Discord Webhook POST returns a non-2xx HTTP status
- **THEN** the error SHALL be logged server-side
- **AND** the `POST /api/worker/notify` response SHALL still return HTTP 200
- **AND** the `SeenItem` row SHALL have already been inserted before the Webhook call

#### Scenario: Discord notification is skipped when no Webhook URL is configured

- **WHEN** a user's `NotificationSetting.discordWebhookUrl` is null
- **THEN** no HTTP request to Discord SHALL be made
- **AND** the system SHALL proceed to check Email notification settings
