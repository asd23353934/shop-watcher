## ADDED Requirements

### Requirement: Worker executes a canary keyword scan for each platform once per scan cycle

The Worker SHALL maintain a static dictionary `CANARY_KEYWORDS` in `src/canary.py` mapping each supported platform identifier to a single high-traffic keyword that is expected to produce at least one result under normal conditions. After completing the user-facing scan cycle in `run_scan_cycle()`, the Worker SHALL execute one canary scrape per platform using that keyword. Canary scrapes SHALL NOT write to `SeenItem`, SHALL NOT trigger user notifications, and SHALL NOT count toward any user's keyword quota.

#### Scenario: Canary runs once per platform per cycle

- **WHEN** `run_scan_cycle()` completes all user keyword scans
- **THEN** the Worker SHALL iterate every platform in `CANARY_KEYWORDS`
- **AND** invoke the platform's `scrape_<platform>()` with the canary keyword exactly once
- **AND** SHALL NOT persist any returned items to `SeenItem`

#### Scenario: Canary scrape failure does not raise

- **WHEN** a canary scrape for platform `booth` raises an exception
- **THEN** the Worker SHALL log the exception and treat the run as `itemCount = 0, domIntact = false`
- **AND** SHALL continue executing canary for remaining platforms
- **AND** the main scan cycle SHALL be reported as completed normally

### Requirement: Worker reports canary results via dedicated API endpoint

The Worker SHALL report canary results via `PATCH /api/worker/canary-status` authenticated with `Authorization: Bearer <WORKER_SECRET>`. The request body SHALL contain a list of records, each with fields: `platform` (string), `itemCount` (integer, 0 or greater), `domIntact` (boolean), `ranAt` (ISO 8601 timestamp). The API SHALL upsert a `PlatformCanaryStatus` row per platform.

#### Scenario: Valid canary report upserts status row

- **WHEN** the Worker calls `PATCH /api/worker/canary-status` with a valid Bearer token and a record for platform `ruten` with `itemCount=12, domIntact=true`
- **THEN** the API SHALL upsert the `PlatformCanaryStatus` row for `ruten`
- **AND** SHALL update `lastRunAt`, `itemCount`, and `domIntact` fields
- **AND** SHALL return HTTP 200

#### Scenario: Missing or invalid Worker secret is rejected

- **WHEN** `PATCH /api/worker/canary-status` is called without a valid `Authorization: Bearer <WORKER_SECRET>` header
- **THEN** the API SHALL return HTTP 401
- **AND** no database write SHALL occur

#### Scenario: Malformed payload is rejected

- **WHEN** the request body is missing a required field (e.g., `domIntact` omitted)
- **THEN** the API SHALL return HTTP 400 with `{ error: string }`
- **AND** no database write SHALL occur

### Requirement: PlatformCanaryStatus tracks per-platform canary health

The `PlatformCanaryStatus` Prisma model SHALL define: `platform` (unique string, primary identifier), `lastRunAt` (datetime, nullable), `itemCount` (integer, default 0), `domIntact` (boolean, default true), `consecutiveEmptyCount` (integer, default 0), `healthState` (string enum `healthy` or `unhealthy`, default `healthy`), `unhealthyReason` (string, nullable; one of `empty_canary`, `dom_broken`, or `null` when healthy), `createdAt` and `updatedAt` timestamps.

#### Scenario: First successful canary initializes record

- **WHEN** no `PlatformCanaryStatus` row exists for platform `ruten`
- **AND** the API receives a canary report with `itemCount=8, domIntact=true`
- **THEN** a new row SHALL be created with `consecutiveEmptyCount=0`, `healthState=healthy`, `unhealthyReason=null`

#### Scenario: Zero-item canary increments consecutiveEmptyCount

- **WHEN** a canary report arrives for platform `booth` with `itemCount=0, domIntact=true`
- **AND** the existing row has `consecutiveEmptyCount=1`
- **THEN** after upsert, `consecutiveEmptyCount` SHALL be `2`

#### Scenario: Nonzero-item canary resets consecutiveEmptyCount

- **WHEN** a canary report arrives for platform `booth` with `itemCount=5, domIntact=true`
- **AND** the existing row has `consecutiveEmptyCount=3`
- **THEN** after upsert, `consecutiveEmptyCount` SHALL be reset to `0`

