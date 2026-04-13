## ADDED Requirements

### Requirement: Email subject line is sanitized to prevent header injection

Before constructing the email subject string, the system SHALL strip all CR (`\r`), LF (`\n`), and horizontal tab (`\t`) characters from any user-derived content included in the subject. The sanitization SHALL occur in `webapp/lib/email.ts` before the subject string is passed to the Resend SDK.

#### Scenario: Subject with injected CRLF is sanitized

- **WHEN** an item name contains the string `"商品名稱\r\nBcc: attacker@evil.com"`
- **THEN** the resulting email subject SHALL be `"[Shop Watcher] 商品名稱 Bcc: attacker@evil.com"` (with `\r\n` replaced by a space or removed)
- **AND** no additional `Bcc` header SHALL appear in the outgoing SMTP message

#### Scenario: Subject without control characters is unchanged

- **WHEN** an item name is `"初音ミク フィギュア 限定版"`
- **THEN** the email subject SHALL be `"[Shop Watcher] 初音ミク フィギュア 限定版"` unchanged

### Requirement: Item image URLs in email are HTTPS-only

The system SHALL only include item thumbnail images in email bodies when the `image_url` field uses the `https://` scheme. Images with `http://` scheme or private IP addresses SHALL be omitted from the email HTML to prevent mixed-content and SSRF risks in email clients.

#### Scenario: HTTPS image URL is shown in email

- **WHEN** an item has `image_url: "https://cdn.example.com/img.jpg"`
- **THEN** the email table row SHALL include an `<img>` tag with that URL

#### Scenario: HTTP image URL is omitted from email

- **WHEN** an item has `image_url: "http://cdn.example.com/img.jpg"`
- **THEN** the email table row SHALL NOT include any `<img>` tag for that item
- **AND** the row SHALL still appear in the table without an image
