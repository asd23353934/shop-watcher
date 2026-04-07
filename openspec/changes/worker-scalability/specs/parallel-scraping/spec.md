## ADDED Requirements

### Requirement: Scheduler executes all keyword-platform scans in parallel using asyncio

The system SHALL replace the sequential nested loop in `run_scan_cycle()` with `asyncio.gather()` so that all keyword×platform scan tasks execute concurrently. Each platform SHALL have a dedicated `asyncio.Semaphore` limiting concurrent connections to that platform, with the concurrency limit configurable via the `SEMAPHORE_PER_PLATFORM` environment variable (default: `3`).

#### Scenario: All keyword-platform tasks run concurrently

- **WHEN** a scan cycle begins with 10 keywords each targeting 12 platforms
- **THEN** all 120 scan tasks SHALL be submitted to `asyncio.gather()` simultaneously
- **AND** the cycle SHALL complete in approximately `(total_tasks / (num_platforms × semaphore_limit)) × avg_request_time` seconds rather than `total_tasks × avg_request_time` seconds

#### Scenario: Per-platform Semaphore limits concurrent connections

- **WHEN** multiple tasks target the same platform (e.g., `ruten`) simultaneously
- **THEN** at most `SEMAPHORE_PER_PLATFORM` (default: `3`) tasks for `ruten` SHALL execute concurrently
- **AND** remaining tasks for `ruten` SHALL wait until a Semaphore slot is released before executing

#### Scenario: One platform failure does not block other platforms

- **WHEN** a scan task for keyword "PS5" on platform `shopee` raises an exception
- **THEN** all other running tasks (e.g., keyword "PS5" on `ruten`, or keyword "switch" on `shopee`) SHALL continue executing
- **AND** the exception SHALL be caught and logged with the keyword and platform details
- **AND** `asyncio.gather(return_exceptions=True)` SHALL be used to prevent exception propagation

#### Scenario: SEMAPHORE_PER_PLATFORM is configurable via environment variable

- **WHEN** `SEMAPHORE_PER_PLATFORM=1` is set in the environment
- **THEN** only 1 task per platform SHALL execute concurrently, effectively approximating sequential behavior per platform
- **AND** the total number of concurrent tasks at any time SHALL not exceed `num_platforms × 1`

#### Scenario: All scrapers are async-compatible

- **WHEN** any scraper (shopee, ruten, booth, dlsite, toranoana, melonbooks, etc.) is called within asyncio.gather
- **THEN** the scraper SHALL use `async_playwright` and `async/await` syntax throughout
- **AND** no blocking synchronous I/O call SHALL be made inside the async scraper without wrapping in `asyncio.to_thread`
