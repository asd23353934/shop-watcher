## MODIFIED Requirements

### Requirement: SeenItem table records notified items with user, platform, and item_id as unique key

The system SHALL maintain a SeenItem table in PostgreSQL. Each row records a unique combination of (userId, platform, itemId) along with the last known price. A SeenItem row is created when a new item is first seen, and updated when the item's price changes downward.

#### Scenario: SeenItem row is created for a first-time item

- **WHEN** POST /api/worker/notify/batch is called with an item whose (userId, platform, itemId) does not exist in SeenItem
- **THEN** a new SeenItem row SHALL be inserted with userId, platform, itemId, keyword, firstSeen (current UTC timestamp), and lastPrice (the item's current price or null)

#### Scenario: SeenItem unique constraint prevents duplicate rows for same price

- **WHEN** POST /api/worker/notify/batch is called with an item that already exists in SeenItem and the price has not dropped
- **THEN** no new SeenItem row SHALL be inserted
- **AND** the response SHALL count the item as duplicate

#### Scenario: SeenItem lastPrice is updated on price drop

- **WHEN** POST /api/worker/notify/batch is called with an item that already exists in SeenItem
- **AND** the new price is lower than SeenItem.lastPrice
- **THEN** SeenItem.lastPrice SHALL be updated to the new price
- **AND** the item SHALL be treated as a notification-worthy event (price drop)
