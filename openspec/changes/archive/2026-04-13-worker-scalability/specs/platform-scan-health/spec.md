## ADDED Requirements

### Requirement: Worker records per-platform scan health status after each scan cycle

The system SHALL upsert a `PlatformScanStatus` record for each platform at the end of each scan cycle via `PATCH /api/worker/platform-status`. Each record SHALL store: `platform` (unique string identifier), `userId` (associated user), `lastSuccess` (datetime of last successful scan, nullable), `lastError` (last error message string, nullable), `failCount` (consecutive failure count, reset to 0 on success).

#### Scenario: Successful platform scan updates lastSuccess and resets failCount

- **WHEN** all keyword scans for platform `ruten` complete without exceptions in a cycle
- **THEN** `PlatformScanStatus.lastSuccess` for `ruten` SHALL be updated to the current timestamp
- **AND** `PlatformScanStatus.failCount` for `ruten` SHALL be reset to `0`
- **AND** `PlatformScanStatus.lastError` SHALL be set to `null`

#### Scenario: Failed platform scan increments failCount and records error

- **WHEN** one or more keyword scans for platform `booth` raise exceptions in a cycle
- **THEN** `PlatformScanStatus.failCount` for `booth` SHALL be incremented by 1
- **AND** `PlatformScanStatus.lastError` SHALL be set to the most recent exception message
- **AND** `PlatformScanStatus.lastSuccess` SHALL remain unchanged

#### Scenario: Platform status is upserted, not appended

- **WHEN** `PATCH /api/worker/platform-status` is called for platform `dlsite`
- **AND** a `PlatformScanStatus` row for `dlsite` already exists
- **THEN** the existing row SHALL be updated (upsert)
- **AND** no duplicate rows SHALL be created

#### Scenario: Worker platform-status API requires WORKER_SECRET authentication

- **WHEN** `PATCH /api/worker/platform-status` is called without a valid `Authorization: Bearer <WORKER_SECRET>` header
- **THEN** the API SHALL return HTTP 401
- **AND** no database write SHALL occur

---

### Requirement: Dashboard displays per-platform scan health status

The system SHALL display a platform health section on the Dashboard page (`/`) showing each platform's `lastSuccess` timestamp (formatted as relative time, e.g., "3 分鐘前") and `failCount`. Platforms with `failCount >= 3` SHALL be displayed with a visual warning indicator.

#### Scenario: Dashboard shows last success time for each platform

- **WHEN** an authenticated user navigates to the Dashboard
- **AND** `PlatformScanStatus` records exist for platforms `ruten`, `booth`, `dlsite`
- **THEN** each platform SHALL display its `lastSuccess` as a relative time string (e.g., "5 分鐘前")

#### Scenario: Dashboard shows warning indicator for platforms with failCount >= 3

- **WHEN** a platform's `PlatformScanStatus.failCount` is `3` or greater
- **THEN** the platform row SHALL display a visual warning indicator (e.g., orange or red badge)
- **AND** the `lastError` message SHALL be shown in a tooltip or expandable section

#### Scenario: Dashboard shows no data state for platform with no scan record

- **WHEN** a platform has no `PlatformScanStatus` record (e.g., newly added platform)
- **THEN** the platform row SHALL display "尚無掃描記錄" instead of a timestamp

#### Scenario: Platform health data is fetched from dedicated API endpoint

- **WHEN** the Dashboard page loads
- **THEN** it SHALL call `GET /api/platform-status` to retrieve platform health records
- **AND** the response SHALL include all `PlatformScanStatus` records for the authenticated user
