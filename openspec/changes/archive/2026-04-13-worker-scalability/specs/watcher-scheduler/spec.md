## MODIFIED Requirements

### Requirement: Scheduler runs all keyword searches on a configurable interval

The system SHALL execute all keyword×platform search tasks concurrently using `asyncio.gather(return_exceptions=True)`, replacing the previous sequential nested loop. A per-platform `asyncio.Semaphore` SHALL limit concurrent connections per platform to `SEMAPHORE_PER_PLATFORM` (default: `3`). A failure in one keyword-platform task MUST NOT prevent other tasks from executing. The entire task batch SHALL be protected by `asyncio.wait_for(timeout=SCAN_TIMEOUT_SECONDS)`.

#### Scenario: Each keyword-platform pair is searched independently

- **WHEN** a keyword has platforms `["shopee", "ruten"]`
- **THEN** the scheduler SHALL submit `ShopeeWatcher.search(keyword)` and `RutenWatcher.search(keyword)` as concurrent async tasks
- **AND** a failure on one platform MUST NOT prevent the other platform from being searched

#### Scenario: All keyword-platform tasks are gathered concurrently

- **WHEN** a scan cycle begins with N keywords across M platforms
- **THEN** all N×M tasks SHALL be submitted to `asyncio.gather()` simultaneously
- **AND** per-platform Semaphore SHALL limit each platform to at most `SEMAPHORE_PER_PLATFORM` concurrent tasks

#### Scenario: Scheduler sleeps between scans

- **WHEN** a full scan cycle completes (or times out)
- **THEN** the scheduler SHALL sleep for exactly `CHECK_INTERVAL` seconds before starting the next cycle
- **AND** `CHECK_INTERVAL` SHALL be read from the `CHECK_INTERVAL` environment variable (default: `300`)

#### Scenario: Scheduler runs indefinitely until interrupted

- **WHEN** the application starts
- **THEN** the scheduler SHALL loop indefinitely using `asyncio.run()`
- **AND** the loop MUST exit cleanly when a `KeyboardInterrupt` or `SIGTERM` is received
