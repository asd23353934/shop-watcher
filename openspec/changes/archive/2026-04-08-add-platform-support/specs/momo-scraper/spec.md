## ADDED Requirements

### Requirement: MOMO購物 search returns listings via SSR JSON-LD parsing

The system SHALL fetch MOMO購物 search results by issuing an HTTP GET request to `https://www.momoshop.com.tw/search/searchShop.jsp?keyword={keyword}&searchType=1&cateLevel=0&ent=k&_isFuzzy=0` using `httpx.AsyncClient`. It SHALL parse product data from the `application/ld+json` `ItemList` schema embedded in the HTML response body, and return a list of `WatcherItem` objects with `platform="momo"`.

#### Scenario: Successful HTML response returns item list via JSON-LD

- **WHEN** `scrape_momo(page, keyword)` is called with a valid keyword
- **THEN** the scraper SHALL issue a GET request to the MOMO search URL
- **AND** SHALL extract the `<script type="application/ld+json">` block containing `"@type": "ItemList"`
- **AND** SHALL parse `itemListElement` array from that JSON-LD block
- **AND** SHALL return a non-empty list of `WatcherItem` objects

#### Scenario: MOMO item fields are mapped correctly from JSON-LD

- **WHEN** an `itemListElement` entry has `name`, `offers.price`, `url`, and `image` fields
- **THEN** `WatcherItem.name` SHALL be set to `name`
- **AND** `WatcherItem.price` SHALL be the numeric value of `offers.price`
- **AND** `WatcherItem.url` SHALL be set to `url`
- **AND** `WatcherItem.image_url` SHALL be set to `image` (or first element if it is an array)
- **AND** `WatcherItem.item_id` SHALL be extracted from the URL path (the numeric segment after `/goods/`)
- **AND** `WatcherItem.platform` SHALL be `"momo"`

#### Scenario: JSON-LD block not found falls back to empty list

- **WHEN** the HTML response does not contain a `<script type="application/ld+json">` block with `ItemList`
- **THEN** the scraper SHALL log a warning and return an empty list

#### Scenario: Price range filter is applied before returning results

- **WHEN** `min_price` or `max_price` is provided
- **THEN** only items within the price range SHALL be returned
- **AND** items with `price=null` SHALL be included regardless

#### Scenario: Network error or non-200 response returns empty list

- **WHEN** the httpx request raises an exception or returns a non-200 status
- **THEN** the scraper SHALL log the error and return an empty list
- **AND** the scheduler MUST NOT raise an exception
