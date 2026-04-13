## ADDED Requirements

### Requirement: GET /api/keywords responds with cache headers

The API SHALL include a `Cache-Control: private, stale-while-revalidate=60` response header on all successful GET requests.

#### Scenario: Keywords API returns cache header

- **WHEN** an authenticated user calls `GET /api/keywords`
- **THEN** the response SHALL include `Cache-Control: private, stale-while-revalidate=60`
- **AND** the response body SHALL be unchanged from current behavior

### Requirement: Keyword userId query uses index

The database SHALL have a composite index on `Keyword(userId, createdAt DESC)` to support efficient retrieval of a user's keyword list sorted by creation time.

#### Scenario: Keywords list query uses index

- **WHEN** `GET /api/keywords` is called for a user with 50+ keywords
- **THEN** the query SHALL resolve via the `(userId, createdAt)` index without a full table scan
- **AND** response time SHALL be under 300ms for tables with up to 10,000 Keyword rows
