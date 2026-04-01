# keyword-search Delta Specification

## MODIFIED Requirements

### Requirement: Shopee search navigates to homepage first to obtain session cookies

The system SHALL visit `https://shopee.tw/` before navigating to the search page only when session cookies have NOT already been injected into the browser context. When cookies are already present, the homepage visit SHALL be skipped to avoid session resets and unnecessary network requests.

#### Scenario: Homepage visit precedes search page navigation when no cookies are present

- **WHEN** `scrape_shopee(page, keyword)` is called
- **AND** the Playwright browser context has no cookies for `https://shopee.tw`
- **THEN** the browser SHALL first navigate to `https://shopee.tw/` with `wait_until="domcontentloaded"`
- **AND** the browser SHALL wait at least 3 seconds after the homepage loads before navigating to the search URL
- **AND** if the homepage URL contains "login", the function SHALL log a block message and return an empty list

#### Scenario: Homepage visit is skipped when session cookies are already injected

- **WHEN** `scrape_shopee(page, keyword)` is called
- **AND** the Playwright browser context already contains one or more cookies for `https://shopee.tw`
- **THEN** the browser SHALL NOT navigate to `https://shopee.tw/` before proceeding to the search strategy
- **AND** the scraper SHALL log an INFO message indicating that homepage preload is skipped

---

### Requirement: Shopee search returns newest listings sorted by creation time

The system SHALL attempt to retrieve Shopee search results using a five-layer fallback strategy in order: (1) pure httpx HTTP request, (2) Playwright network interception of `search_items` API, (3) browser fetch using Playwright-extracted csrftoken, (4) page state extraction, (5) DOM scraping. The first layer to return a non-empty item list SHALL be used as the result.

#### Scenario: Layer 1 — pure httpx HTTP returns results

- **WHEN** `scrape_shopee(page, keyword)` is called
- **AND** an httpx GET request to `https://shopee.tw/api/v4/search/search_items` with browser-like headers returns HTTP 200 with a non-error `search_items` response
- **THEN** the items from the httpx response SHALL be returned immediately without launching Playwright

#### Scenario: Layer 1 fails, Layer 2 — Playwright intercept captures API response

- **WHEN** the httpx request returns a non-200 status or an error response
- **AND** a Playwright page navigation to the Shopee search URL triggers the browser to call `search_items`
- **AND** the network response is captured by the Playwright `on_response` handler
- **THEN** items from the intercepted `search_items` JSON SHALL be returned

#### Scenario: Layer 2 fails, Layer 3 — browser fetch with Playwright csrftoken

- **WHEN** the Playwright `on_response` handler does not capture a valid `search_items` response during page load
- **AND** at least one cookie is available in the Playwright context for `https://shopee.tw`
- **THEN** the scraper SHALL extract the `csrftoken` value via `page.context.cookies()` on the Python side (to read HttpOnly cookies)
- **AND** SHALL execute a `fetch()` call inside the browser page, passing the csrftoken as a parameter
- **AND** if the fetch returns items, those items SHALL be returned

#### Scenario: csrftoken is extracted from Playwright context, not document.cookie

- **WHEN** the browser fetch layer executes
- **THEN** `csrftoken` SHALL be obtained via `page.context.cookies(["https://shopee.tw"])` in Python
- **AND** SHALL be passed as a parameter into `page.evaluate()` to the JavaScript function
- **AND** SHALL NOT be read from `document.cookie` inside JavaScript (which cannot access HttpOnly cookies)

#### Scenario: Layer 3 fails, Layer 4 — page state extraction

- **WHEN** the browser fetch layer returns no items or an error response
- **AND** the Playwright page contains cookies for `https://shopee.tw`
- **THEN** the scraper SHALL attempt a `page.context.cookies()`-backed httpx request using all current context cookies as the `Cookie` header

#### Scenario: Layer 4 fails, Layer 5 — DOM scraping fallback

- **WHEN** all API-based layers (1–4) fail to return items
- **THEN** the scraper SHALL fall back to DOM scraping: wait for product card selectors and extract item data from rendered HTML
- **AND** if the DOM selector times out, the scraper SHALL log a WARNING and return an empty list

#### Scenario: Shopee item ID and shop ID are extracted from the product card link

- **WHEN** a product card contains an `<a>` element with href matching the pattern `/{slug}-i.{shopid}.{itemid}`
- **THEN** `WatcherItem.item_id` SHALL be set to `{itemid}` and the URL SHALL be `https://shopee.tw/{slug}-i.{shopid}.{itemid}`

#### Scenario: Shopee price is extracted and converted to TWD float

- **WHEN** the product card contains a price element matching `[class*="price"]`
- **THEN** `WatcherItem.price` SHALL be the numeric TWD value parsed from the text (e.g. "NT$15" → `15.0`)
- **AND** if no price text can be parsed, `WatcherItem.price` SHALL be `null`

#### Scenario: Shopee search failure returns empty list

- **WHEN** any layer encounters an unhandled exception
- **THEN** the system SHALL log the error and return an empty list
- **AND** the scheduler MUST NOT raise an exception
