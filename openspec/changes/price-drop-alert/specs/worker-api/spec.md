## MODIFIED Requirements

### Requirement: POST /api/worker/notify receives a scraped item and triggers deduplication and notifications

The system SHALL expose a POST /api/worker/notify endpoint. Upon receiving a valid item payload, the system SHALL check for duplicates, record new items, and dispatch notifications (Discord and/or Email) as configured for the associated user. For already-seen items, the system SHALL additionally check for price drops and re-notify if the current price is lower than the last known price.

#### Scenario: New item is recorded and notifications are triggered

- **WHEN** the Worker calls POST /api/worker/notify with a valid payload containing keyword_id, platform, item_id, name, price, url, image_url
- **THEN** the system SHALL check SeenItem for (userId, platform, item_id) uniqueness
- **AND** if not seen before, a new SeenItem row SHALL be inserted with lastPrice set to the item's price
- **AND** Discord notification SHALL be dispatched if discordWebhookUrl is configured for the keyword's owner
- **AND** Email notification SHALL be dispatched if emailAddress is configured for the keyword's owner
- **AND** the response SHALL be HTTP 200 with { "status": "new", "notified": true }

#### Scenario: Already-seen item with price drop triggers re-notification

- **WHEN** the Worker calls POST /api/worker/notify with an item whose (userId, platform, item_id) already exists in SeenItem
- **AND** the new price is non-null and lower than SeenItem.lastPrice
- **THEN** SeenItem.lastPrice SHALL be updated to the new price
- **AND** a price drop notification SHALL be dispatched with isPriceDrop flag and originalPrice
- **AND** the response SHALL be HTTP 200 with { "status": "price_drop", "notified": true }

#### Scenario: Already-seen item is silently skipped

- **WHEN** the Worker calls POST /api/worker/notify with an item whose (userId, platform, item_id) already exists in SeenItem
- **AND** the price has not dropped or is null
- **THEN** no new SeenItem row SHALL be inserted
- **AND** no Discord or Email notification SHALL be sent
- **AND** the response SHALL be HTTP 200 with { "status": "duplicate" }

#### Scenario: Invalid payload returns 400

- **WHEN** the Worker calls POST /api/worker/notify with a missing keyword_id or item_id
- **THEN** the response SHALL be HTTP 400 with a descriptive error message

#### Scenario: Unknown keyword_id returns 404

- **WHEN** the Worker calls POST /api/worker/notify with a keyword_id that does not exist in the database
- **THEN** the response SHALL be HTTP 404
- **AND** no notification SHALL be sent

#### Scenario: Missing Authorization header returns 401

- **WHEN** a request is made to POST /api/worker/notify without an Authorization header
- **THEN** the response SHALL be HTTP 401
