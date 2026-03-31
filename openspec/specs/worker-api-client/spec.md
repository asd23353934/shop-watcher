# worker-api-client Specification

## Purpose

TBD - created by archiving change 'keyword-shop-watcher'. Update Purpose after archive.

## Requirements

### Requirement: Worker authenticates every API request with a Bearer token

All HTTP requests from the Worker to the Next.js API SHALL include an `Authorization: Bearer {WORKER_SECRET}` header, where `WORKER_SECRET` is read from the environment variable of the same name.

#### Scenario: Every outgoing request carries the Authorization header

- **WHEN** `WorkerApiClient` makes any HTTP request to the Next.js API
- **THEN** the request SHALL include the header `Authorization: Bearer {WORKER_SECRET}`
- **AND** the `WORKER_SECRET` value SHALL be read from the environment at client initialization time

#### Scenario: Missing WORKER_SECRET prevents client initialization

- **WHEN** the `WORKER_SECRET` environment variable is not set
- **THEN** `WorkerApiClient.__init__` SHALL raise a `ValueError` with the message `WORKER_SECRET is required`


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
### Requirement: Worker fetches the active keyword list from Next.js API

The system SHALL implement `WorkerApiClient.get_keywords()` which calls `GET /api/worker/keywords` and returns a list of keyword configuration objects.

#### Scenario: Successful keyword fetch returns keyword list

- **WHEN** `GET /api/worker/keywords` returns HTTP 200 with a JSON array
- **THEN** `get_keywords()` SHALL return a list of dicts, each containing at minimum: `id`, `keyword`, `platforms`, `min_price`, `max_price`
- **AND** the returned list SHALL include only keywords with `active: true`

#### Scenario: Non-2xx response from keyword endpoint returns empty list

- **WHEN** `GET /api/worker/keywords` returns a non-2xx HTTP status
- **THEN** `get_keywords()` SHALL log the status code and response body
- **AND** return an empty list without raising an exception

#### Scenario: Network error on keyword fetch returns empty list

- **WHEN** the HTTP request to `GET /api/worker/keywords` raises a network exception (e.g. `httpx.ConnectError`, `httpx.TimeoutException`)
- **THEN** `get_keywords()` SHALL catch the exception, log the error
- **AND** return an empty list without propagating the exception


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
### Requirement: Worker reports each found item to Next.js API

The system SHALL implement `WorkerApiClient.notify_item(keyword_id, item)` which calls `POST /api/worker/notify` to report a single scraped item.

#### Scenario: Successful notify call returns True

- **WHEN** `POST /api/worker/notify` returns HTTP 200 or 201
- **THEN** `notify_item()` SHALL return `True`

#### Scenario: notify_item sends the correct JSON payload

- **WHEN** `notify_item(keyword_id="abc123", item)` is called with a `WatcherItem`
- **THEN** the POST body SHALL be a JSON object containing:
  - `keyword_id`: the provided keyword ID string
  - `platform`: `item.platform` (`"shopee"` or `"ruten"`)
  - `item_id`: `item.item_id`
  - `name`: `item.name`
  - `price`: `item.price` (float or null)
  - `url`: `item.url`
  - `image_url`: `item.image_url` (string or null)

#### Scenario: Non-2xx response from notify endpoint returns False

- **WHEN** `POST /api/worker/notify` returns a non-2xx HTTP status
- **THEN** `notify_item()` SHALL log the status code and response body
- **AND** return `False` without raising an exception

#### Scenario: Network error on notify call returns False

- **WHEN** the HTTP request to `POST /api/worker/notify` raises a network exception
- **THEN** `notify_item()` SHALL catch the exception, log the error
- **AND** return `False` without propagating the exception


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
### Requirement: WorkerApiClient uses the NEXT_PUBLIC_API_URL environment variable as the base URL

The system SHALL read the Next.js API base URL from the `NEXT_PUBLIC_API_URL` environment variable and prepend it to all endpoint paths.

#### Scenario: Base URL is prepended to all endpoint paths

- **WHEN** `NEXT_PUBLIC_API_URL=https://xxx.vercel.app` is set
- **THEN** `get_keywords()` SHALL call `https://xxx.vercel.app/api/worker/keywords`
- **AND** `notify_item()` SHALL call `https://xxx.vercel.app/api/worker/notify`

#### Scenario: Missing NEXT_PUBLIC_API_URL prevents client initialization

- **WHEN** the `NEXT_PUBLIC_API_URL` environment variable is not set
- **THEN** `WorkerApiClient.__init__` SHALL raise a `ValueError` with the message `NEXT_PUBLIC_API_URL is required`

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