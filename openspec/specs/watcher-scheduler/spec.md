# watcher-scheduler Specification

## Purpose

TBD - created by archiving change 'keyword-shop-watcher'. Update Purpose after archive.

## Requirements

### Requirement: Scheduler fetches keyword list from Next.js API before each scan cycle

The system SHALL call `GET /api/worker/keywords` at the start of every scan cycle to retrieve the current list of active keywords and their configurations. It SHALL NOT read from a local `config.yaml` file.

#### Scenario: Keyword list is fetched successfully before scanning

- **WHEN** a scan cycle begins
- **THEN** the scheduler SHALL call `WorkerApiClient.get_keywords()` which issues `GET /api/worker/keywords`
- **AND** the returned keyword list SHALL be used for the current scan cycle
- **AND** keywords added or removed between cycles SHALL be reflected automatically

#### Scenario: Empty keyword list skips the scan cycle

- **WHEN** `GET /api/worker/keywords` returns an empty array
- **THEN** no Playwright browser SHALL be launched
- **AND** the scheduler SHALL log "No active keywords, skipping scan" and sleep until the next interval

#### Scenario: API error on keyword fetch skips the scan cycle

- **WHEN** `GET /api/worker/keywords` returns a non-2xx status or raises a network exception
- **THEN** the scheduler SHALL log the error details
- **AND** no Playwright browser SHALL be launched for that cycle
- **AND** the scheduler SHALL continue to the next cycle after sleeping `CHECK_INTERVAL` seconds


<!-- @trace
source: keyword-shop-watcher
updated: 2026-03-31
code:
  - .env.example
  - src/scrapers/shopee.py
  - src/scrapers/__init__.py
  - config.example.yaml
  - src/database.py
  - src/scheduler.py
  - fly.toml
  - Dockerfile
  - requirements.txt
  - src/api_client.py
  - poc/screenshots/ruten.png
  - src/scrapers/ruten.py
  - .github/workflows/ci.yml
  - src/config.py
  - src/notifier.py
  - poc/screenshots/shopee.png
  - main.py
-->

---
### Requirement: Scheduler runs all keyword searches on a configurable interval

The system SHALL execute a full scan of all keywords and platforms in sequence, then sleep for `CHECK_INTERVAL` seconds before repeating.

#### Scenario: Each keyword-platform pair is searched independently

- **WHEN** a keyword has `platforms: ["shopee", "ruten"]`
- **THEN** the scheduler SHALL call `ShopeeWatcher.search(keyword)` and `RutenWatcher.search(keyword)` as separate operations
- **AND** a failure on one platform MUST NOT prevent the other platform from being searched

#### Scenario: Scheduler sleeps between scans

- **WHEN** a full scan cycle completes
- **THEN** the scheduler SHALL sleep for exactly `CHECK_INTERVAL` seconds before starting the next cycle
- **AND** `CHECK_INTERVAL` SHALL be read from the `CHECK_INTERVAL` environment variable (default: `300`)

#### Scenario: Scheduler runs indefinitely until interrupted

- **WHEN** the application starts
- **THEN** the scheduler SHALL loop indefinitely
- **AND** the loop MUST exit cleanly when a `KeyboardInterrupt` or `SIGTERM` is received


<!-- @trace
source: keyword-shop-watcher
updated: 2026-03-31
code:
  - .env.example
  - src/scrapers/shopee.py
  - src/scrapers/__init__.py
  - config.example.yaml
  - src/database.py
  - src/scheduler.py
  - fly.toml
  - Dockerfile
  - requirements.txt
  - src/api_client.py
  - poc/screenshots/ruten.png
  - src/scrapers/ruten.py
  - .github/workflows/ci.yml
  - src/config.py
  - src/notifier.py
  - poc/screenshots/shopee.png
  - main.py
-->

---
### Requirement: Found items are reported to Next.js API immediately after each search

The system SHALL call `POST /api/worker/notify` for each item found by a keyword-platform search, passing the item data and the corresponding `keyword_id`.

#### Scenario: Each found item triggers a notify API call

- **WHEN** `ShopeeWatcher.search` or `RutenWatcher.search` returns a non-empty list
- **THEN** the scheduler SHALL call `WorkerApiClient.notify_item(keyword_id, item)` for each item in the list
- **AND** the call SHALL NOT be skipped even if a previous item's notify call failed

#### Scenario: Notify API call failure does not abort remaining items

- **WHEN** `POST /api/worker/notify` returns a non-2xx status for one item
- **THEN** the scheduler SHALL log the failure and continue reporting remaining items
- **AND** the scheduler MUST NOT raise an exception that stops the scan cycle


<!-- @trace
source: keyword-shop-watcher
updated: 2026-03-31
code:
  - .env.example
  - src/scrapers/shopee.py
  - src/scrapers/__init__.py
  - config.example.yaml
  - src/database.py
  - src/scheduler.py
  - fly.toml
  - Dockerfile
  - requirements.txt
  - src/api_client.py
  - poc/screenshots/ruten.png
  - src/scrapers/ruten.py
  - .github/workflows/ci.yml
  - src/config.py
  - src/notifier.py
  - poc/screenshots/shopee.png
  - main.py
-->

---
### Requirement: Per-scan summary is logged to stdout

The system SHALL print a one-line summary after each keyword-platform scan.

#### Scenario: Log line shows scan result counts

- **WHEN** a scan of keyword `"PS5"` on `shopee` finds 20 items
- **THEN** a log line SHALL be printed in the format: `[shopee] PS5 — 20 found, {n} reported`

#### Scenario: Log line shows zero items found

- **WHEN** a scan finds no items
- **THEN** the log line SHALL still be printed with `0 found`


<!-- @trace
source: keyword-shop-watcher
updated: 2026-03-31
code:
  - .env.example
  - src/scrapers/shopee.py
  - src/scrapers/__init__.py
  - config.example.yaml
  - src/database.py
  - src/scheduler.py
  - fly.toml
  - Dockerfile
  - requirements.txt
  - src/api_client.py
  - poc/screenshots/ruten.png
  - src/scrapers/ruten.py
  - .github/workflows/ci.yml
  - src/config.py
  - src/notifier.py
  - poc/screenshots/shopee.png
  - main.py
-->

---
### Requirement: Application environment is validated before the scheduler starts

The system SHALL verify that required environment variables are present before entering the scheduler loop.

#### Scenario: Missing WORKER_SECRET raises an error at startup

- **WHEN** the `WORKER_SECRET` environment variable is not set
- **THEN** the application SHALL exit with the message `WORKER_SECRET is required` before the scheduler starts

#### Scenario: Missing NEXT_PUBLIC_API_URL raises an error at startup

- **WHEN** the `NEXT_PUBLIC_API_URL` environment variable is not set
- **THEN** the application SHALL exit with the message `NEXT_PUBLIC_API_URL is required` before the scheduler starts

<!-- @trace
source: keyword-shop-watcher
updated: 2026-03-31
code:
  - .env.example
  - src/scrapers/shopee.py
  - src/scrapers/__init__.py
  - config.example.yaml
  - src/database.py
  - src/scheduler.py
  - fly.toml
  - Dockerfile
  - requirements.txt
  - src/api_client.py
  - poc/screenshots/ruten.png
  - src/scrapers/ruten.py
  - .github/workflows/ci.yml
  - src/config.py
  - src/notifier.py
  - poc/screenshots/shopee.png
  - main.py
-->