### Requirement: API updates healthState based on canary and DOM signals

The API handler for `PATCH /api/worker/canary-status` SHALL compute `healthState` after upserting each platform's row using these rules: if `domIntact == false` then `healthState = unhealthy` with `unhealthyReason = dom_broken`; else if `consecutiveEmptyCount >= 2` then `healthState = unhealthy` with `unhealthyReason = empty_canary`; else `healthState = healthy` with `unhealthyReason = null`. The API SHALL NOT send any external notification (Discord, Email, or webhook) regardless of state transitions.

#### Scenario: DOM broken immediately transitions to unhealthy

- **WHEN** a canary report arrives for platform `ruten` with `domIntact=false`
- **THEN** after upsert, `healthState` SHALL be `unhealthy`
- **AND** `unhealthyReason` SHALL be `dom_broken`

#### Scenario: Two consecutive empty canaries transition to unhealthy

- **WHEN** a canary report arrives for platform `booth` with `itemCount=0, domIntact=true`
- **AND** the upsert results in `consecutiveEmptyCount=2`
- **THEN** `healthState` SHALL be `unhealthy`
- **AND** `unhealthyReason` SHALL be `empty_canary`

#### Scenario: Single empty canary does not transition to unhealthy

- **WHEN** a canary report arrives for platform `dlsite` with `itemCount=0, domIntact=true`
- **AND** the upsert results in `consecutiveEmptyCount=1`
- **THEN** `healthState` SHALL remain `healthy`

#### Scenario: Recovery to healthy clears unhealthyReason

- **WHEN** a canary report arrives for platform `mandarake` with `itemCount=7, domIntact=true`
- **AND** the previous row had `healthState=unhealthy`
- **THEN** after upsert, `healthState` SHALL be `healthy`
- **AND** `unhealthyReason` SHALL be `null`

#### Scenario: API does not send external notifications

- **WHEN** any state transition occurs (healthy→unhealthy or unhealthy→healthy)
- **THEN** the API SHALL NOT call `SYSTEM_ALERT_WEBHOOK`, Email, or any other external notification channel
- **AND** SHALL only persist the updated row

### Requirement: GET /api/platform-status returns canary healthState for authenticated users

The existing `GET /api/platform-status` endpoint SHALL include, for each platform in its response, the canary `healthState`, `unhealthyReason`, and `lastRunAt` fields sourced from `PlatformCanaryStatus` (joined by `platform` identifier). Platforms without a `PlatformCanaryStatus` row SHALL report `canaryHealthState=healthy, canaryUnhealthyReason=null, canaryLastRunAt=null`.

#### Scenario: Response includes canary fields for each platform

- **WHEN** an authenticated user calls `GET /api/platform-status`
- **THEN** each platform entry SHALL include `canaryHealthState`, `canaryUnhealthyReason`, `canaryLastRunAt`
- **AND** the fields SHALL reflect the current `PlatformCanaryStatus` row

#### Scenario: Platform with no canary record reports healthy default

- **WHEN** a platform has no `PlatformCanaryStatus` row (e.g., new platform not yet scanned)
- **THEN** the response SHALL report `canaryHealthState=healthy`, `canaryUnhealthyReason=null`, `canaryLastRunAt=null`

### Requirement: Canary keyword list is maintained as a Python constant

The `CANARY_KEYWORDS` dictionary SHALL be defined in `src/canary.py` and SHALL cover every platform that has a user-facing keyword search scraper. Adding a new search scraper to the project SHALL require adding an entry to `CANARY_KEYWORDS`.

#### Scenario: Every active search scraper has a canary entry

- **WHEN** the Worker starts and imports `CANARY_KEYWORDS`
- **THEN** every platform identifier used by `run_scan_cycle()` for keyword search SHALL have a corresponding entry in `CANARY_KEYWORDS`

#### Scenario: Circle-follow platforms are excluded from canary

- **WHEN** a platform is used only for `CircleFollow` tracking (not keyword search)
- **THEN** the platform SHALL NOT appear in `CANARY_KEYWORDS`
- **AND** SHALL NOT be scanned by canary logic
