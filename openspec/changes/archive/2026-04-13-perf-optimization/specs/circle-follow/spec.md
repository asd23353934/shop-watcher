## ADDED Requirements

### Requirement: GET /api/circles responds with cache headers

The API SHALL include a `Cache-Control: private, stale-while-revalidate=60` response header on all successful GET requests.

#### Scenario: Circles API returns cache header

- **WHEN** an authenticated user calls `GET /api/circles`
- **THEN** the response SHALL include `Cache-Control: private, stale-while-revalidate=60`
- **AND** the response body SHALL be unchanged from current behavior

### Requirement: CircleFollow userId query uses index

The database SHALL have a composite index on `CircleFollow(userId, createdAt DESC)` to support efficient retrieval of a user's followed circles sorted by creation time.

#### Scenario: Circle follows list query uses index

- **WHEN** `GET /api/circles` is called for a user with multiple circle follows
- **THEN** the query SHALL resolve via the `(userId, createdAt)` index without a full table scan
- **AND** response time SHALL be under 300ms for tables with up to 10,000 CircleFollow rows
