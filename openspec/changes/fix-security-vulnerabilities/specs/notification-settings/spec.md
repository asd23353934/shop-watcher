## MODIFIED Requirements

### Requirement: User can save Discord notification settings

The system SHALL allow an authenticated user to save a Discord Webhook URL and an optional Discord User ID to their `NotificationSetting` record.

#### Scenario: User saves Discord Webhook URL and User ID

- **WHEN** a user submits the notification settings form with a valid Discord Webhook URL
- **THEN** the `NotificationSetting` row SHALL be created or updated (upsert) with `discordWebhookUrl` and `discordUserId`
- **AND** a success message SHALL be displayed to the user

#### Scenario: User saves settings without Discord User ID

- **WHEN** a user submits with a Webhook URL but leaves Discord User ID empty
- **THEN** `discordUserId` SHALL be stored as `null`
- **AND** Discord notifications SHALL be sent without a user mention

#### Scenario: Invalid Discord Webhook URL is rejected

- **WHEN** a user submits a `discordWebhookUrl` that does not pass `isValidDiscordWebhookUrl()` validation (i.e., hostname is not exactly `discord.com`, protocol is not `https:`, path does not start with `/api/webhooks/`, or URL resolves to a private IP range)
- **THEN** the API SHALL return a 400 validation error
- **AND** the `NotificationSetting` row SHALL NOT be updated
