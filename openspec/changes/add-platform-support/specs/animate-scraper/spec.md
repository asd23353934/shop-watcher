## ADDED Requirements

### Requirement: Animate Taiwan search returns newest listings via ASP.NET SSR HTML parsing

The system SHALL fetch Animate Taiwan search results by issuing an HTTP GET request to `https://www.animate-onlineshop.com.tw/Form/Product/ProductList.aspx?KeyWord={keyword}&sort=07&udns=1` (where `sort=07` means latest arrivals) using `httpx.AsyncClient`. It SHALL parse product cards from the HTML response using BeautifulSoup and return a list of `WatcherItem` objects with `platform="animate"`.

#### Scenario: Successful HTML response returns item list

- **WHEN** `scrape_animate(page, keyword)` is called with a valid keyword
- **THEN** the scraper SHALL issue a GET request to the Animate Taiwan search URL with `sort=07`
- **AND** SHALL parse product card elements from the HTML (CSS selector: `.product-list li` or equivalent)
- **AND** SHALL return a non-empty list of `WatcherItem` objects

#### Scenario: Animate item fields are mapped correctly

- **WHEN** a product card contains a link to `/Form/Product/ProductDetail.aspx?shop=0&pid={pid}`
- **THEN** `WatcherItem.item_id` SHALL be set to `{pid}` extracted from the `pid` query parameter
- **AND** `WatcherItem.url` SHALL be `https://www.animate-onlineshop.com.tw/Form/Product/ProductDetail.aspx?shop=0&pid={pid}`
- **AND** `WatcherItem.name` SHALL be the product title text from the card
- **AND** `WatcherItem.price` SHALL be the numeric value parsed from the NT$ price string (e.g., "NT$358" → `358.0`)
- **AND** `WatcherItem.image_url` SHALL be the `src` of the product card `<img>` element, or `null` if absent
- **AND** `WatcherItem.platform` SHALL be `"animate"`

#### Scenario: Price string with discount uses the discounted price

- **WHEN** a product card shows both original price and a discounted price
- **THEN** `WatcherItem.price` SHALL be the discounted price (the lower numeric value)

#### Scenario: Price range filter is applied before returning results

- **WHEN** `min_price` or `max_price` is provided
- **THEN** only items within the price range SHALL be returned
- **AND** items with `price=null` SHALL be included regardless

#### Scenario: No product cards found returns empty list

- **WHEN** the HTML response contains no matching product card elements
- **THEN** the scraper SHALL return an empty list without raising an exception

#### Scenario: Network error or non-200 response returns empty list

- **WHEN** the httpx request raises an exception or returns a non-200 status
- **THEN** the scraper SHALL log the error and return an empty list
- **AND** the scheduler MUST NOT raise an exception
