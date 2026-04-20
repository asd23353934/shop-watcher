## ADDED Requirements

### Requirement: History API cursor parameter is validated as CUID format

The `GET /api/history` endpoint SHALL validate the `cursor` query parameter when present. A valid cursor MUST match the pattern `/^c[a-z0-9]{24}$/` (CUID format used by Prisma). If the cursor fails validation, the API SHALL return HTTP 400 and SHALL NOT forward the malformed value to Prisma.

#### Scenario: Valid CUID cursor is accepted

- **WHEN** `GET /api/history?cursor=cld3h2v8f0000qw4k3j5m8n9p` is called (cursor matches CUID pattern)
- **THEN** the API SHALL accept the cursor and return the next page of results

#### Scenario: Malformed cursor is rejected with 400

- **WHEN** `GET /api/history?cursor=../../etc/passwd` is called
- **THEN** the API SHALL return HTTP 400 with `{ "error": "無效的 cursor 格式" }`
- **AND** no Prisma query SHALL be executed with that cursor value

#### Scenario: Empty cursor query parameter behaves as no cursor

- **WHEN** `GET /api/history?cursor=` is called with an empty string
- **THEN** the API SHALL treat it as if no cursor was provided
- **AND** return the first page of results
