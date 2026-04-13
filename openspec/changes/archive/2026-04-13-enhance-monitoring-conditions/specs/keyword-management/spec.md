## ADDED Requirements

### Requirement: Keyword creation accepts sellerBlocklist, discordWebhookUrl, and maxNotifyPerScan

The system SHALL accept `sellerBlocklist` (string array, default `[]`), `discordWebhookUrl` (string or null, default null), and `maxNotifyPerScan` (positive integer or null, default null) in `POST /api/keywords` and store them in the database. `discordWebhookUrl` MUST start with `https://discord.com/api/webhooks/` if non-null. `maxNotifyPerScan` MUST be a positive integer (≥ 1) if non-null.

#### Scenario: Keyword created with all three new fields

- **WHEN** a user submits `POST /api/keywords` with `{ "sellerBlocklist": ["黃牛"], "discordWebhookUrl": "https://discord.com/api/webhooks/1/x", "maxNotifyPerScan": 5 }`
- **THEN** the `Keyword` row SHALL be created with all three fields stored correctly

#### Scenario: Invalid discordWebhookUrl is rejected at creation

- **WHEN** a user submits `POST /api/keywords` with `{ "discordWebhookUrl": "https://example.com/hook" }`
- **THEN** the API SHALL return HTTP 400
- **AND** no `Keyword` row SHALL be created

#### Scenario: maxNotifyPerScan of zero is rejected

- **WHEN** a user submits `POST /api/keywords` with `{ "maxNotifyPerScan": 0 }`
- **THEN** the API SHALL return HTTP 400

#### Scenario: Omitting new fields uses defaults

- **WHEN** a user submits keyword creation without `sellerBlocklist`, `discordWebhookUrl`, or `maxNotifyPerScan`
- **THEN** the `Keyword` row SHALL be created with `sellerBlocklist: []`, `discordWebhookUrl: null`, `maxNotifyPerScan: null`

---

### Requirement: Keyword edit accepts sellerBlocklist, discordWebhookUrl, and maxNotifyPerScan

The system SHALL accept `sellerBlocklist`, `discordWebhookUrl`, and `maxNotifyPerScan` in `PATCH /api/keywords/[id]` and update all provided fields. The same validation rules as creation apply.

#### Scenario: User updates all three fields via PATCH

- **WHEN** a user calls `PATCH /api/keywords/{id}` with `{ "sellerBlocklist": ["BadCircle"], "discordWebhookUrl": "https://discord.com/api/webhooks/2/y", "maxNotifyPerScan": 3 }`
- **THEN** all three fields SHALL be updated in the `Keyword` row

#### Scenario: User clears discordWebhookUrl via PATCH

- **WHEN** a user calls `PATCH /api/keywords/{id}` with `{ "discordWebhookUrl": null }`
- **THEN** `Keyword.discordWebhookUrl` SHALL be set to null
- **AND** subsequent notifications for that keyword SHALL fall back to the global webhook

---

### Requirement: Worker keywords API includes new fields in response

The system SHALL include `sellerBlocklist`, `discordWebhookUrl`, and `maxNotifyPerScan` in the `GET /api/worker/keywords` response payload for each keyword.

#### Scenario: GET /api/worker/keywords returns all new fields

- **WHEN** the Worker calls `GET /api/worker/keywords`
- **THEN** each keyword object SHALL include `sellerBlocklist` (array), `discordWebhookUrl` (string or null), and `maxNotifyPerScan` (integer or null)
- **AND** the Worker SHALL use these values when calling `POST /api/worker/notify/batch`
