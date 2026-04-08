# toranoana-scraper Specification

## Purpose

Defines the scraping behavior for Toranoana (とらのあな), a Japanese doujinshi and anime goods retailer. The scraper fetches SSR HTML search results sorted by newest items and parses `li.product-list-item` elements.

## Requirements

### Requirement: Toranoana search returns newest listings via SSR HTML

The system SHALL fetch Toranoana search results by issuing an HTTP GET request to `https://ecs.toranoana.jp/tora/ec/app/catalog/list?searchWord={keyword}&sort=newitem` using `httpx.AsyncClient`. `sort=newitem` returns newest listings first. It SHALL parse `li.product-list-item` elements and return a list of `WatcherItem` objects with `platform="toranoana"`.

#### Scenario: Successful search returns item list

- **WHEN** `scrape_toranoana(page, keyword)` is called with a valid keyword
- **THEN** the scraper SHALL issue `GET https://ecs.toranoana.jp/tora/ec/app/catalog/list?searchWord={keyword}&sort=newitem`
- **AND** SHALL parse `li.product-list-item` elements from the HTML response
- **AND** SHALL return a non-empty list of `WatcherItem` objects sorted newest first

#### Scenario: Toranoana item fields are mapped correctly

- **WHEN** a `li.product-list-item` element contains `a[href*="/item/{id}/"]`
- **THEN** `WatcherItem.item_id` SHALL be extracted from the `/item/{id}/` URL pattern
- **AND** `WatcherItem.name` SHALL be set from `a[title]` attribute if present, otherwise `.product-list-name` text (truncated to 120 chars)
- **AND** `WatcherItem.price` SHALL be parsed from `[class*='price']` or `.price` element text
- **AND** `WatcherItem.image_url` SHALL be set from `img[data-src]` or `img[src]`, prefixed with `https:` if protocol-relative
- **AND** `WatcherItem.url` SHALL be the full product URL (prefixed with base URL if relative)
- **AND** `WatcherItem.platform` SHALL be `"toranoana"`

#### Scenario: Price range filter is applied before returning results

- **WHEN** `min_price` and/or `max_price` are provided
- **THEN** only items within the price range SHALL be returned
- **AND** items with `price=null` SHALL be included regardless of filter

#### Scenario: No product list items found returns empty list

- **WHEN** the response HTML contains no `li.product-list-item` elements
- **THEN** the scraper SHALL return an empty list without raising an exception

#### Scenario: Network error or non-200 response returns empty list

- **WHEN** the httpx request raises an exception or returns a non-200 status
- **THEN** the scraper SHALL log the error and return an empty list
- **AND** the scheduler MUST NOT raise an exception

<!-- @trace
source: add-platform-support
updated: 2026-04-08
code:
  - src/scrapers/toranoana.py
  - src/scheduler.py
-->
