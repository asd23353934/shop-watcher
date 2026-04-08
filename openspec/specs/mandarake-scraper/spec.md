# mandarake-scraper Specification

## Purpose

Defines the scraping behavior for Mandarake, a Japanese secondhand anime and manga goods marketplace. The scraper uses a fixed `tr_mndrk_user=1` cookie to bypass the redirect gate, fetches SSR HTML search results, and stores prices in JPY without currency conversion.

## Requirements

### Requirement: Mandarake search returns newest listings via cookie-gated SSR HTML parsing

The system SHALL fetch Mandarake search results by issuing an HTTP GET request to `https://order.mandarake.co.jp/order/listPage/list?keyword={keyword}&sort=arrival&sortOrder=1&dispCount=24&lang=en&soldOut=1` using `httpx.AsyncClient` with the cookie `tr_mndrk_user=1` set. Without this cookie the server returns a 302 redirect to the homepage. It SHALL parse product cards from the SSR HTML response using BeautifulSoup and return a list of `WatcherItem` objects with `platform="mandarake"`.

#### Scenario: Cookie-gated request succeeds and returns item list

- **WHEN** `scrape_mandarake(page, keyword)` is called
- **THEN** the scraper SHALL issue a GET request with `cookies={"tr_mndrk_user": "1"}`
- **AND** the server SHALL return HTTP 200 with product listing HTML (not a redirect)
- **AND** the scraper SHALL parse product card elements and return a non-empty list of `WatcherItem` objects

#### Scenario: Mandarake item fields are mapped correctly

- **WHEN** a product card contains a link to `/order/detailPage/detail?itemCode={itemCode}` or equivalent
- **THEN** `WatcherItem.item_id` SHALL be the `itemCode` value
- **AND** `WatcherItem.url` SHALL be `https://order.mandarake.co.jp/order/detailPage/detail?itemCode={itemCode}&lang=en`
- **AND** `WatcherItem.name` SHALL be the product title text
- **AND** `WatcherItem.price` SHALL be the numeric yen price (e.g., "¥2,200" → `2200.0`)
- **AND** `WatcherItem.price_text` SHALL be the original price string (e.g., "¥2,200") for display
- **AND** `WatcherItem.image_url` SHALL be the product thumbnail `src`, or `null` if absent
- **AND** `WatcherItem.platform` SHALL be `"mandarake"`

#### Scenario: Price is stored in JPY without conversion

- **WHEN** a Mandarake item shows a price in Japanese yen (¥)
- **THEN** `WatcherItem.price` SHALL store the yen amount as a float
- **AND** NO TWD conversion SHALL be applied

#### Scenario: Cookie missing causes redirect, which returns empty list

- **WHEN** the scraper is called without setting `tr_mndrk_user` cookie and receives a 302 redirect
- **THEN** the scraper SHALL detect the redirect (non-200 or redirect to homepage URL)
- **AND** SHALL log a warning and return an empty list

#### Scenario: Price range filter is applied before returning results

- **WHEN** `min_price` or `max_price` is provided
- **THEN** only items within the price range SHALL be returned (compared against yen price)
- **AND** items with `price=null` SHALL be included regardless

#### Scenario: Network error or non-200 response returns empty list

- **WHEN** the httpx request raises an exception or returns a non-200 status
- **THEN** the scraper SHALL log the error and return an empty list
- **AND** the scheduler MUST NOT raise an exception

<!-- @trace
source: add-platform-support
updated: 2026-04-08
code:
  - src/scrapers/mandarake.py
  - src/scheduler.py
-->
