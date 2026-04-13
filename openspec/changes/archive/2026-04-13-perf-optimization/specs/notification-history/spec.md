## ADDED Requirements

### Requirement: GET /api/history responds with cache headers

The API SHALL include a `Cache-Control: private, stale-while-revalidate=60` response header on all successful GET requests. This allows the browser to serve a stale response immediately while revalidating in the background, reducing duplicate TTFB on repeated navigation.

#### Scenario: History API returns cache header

- **WHEN** an authenticated user calls `GET /api/history`
- **THEN** the response SHALL include `Cache-Control: private, stale-while-revalidate=60`
- **AND** the response body SHALL be unchanged from current behavior

### Requirement: SeenItem platform filter query uses index

The database SHALL have a composite index on `SeenItem(userId, platform, firstSeen DESC)` to support efficient filtering when a user queries history by platform.

#### Scenario: Platform-filtered history query uses index

- **WHEN** `GET /api/history?platform=booth` is called
- **THEN** the query SHALL resolve via the `(userId, platform, firstSeen)` index without a full table scan
- **AND** response time SHALL be under 500ms for tables with up to 100,000 SeenItem rows
