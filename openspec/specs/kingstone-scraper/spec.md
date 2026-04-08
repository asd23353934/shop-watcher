# kingstone-scraper Specification

## Purpose

Defines the scraping behavior for 金石堂 (Kingstone) ACG, a Taiwanese bookstore specializing in anime, comics, and games merchandise. The scraper fetches search results via HTTP GET to the SSR HTML endpoint and returns structured `WatcherItem` objects, with discounted prices taking priority over original prices.

## Requirements

### Requirement: 金石堂 ACG search returns newest listings via SSR HTML parsing

The system SHALL fetch 金石堂 ACG search results by issuing an HTTP GET request to `https://www.kingstone.com.tw/search/key/{keyword}/lid/search` using `httpx.AsyncClient`. The page is fully server-side rendered; all product data is present in the initial HTML response. The scraper SHALL parse product listings with BeautifulSoup and return a list of `WatcherItem` objects with `platform="kingstone"`.

#### Scenario: Successful HTML response returns item list

- **WHEN** `scrape_kingstone(page, keyword)` is called with a valid keyword
- **THEN** the scraper SHALL issue a GET request to `https://www.kingstone.com.tw/search/key/{keyword}/lid/search`
- **AND** SHALL parse product listing elements from the SSR HTML
- **AND** SHALL return a non-empty list of `WatcherItem` objects

#### Scenario: 金石堂 item fields are mapped correctly

- **WHEN** a product listing contains a link to `/basic/{id}/`
- **THEN** `WatcherItem.item_id` SHALL be the numeric `{id}` segment extracted from the URL path
- **AND** `WatcherItem.url` SHALL be `https://www.kingstone.com.tw/basic/{id}/`
- **AND** `WatcherItem.name` SHALL be the product title text
- **AND** `WatcherItem.image_url` SHALL be the product thumbnail URL from the CDN, or `null` if absent
- **AND** `WatcherItem.platform` SHALL be `"kingstone"`

#### Scenario: Discounted price takes priority over original price

- **WHEN** a product listing shows both an original price and a discounted (special) price
- **THEN** `WatcherItem.price` SHALL be the discounted price (the lower numeric value)
- **AND** `WatcherItem.price_text` SHALL be set to display the discount context (e.g., "NT$380 (66折)")

#### Scenario: Price is parsed from NT$ formatted string

- **WHEN** a price element contains text such as "NT$380" or "380元"
- **THEN** `WatcherItem.price` SHALL be the numeric value `380.0`
- **AND** if no price text can be parsed, `WatcherItem.price` SHALL be `null`

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
  - src/scrapers/kingstone.py
  - src/scheduler.py
-->
