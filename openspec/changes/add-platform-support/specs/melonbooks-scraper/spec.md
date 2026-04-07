## ADDED Requirements

### Requirement: Melonbooks R18 age bypass via AUTH_ADULT cookie

The system SHALL fetch Melonbooks search results by issuing an HTTP GET request to `https://www.melonbooks.co.jp/search/search.php?search_all={keyword}&sort=new` using `httpx.AsyncClient` with cookie `AUTH_ADULT=1`. The `AUTH_ADULT=1` cookie bypasses Melonbooks' age verification gate and includes R18 doujinshi. It SHALL parse `.item-list li` elements and return a list of `WatcherItem` objects with `platform="melonbooks"`.

#### Scenario: Successful search returns item list with adult content

- **WHEN** `scrape_melonbooks(page, keyword)` is called with a valid keyword
- **THEN** the scraper SHALL issue GET with cookie `AUTH_ADULT=1` and `sort=new`
- **AND** SHALL parse `.item-list li` elements from the HTML response
- **AND** SHALL return a non-empty list of `WatcherItem` objects including R18 doujinshi

#### Scenario: Melonbooks item fields are mapped correctly

- **WHEN** an `li` element within `.item-list` contains `a[href*="product_id="]`
- **THEN** `WatcherItem.item_id` SHALL be extracted from the `product_id=(\d+)` URL pattern
- **AND** `WatcherItem.name` SHALL be set from `a[title]` attribute if present, otherwise `.item-ttl` text (truncated to 120 chars)
- **AND** `WatcherItem.price` SHALL be parsed from `.item-price` or `[class*='price']` element text (lowest value when multiple prices shown)
- **AND** `WatcherItem.image_url` SHALL be set from `img[data-src]` or `img[src]`, prefixed with `https:` if protocol-relative, `null` if data URI
- **AND** `WatcherItem.url` SHALL be the full product URL (prefixed with base URL if relative)
- **AND** `WatcherItem.platform` SHALL be `"melonbooks"`

#### Scenario: Price range filter is applied before returning results

- **WHEN** `min_price` and/or `max_price` are provided
- **THEN** only items within the price range SHALL be returned
- **AND** items with `price=null` SHALL be included regardless of filter

#### Scenario: No item list elements found returns empty list

- **WHEN** the response HTML contains no `.item-list li` elements
- **THEN** the scraper SHALL return an empty list without raising an exception

#### Scenario: Network error or non-200 response returns empty list

- **WHEN** the httpx request raises an exception or returns a non-200 status
- **THEN** the scraper SHALL log the error and return an empty list
- **AND** the scheduler MUST NOT raise an exception
