## ADDED Requirements

### Requirement: Dashboard warns user when no notification method is configured

The system SHALL display a warning banner on the dashboard when the authenticated user has neither a Discord Webhook URL nor a notification email configured. The banner SHALL link to the settings page and SHALL NOT block keyword creation.

#### Scenario: User with no notification settings sees warning banner

- **WHEN** an authenticated user navigates to `/dashboard`
- **AND** that user's `NotificationSetting` has both `discordWebhookUrl` as null and `notifyEmail` as null
- **THEN** the dashboard SHALL display a warning banner above the keyword form
- **AND** the banner SHALL contain a link to `/settings`
- **AND** the keyword creation form SHALL still be accessible and functional

#### Scenario: User with Discord webhook configured does not see warning banner

- **WHEN** an authenticated user navigates to `/dashboard`
- **AND** that user's `NotificationSetting` has a non-null `discordWebhookUrl`
- **THEN** the dashboard SHALL NOT display the notification warning banner

#### Scenario: User with only email configured does not see warning banner

- **WHEN** an authenticated user navigates to `/dashboard`
- **AND** that user's `NotificationSetting` has a non-null `notifyEmail`
- **THEN** the dashboard SHALL NOT display the notification warning banner

#### Scenario: User with no NotificationSetting record sees warning banner

- **WHEN** an authenticated user navigates to `/dashboard`
- **AND** no `NotificationSetting` row exists for that user
- **THEN** the dashboard SHALL display the notification warning banner
- **AND** the banner SHALL contain a link to `/settings`
