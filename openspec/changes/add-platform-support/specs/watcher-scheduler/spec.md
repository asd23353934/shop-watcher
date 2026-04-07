## MODIFIED Requirements

### Requirement: Scheduler runs all keyword searches on a configurable interval

The system SHALL execute a full scan of all keywords and platforms in sequence, then sleep for `CHECK_INTERVAL` seconds before repeating. Supported platforms are: `ruten`, `pchome`, `momo`, `animate`, `yahoo-auction`, `mandarake`, `myacg`, `kingstone`. The platform `shopee` SHALL be treated as suspended: when a keyword specifies `shopee`, the scheduler SHALL log a WARNING and skip it without raising an exception.

#### Scenario: Each keyword-platform pair is searched independently

- **WHEN** a keyword has `platforms: ["ruten", "pchome"]`
- **THEN** the scheduler SHALL call `scrape_ruten(page, keyword)` and `scrape_pchome(page, keyword)` as separate operations
- **AND** a failure on one platform MUST NOT prevent the other platform from being searched

#### Scenario: Shopee platform is suspended and logged

- **WHEN** a keyword has `platforms: ["shopee"]` or `platforms` includes `"shopee"`
- **THEN** the scheduler SHALL log `WARNING: shopee platform is suspended, skipping keyword '{keyword}' on shopee`
- **AND** SHALL continue to the next platform without calling any scraper

#### Scenario: Unknown platform is logged and skipped

- **WHEN** a keyword specifies a platform string not in `[ruten, pchome, momo, animate, yahoo-auction, mandarake, shopee]`
- **THEN** the scheduler SHALL log a WARNING with the unknown platform name and skip it

#### Scenario: Scheduler sleeps between scans

- **WHEN** a full scan cycle completes
- **THEN** the scheduler SHALL sleep for exactly `CHECK_INTERVAL` seconds before starting the next cycle
- **AND** `CHECK_INTERVAL` SHALL be read from the `CHECK_INTERVAL` environment variable (default: `300`)

#### Scenario: Scheduler runs indefinitely until interrupted

- **WHEN** the application starts
- **THEN** the scheduler SHALL loop indefinitely
- **AND** the loop MUST exit cleanly when a `KeyboardInterrupt` or `SIGTERM` is received

## REMOVED Requirements

### Requirement: Shopee session-cookie injection into browser context

**Reason**: Shopee scraping is suspended. The session cookie injection, `ShopeeBlockedError`/`ShopeeSessionExpiredError` handling, and storage state deletion logic in `scheduler.py` SHALL be removed.

**Migration**: No migration required. Existing keywords with `platform=shopee` will be skipped with a WARNING log until the user changes their platform selection.

#### Scenario: Shopee session-cookie injection code is removed from scheduler

- **WHEN** a scan cycle begins
- **THEN** the scheduler SHALL NOT inject any Shopee session cookies into the Playwright browser context
- **AND** `ShopeeBlockedError` and `ShopeeSessionExpiredError` catch blocks SHALL NOT exist in `scheduler.py`
