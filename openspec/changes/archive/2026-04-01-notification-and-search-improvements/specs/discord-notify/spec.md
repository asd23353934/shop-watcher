## MODIFIED Requirements

### Requirement: New item triggers a Discord Embed notification via the user's Webhook URL

When new items pass deduplication in a batch, the system SHALL send one Discord Webhook POST request containing all new items as embeds (max 10 per call). If there are more than 10 new items, multiple Webhook calls SHALL be made in chunks of 10.

#### Scenario: Batch of new items produces Discord Embeds with seller name

- **WHEN** a batch of new items passes deduplication and the user has a `discordWebhookUrl` configured
- **THEN** the system SHALL POST to `discordWebhookUrl` with a JSON payload containing an `embeds` array of up to 10 embeds
- **AND** each embed `title` SHALL be the item name (truncated to 256 characters) and SHALL link to the item URL
- **AND** each embed SHALL include inline fields: platform label, price formatted as `NT$ {n:,}` (or `價格未知` if null), matched keyword, and seller name (or `未知` if null)
- **AND** if `image_url` is non-null, the embed SHALL include a `thumbnail` with that URL

#### Scenario: More than 10 new items are chunked into multiple Webhook calls

- **WHEN** a batch contains 15 new items and the user has a `discordWebhookUrl` configured
- **THEN** the system SHALL make 2 Webhook POST calls: one with 10 embeds and one with 5 embeds

#### Scenario: Embed color reflects the platform

- **WHEN** an item platform is `shopee`
- **THEN** the embed `color` SHALL be `0xEE4D2D`
- **WHEN** an item platform is `ruten`
- **THEN** the embed `color` SHALL be `0x0066CC`

#### Scenario: User mention is included when discordUserId is set

- **WHEN** the user's `NotificationSetting.discordUserId` is non-null
- **THEN** the Discord message `content` field SHALL be `<@{discordUserId}> 發現新商品！`

#### Scenario: No mention when discordUserId is null

- **WHEN** the user's `NotificationSetting.discordUserId` is null or empty
- **THEN** the Discord message `content` field SHALL be `發現新商品！` with no `<@>` mention

#### Scenario: Seller name is unknown

- **WHEN** an item `seller_name` is null
- **THEN** the seller embed field value SHALL be `未知`
