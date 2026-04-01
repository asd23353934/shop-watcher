## ADDED Requirements

### Requirement: Worker records scan completion time to API

After each scan cycle completes, the Worker SHALL POST to /api/worker/scan-log to record the scan completion timestamp. The Dashboard SHALL display the last scan time.

#### Scenario: Worker posts scan log after cycle

- **WHEN** run_scan_cycle() completes (with or without found items)
- **THEN** the Worker SHALL call POST /api/worker/scan-log with { scannedAt: ISO8601 }
- **AND** the server SHALL upsert a ScanLog row using a fixed global record identifier

#### Scenario: Dashboard shows last scan time

- **WHEN** an authenticated user views the dashboard
- **THEN** the page SHALL display the most recent scan completion time from ScanLog
- **AND** if no ScanLog exists, the dashboard SHALL display "尚未掃描"
