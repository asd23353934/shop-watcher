# yahoo-auction-scraper Specification

## Purpose

Defines the scraping behavior for Yahoo拍賣 (tw.bid.yahoo.com), a major Taiwanese online auction platform. The scraper fetches search results sorted by newest listings and extracts product data from the embedded `__NEXT_DATA__` JSON block in the SSR HTML response.

## Requirements

### Requirement: Yahoo拍賣 search returns newest listings via embedded JSON parsing

The system SHALL fetch Yahoo拍賣 search results by issuing an HTTP GET request to `https://tw.bid.yahoo.com/search/auction/product?p={keyword}&sort=ontime` using `httpx.AsyncClient`. It SHALL extract embedded product JSON from the HTML response (via `__NEXT_DATA__` script block or equivalent JS state object), and return a list of `WatcherItem` objects with `platform="yahoo-auction"`.

#### Scenario: Successful HTML response returns item list via embedded JSON

- **WHEN** `scrape_yahoo_auction(page, keyword)` is called with a valid keyword
- **THEN** the scraper SHALL issue a GET request to the Yahoo拍賣 search URL with `sort=ontime`
- **AND** SHALL locate the `<script id="__NEXT_DATA__" type="application/json">` block or a JS state variable containing product data
- **AND** SHALL parse product entries from the embedded JSON
- **AND** SHALL return a non-empty list of `WatcherItem` objects

#### Scenario: Yahoo拍賣 item fields are mapped correctly

- **WHEN** a product entry contains `title` (or equivalent name field), `currentPrice` (or `price`), and `itemUrl` (or `url`) fields
- **THEN** `WatcherItem.name` SHALL be set to the product title
- **AND** `WatcherItem.price` SHALL be the numeric current price in TWD
- **AND** `WatcherItem.url` SHALL be the full item URL (e.g., `https://tw.bid.yahoo.com/item/{id}`)
- **AND** `WatcherItem.item_id` SHALL be extracted from the URL path (the numeric ID segment)
- **AND** `WatcherItem.image_url` SHALL be the product thumbnail URL, or `null` if absent
- **AND** `WatcherItem.platform` SHALL be `"yahoo-auction"`

#### Scenario: Embedded JSON block not found returns empty list

- **WHEN** the HTML response does not contain a parseable `__NEXT_DATA__` block or JS state with product data
- **THEN** the scraper SHALL log a warning and return an empty list

#### Scenario: Price range filter is applied before returning results

- **WHEN** `min_price` or `max_price` is provided
- **THEN** only items within the price range SHALL be returned
- **AND** items with `price=null` SHALL be included regardless

#### Scenario: Network error or non-200 response returns empty list

- **WHEN** the httpx request raises an exception or returns a non-200 status
- **THEN** the scraper SHALL log the error and return an empty list
- **AND** the scheduler MUST NOT raise an exception

<!-- @trace
source: add-platform-support
updated: 2026-04-08
code:
  - src/scrapers/yahoo_auction.py
  - src/scheduler.py
-->
