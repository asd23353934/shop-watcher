## ADDED Requirements

### Requirement: BOOTH age bypass via adult=t URL parameter

The system SHALL fetch BOOTH search results by issuing an HTTP GET request to `https://booth.pm/zh-tw/search/{keyword}?adult=t&sort=new_arrival` using `httpx.AsyncClient`. The `adult=t` parameter bypasses BOOTH's age verification gate and includes R18 products in results. It SHALL return a list of `WatcherItem` objects with `platform="booth"`.

#### Scenario: Successful search returns item list with adult content

- **WHEN** `scrape_booth(page, keyword)` is called with a valid keyword
- **THEN** the scraper SHALL issue `GET https://booth.pm/zh-tw/search/{keyword}?adult=t&sort=new_arrival`
- **AND** SHALL parse `li.item-card[data-product-id]` elements from the HTML response
- **AND** SHALL return a non-empty list of `WatcherItem` objects including R18 products

#### Scenario: BOOTH item fields are mapped from data attributes

- **WHEN** an `li.item-card` element has `data-product-id`, `data-product-name`, `data-product-price` attributes
- **THEN** `WatcherItem.item_id` SHALL be set to `data-product-id`
- **AND** `WatcherItem.name` SHALL be set to `data-product-name` (truncated to 120 chars)
- **AND** `WatcherItem.price` SHALL be set to the float value of `data-product-price`, or `null` if missing
- **AND** `WatcherItem.image_url` SHALL be set from `[data-original]` attribute on the thumbnail element, or `null`
- **AND** `WatcherItem.url` SHALL be `https://booth.pm/zh-tw/items/{item_id}`
- **AND** `WatcherItem.platform` SHALL be `"booth"`

#### Scenario: Price range filter is applied before returning results

- **WHEN** `min_price` and/or `max_price` are provided
- **THEN** only items within the price range SHALL be returned
- **AND** items with `price=null` SHALL be included regardless of filter

#### Scenario: No item cards found returns empty list

- **WHEN** the response HTML contains no `li.item-card[data-product-id]` elements
- **THEN** the scraper SHALL return an empty list without raising an exception

#### Scenario: Network error or non-200 response returns empty list

- **WHEN** the httpx request raises an exception or returns a non-200 status
- **THEN** the scraper SHALL log the error and return an empty list
- **AND** the scheduler MUST NOT raise an exception
