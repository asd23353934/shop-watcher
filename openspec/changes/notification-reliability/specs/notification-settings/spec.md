## ADDED Requirements

### Requirement: User can test Discord Webhook URL before saving

The settings page SHALL provide a "Test Webhook" button that sends a test Discord message to the configured Webhook URL and displays success or failure to the user.

#### Scenario: Valid Webhook URL sends test message successfully

- **WHEN** a user clicks the "Test Webhook" button with a valid Discord Webhook URL entered
- **THEN** the system SHALL POST to `POST /api/settings/test-webhook` with the webhookUrl
- **AND** the endpoint SHALL send a test Discord Embed to that URL
- **AND** if Discord returns 2xx, the UI SHALL display a success indicator

#### Scenario: Invalid Webhook URL returns error to user

- **WHEN** a user clicks the "Test Webhook" button and Discord returns a non-2xx status
- **THEN** the UI SHALL display an error message with the status code
- **AND** the NotificationSetting record SHALL NOT be modified by the test action
