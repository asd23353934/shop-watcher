## ADDED Requirements

### Requirement: PlatformScanStatus userId query uses index

The database SHALL have an index on `PlatformScanStatus(userId)` to support efficient retrieval of a user's platform scan statuses on the /status page.

#### Scenario: Status page query uses index

- **WHEN** an authenticated user navigates to `/status`
- **THEN** the `platformScanStatus.findMany({ where: { userId } })` query SHALL resolve via the `userId` index
- **AND** the /status page SHALL render within 500ms after the database query completes
