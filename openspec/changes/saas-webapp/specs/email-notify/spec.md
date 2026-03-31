## ADDED Requirements

### Requirement: New item triggers an Email notification via Resend

When a new item passes deduplication, the system SHALL send an HTML Email to the address stored in the user's `NotificationSetting.emailAddress` using the Resend SDK.

#### Scenario: Email is sent with item details

- **WHEN** a new item passes the deduplication check and the user has an `emailAddress` configured
- **THEN** the system SHALL call `resend.emails.send()` with:
  - `to`: the user's `emailAddress`
  - `from`: the configured sender address (e.g., `noreply@shopwatcher.app`)
  - `subject`: `[Shop Watcher] 發現新商品：{item name}`
  - `html`: an HTML body containing the item name, platform, price, URL, and image (if available)

#### Scenario: Email subject shows item name truncated to 60 characters

- **WHEN** an item name exceeds 60 characters
- **THEN** the email `subject` SHALL truncate the name and append `...`

#### Scenario: Email is skipped when no email address is configured

- **WHEN** a user's `NotificationSetting.emailAddress` is null
- **THEN** no Resend API call SHALL be made for that user
- **AND** the `POST /api/worker/notify` response SHALL not be affected

---

### Requirement: Resend API errors do not block the notify response

The system SHALL NOT propagate Resend API errors to the Worker. If the email send fails, the item is still recorded as seen and the API returns a success response.

#### Scenario: Resend API error is logged and does not block

- **WHEN** the Resend SDK call returns an error (network error or API error)
- **THEN** the error SHALL be logged server-side with the item ID and user ID
- **AND** the `POST /api/worker/notify` response SHALL still return HTTP 200
- **AND** the `SeenItem` row SHALL have already been inserted before the email send attempt

---

### Requirement: Sender email address is configurable via environment variable

The system SHALL read the email sender address from the `RESEND_FROM_EMAIL` environment variable.

#### Scenario: RESEND_FROM_EMAIL is used as the sender address

- **WHEN** `RESEND_FROM_EMAIL=noreply@shopwatcher.app` is set
- **THEN** all outgoing emails SHALL use `noreply@shopwatcher.app` as the `from` address

#### Scenario: Missing RESEND_FROM_EMAIL causes a startup configuration error

- **WHEN** `RESEND_FROM_EMAIL` is not set and an email send is attempted
- **THEN** the system SHALL log an error `RESEND_FROM_EMAIL is not configured`
- **AND** the email SHALL NOT be sent
