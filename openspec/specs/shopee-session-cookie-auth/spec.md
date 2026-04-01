# shopee-session-cookie-auth Specification

## Purpose

Defines how Shopee session cookies are injected into the Playwright browser context to bypass fraud-detection redirects, how the Worker CI workflow exposes the required secret, and how the scraper detects and reports fraud-detection redirects clearly.

## Requirements

### Requirement: Scheduler injects Shopee session cookies into browser context before scanning

When the `SHOPEE_COOKIES_JSON` environment variable is set, the scheduler SHALL parse it as a JSON array of Playwright-format cookie objects and inject them into the Playwright browser context via `context.add_cookies()` before any scan cycle begins.

#### Scenario: Valid SHOPEE_COOKIES_JSON is injected into context

- **WHEN** `SHOPEE_COOKIES_JSON` is set to a valid JSON array of cookie objects
- **THEN** the scheduler SHALL call `context.add_cookies(cookies)` with the parsed list before starting any keyword scan
- **AND** the scheduler SHALL log the number of injected cookies at INFO level

#### Scenario: Invalid SHOPEE_COOKIES_JSON is handled gracefully

- **WHEN** `SHOPEE_COOKIES_JSON` is set but contains invalid JSON
- **THEN** the scheduler SHALL log a WARNING with the parse error
- **AND** the scan cycle SHALL proceed without injected cookies (degraded mode)

#### Scenario: SHOPEE_COOKIES_JSON is absent

- **WHEN** `SHOPEE_COOKIES_JSON` is not set in the environment
- **THEN** the scheduler SHALL NOT call `context.add_cookies()`
- **AND** the scan cycle SHALL proceed in cookie-less mode (Shopee searches will fail with fraud detection)

<!-- @trace
source: fix-shopee-scraper-cookie-auth
updated: 2026-04-01
code:
  - src/scheduler.py
-->


<!-- @trace
source: fix-shopee-scraper-cookie-auth
updated: 2026-04-01
code:
  - poc/screenshots/shopee_search_debug.png
  - requirements.txt
  - src/scrapers/shopee.py
  - src/scheduler.py
  - .github/workflows/worker.yml
  - poc/screenshots/shopee_debug.png
-->

---
### Requirement: Worker CI workflow exposes SHOPEE_COOKIES_JSON secret to the scan step

The `.github/workflows/worker.yml` SHALL pass the `SHOPEE_COOKIES_JSON` GitHub Actions secret as an environment variable to the Python worker scan step.

#### Scenario: Secret is forwarded when set

- **WHEN** the GitHub Actions secret `SHOPEE_COOKIES_JSON` is configured in the repository
- **THEN** the worker scan step SHALL receive it as the `SHOPEE_COOKIES_JSON` environment variable
- **AND** the scheduler SHALL inject the cookies into the browser context before scanning

#### Scenario: Secret is absent without error

- **WHEN** the GitHub Actions secret `SHOPEE_COOKIES_JSON` is not configured
- **THEN** the worker scan step SHALL still execute without error (the env var will be empty)
- **AND** Shopee scraping SHALL fall back to cookie-less mode

<!-- @trace
source: fix-shopee-scraper-cookie-auth
updated: 2026-04-01
code:
  - .github/workflows/worker.yml
-->


<!-- @trace
source: fix-shopee-scraper-cookie-auth
updated: 2026-04-01
code:
  - poc/screenshots/shopee_search_debug.png
  - requirements.txt
  - src/scrapers/shopee.py
  - src/scheduler.py
  - .github/workflows/worker.yml
  - poc/screenshots/shopee_debug.png
-->

---
### Requirement: Shopee scraper detects fraud-detection redirect and emits clear error

When the search page URL contains `fu_tracking_id`, indicating Shopee has redirected to the login page due to fraud detection, the scraper SHALL log a clear error message instructing the operator to set `SHOPEE_COOKIES_JSON`.

#### Scenario: Fraud detection redirect is detected after page navigation

- **WHEN** the Playwright page navigates to the Shopee search URL
- **AND** the resulting page URL contains the string `fu_tracking_id`
- **THEN** the scraper SHALL log a WARNING message stating that fraud detection blocked the search
- **AND** the message SHALL instruct the operator to export cookies from a logged-in Chrome session and set the `SHOPEE_COOKIES_JSON` environment variable

#### Scenario: Search proceeds normally when no redirect occurs

- **WHEN** the page URL after navigation does NOT contain `fu_tracking_id`
- **THEN** the scraper SHALL continue with the search strategy pipeline without logging a fraud detection warning

<!-- @trace
source: fix-shopee-scraper-cookie-auth
updated: 2026-04-01
code:
  - src/scrapers/shopee.py
-->

<!-- @trace
source: fix-shopee-scraper-cookie-auth
updated: 2026-04-01
code:
  - poc/screenshots/shopee_search_debug.png
  - requirements.txt
  - src/scrapers/shopee.py
  - src/scheduler.py
  - .github/workflows/worker.yml
  - poc/screenshots/shopee_debug.png
-->