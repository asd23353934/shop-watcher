## ADDED Requirements

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

- **WHEN** a user submits a `discordWebhookUrl` that does not start with `https://discord.com/api/webhooks/`
- **THEN** the API SHALL return a validation error
- **AND** the `NotificationSetting` row SHALL NOT be updated

---

### Requirement: User can save Email notification settings

The system SHALL allow an authenticated user to save an email address for Resend Email notifications.

#### Scenario: User saves a valid email address

- **WHEN** a user submits the notification settings form with a valid email address in `emailAddress`
- **THEN** the `NotificationSetting.emailAddress` field SHALL be updated
- **AND** subsequent item notifications SHALL trigger an email to that address

#### Scenario: User clears email address to disable email notifications

- **WHEN** a user submits with an empty `emailAddress` field
- **THEN** `NotificationSetting.emailAddress` SHALL be set to `null`
- **AND** no email notifications SHALL be sent for that user

#### Scenario: Invalid email format is rejected

- **WHEN** a user submits an `emailAddress` value that is not a valid email format
- **THEN** the API SHALL return a validation error
- **AND** the `NotificationSetting` row SHALL NOT be updated

---

### Requirement: Notification settings are isolated per user

The system SHALL ensure each user's notification settings are private and cannot be read or modified by other users.

#### Scenario: Settings page shows only the authenticated user's settings

- **WHEN** an authenticated user navigates to `/settings`
- **THEN** only the `NotificationSetting` row where `userId` matches the session user SHALL be loaded
- **AND** other users' webhook URLs or email addresses SHALL NOT be exposed

#### Scenario: Settings are pre-filled with existing values on load

- **WHEN** a user opens `/settings` and already has a `NotificationSetting` record
- **THEN** the form fields SHALL be pre-populated with the stored values
- **AND** the user SHALL be able to update individual fields without re-entering all values
