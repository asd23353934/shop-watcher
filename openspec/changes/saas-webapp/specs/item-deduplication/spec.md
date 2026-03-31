## ADDED Requirements

### Requirement: SeenItem table records notified items with user, platform, and item_id as unique key

The system SHALL maintain a `SeenItem` table in PostgreSQL. Each row records a unique combination of `(userId, platform, itemId)`. A `SeenItem` row is only created when a new item passes the deduplication check.

#### Scenario: SeenItem row is created for a first-time item

- **WHEN** `POST /api/worker/notify` is called with an item whose `(userId, platform, itemId)` does not exist in `SeenItem`
- **THEN** a new `SeenItem` row SHALL be inserted with `userId`, `platform`, `itemId`, `keyword` (the matched keyword text), and `firstSeen` (current UTC timestamp)

#### Scenario: SeenItem unique constraint prevents duplicate rows

- **WHEN** `POST /api/worker/notify` is called a second time with the same `(userId, platform, itemId)`
- **THEN** the Prisma upsert or unique check SHALL detect the conflict
- **AND** no duplicate `SeenItem` row SHALL be inserted
- **AND** the response SHALL return `{ "status": "duplicate" }`

---

### Requirement: Deduplication is scoped per user

The system SHALL allow different users to be notified of the same item. A `SeenItem` row blocks notifications only for the specific user who already received it.

#### Scenario: Same item can be notified to two different users

- **WHEN** User A and User B both have a keyword matching the same item on Shopee
- **THEN** User A SHALL receive a notification if `(userA_id, "shopee", itemId)` is not in `SeenItem`
- **AND** User B SHALL also receive a notification if `(userB_id, "shopee", itemId)` is not in `SeenItem`
- **AND** the presence of a `SeenItem` row for User A SHALL NOT block User B's notification

---

### Requirement: SeenItem rows are preserved after a keyword is deleted

The system SHALL retain `SeenItem` rows even when the corresponding `Keyword` is deleted, to prevent re-notification if the keyword is re-created.

#### Scenario: Deleting a keyword does not delete its SeenItem history

- **WHEN** a user deletes a `Keyword` row
- **THEN** all `SeenItem` rows associated with that user and the keyword text SHALL remain in the database
- **AND** if the same keyword is re-created, previously seen items SHALL be treated as duplicates and SHALL NOT trigger new notifications
