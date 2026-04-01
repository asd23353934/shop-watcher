## ADDED Requirements

### Requirement: Expired SeenItem rows are deleted daily

The system SHALL run a daily cleanup job that deletes SeenItem rows older than SEEN_ITEM_RETENTION_DAYS (default 30 days).

#### Scenario: Old SeenItems are deleted

- **WHEN** the cleanup job runs
- **THEN** all SeenItem rows where firstSeen < (now - SEEN_ITEM_RETENTION_DAYS) SHALL be deleted
- **AND** SeenItem rows within the retention period SHALL NOT be deleted

#### Scenario: Cleanup job outputs deletion count

- **WHEN** the cleanup job completes successfully
- **THEN** the job SHALL output the number of deleted SeenItem rows to stdout

### Requirement: Expired ScanLog rows are deleted daily

The system SHALL delete ScanLog rows older than SCAN_LOG_RETENTION_DAYS (default 7 days) during the daily cleanup job.

#### Scenario: Old ScanLogs are deleted

- **WHEN** the cleanup job runs
- **THEN** all ScanLog rows where scannedAt < (now - SCAN_LOG_RETENTION_DAYS) SHALL be deleted
- **AND** ScanLog rows within the retention period SHALL NOT be deleted
