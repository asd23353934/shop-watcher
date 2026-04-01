"""
Shopee scraper using Playwright headless Chromium.

Strategy:
1. Visit homepage to obtain session cookies.
2. Call Shopee's internal search API via browser fetch (inherits cookies/headers).
3. Fall back to DOM scraping if the API returns no items.
"""

import asyncio
import logging
import re
from typing import Optional
from urllib.parse import quote

from playwright.async_api import Page, TimeoutError as PWTimeout

from src.watchers.base import WatcherItem

logger = logging.getLogger(__name__)

SEARCH_TIMEOUT = 15_000  # ms (DOM fallback only)
HOMEPAGE_WAIT = 3  # seconds after homepage load


def _parse_price(text: str) -> Optional[float]:
    """Parse TWD price string → float (min price for ranges). Returns None if unparseable."""
    if not text:
        return None
    numbers = re.findall(r"[\d,]+", text)
    if not numbers:
        return None
    try:
        return float(numbers[0].replace(",", ""))
    except ValueError:
        return None


def _extract_price_text(text: str) -> Optional[str]:
    """
    Extract display price text for price ranges (e.g. '100 ~ 1,000').
    Returns None for single prices (let the caller format normally).
    """
    if not text:
        return None
    numbers = re.findall(r"[\d,]+", text)
    if len(numbers) < 2:
        return None
    try:
        first = int(numbers[0].replace(",", ""))
        second = int(numbers[1].replace(",", ""))
        if first != second:
            return f"{first:,} ~ {second:,}"
    except ValueError:
        pass
    return None


def _apply_price_filter(
    items: list[WatcherItem],
    min_price: Optional[float],
    max_price: Optional[float],
) -> list[WatcherItem]:
    """
    Filter items by price range.
    Items with price=None are always included (Price range filter is applied before returning results).
    """
    result = []
    for item in items:
        if item.price is None:
            result.append(item)
            continue
        if min_price is not None and item.price < min_price:
            continue
        if max_price is not None and item.price > max_price:
            continue
        result.append(item)
    return result


async def _scrape_shopee_api(page: Page, keyword: str) -> list[WatcherItem]:
    """
    Fetch search results from Shopee's internal JSON API via browser fetch.
    Inherits session cookies from the already-loaded homepage context.
    Returns [] on any error.
    """
    encoded = quote(keyword)
    api_url = (
        "https://shopee.tw/api/v4/search/search_items"
        f"?by=ctime&keyword={encoded}&limit=50&newest=0"
        "&order=desc&page_type=search&scenario=PAGE_GLOBAL_SEARCH&version=2"
    )

    try:
        result = await page.evaluate(
            """
            async (url) => {
                const res = await fetch(url, {
                    headers: {
                        'accept': 'application/json',
                        'x-api-source': 'pc',
                        'x-requested-with': 'XMLHttpRequest',
                    },
                    credentials: 'include',
                });
                if (!res.ok) return null;
                return await res.json();
            }
            """,
            api_url,
        )
    except Exception as exc:
        logger.error("[shopee] API fetch error: %s", exc)
        return []

    if not result:
        logger.warning("[shopee] API returned null/empty response")
        return []

    # Log top-level keys to help diagnose structure changes
    top_keys = list(result.keys()) if isinstance(result, dict) else []
    logger.info("[shopee] API response keys: %s", top_keys)

    # Try multiple known response structures
    raw_items = (
        result.get("items")
        or result.get("data", {}).get("items")
        or []
    )
    if not raw_items:
        logger.warning("[shopee] API: no items in response (keys=%s)", top_keys)
        return []

    items: list[WatcherItem] = []
    seen_ids: set[str] = set()

    for raw in raw_items[:25]:
        try:
            info = raw.get("item_basic") or {}
            item_id = str(info.get("itemid", ""))
            shop_id = str(info.get("shopid", ""))
            if not item_id or item_id in seen_ids:
                continue
            seen_ids.add(item_id)

            name = (info.get("name") or f"item-{item_id}")[:120]

            # Shopee prices are in units of 100,000 (5 decimal places)
            price: Optional[float] = None
            price_text: Optional[str] = None
            price_min = info.get("price_min")
            price_max = info.get("price_max")
            price_val = info.get("price")

            if price_min is not None and price_max is not None:
                p_min = price_min / 100_000
                p_max = price_max / 100_000
                price = p_min
                if abs(p_min - p_max) >= 1:
                    price_text = f"{int(p_min):,} ~ {int(p_max):,}"
            elif price_val is not None:
                price = price_val / 100_000

            # Build item URL: name slug + shop_id.item_id
            name_slug = re.sub(r"\s+", "-", name.strip())
            url = f"https://shopee.tw/{name_slug}-i.{shop_id}.{item_id}"

            # Image (CDN thumbnail)
            image_url: Optional[str] = None
            image = info.get("image")
            if image:
                image_url = f"https://cf.shopee.tw/file/{image}_tn"

            seller_name: Optional[str] = info.get("shop_name") or None

            items.append(
                WatcherItem(
                    platform="shopee",
                    item_id=item_id,
                    name=name,
                    price=price,
                    url=url,
                    image_url=image_url,
                    seller_name=seller_name,
                    price_text=price_text,
                )
            )
        except Exception as exc:
            logger.debug("[shopee] API parse error: %s", exc)

    logger.info("[shopee] API returned %d item(s) for keyword=%s", len(items), keyword)
    return items


async def _scrape_shopee_dom_from_loaded_page(page: Page, keyword: str) -> list[WatcherItem]:
    """
    DOM-based fallback scraper for an already-loaded search page.
    Waits for product card selectors then parses links.
    Returns [] if no selectors match.
    """
    # Wait for product cards (page already navigated)
    loaded = False
    for sel in [
        '[data-sqe="item"]',
        ".shopee-search-item-result__item",
        'a[href*="-i."]',
        '[class*="search-item"]',
        'li[class*="col-xs"]',
    ]:
        try:
            await page.wait_for_selector(sel, timeout=SEARCH_TIMEOUT)
            loaded = True
            break
        except PWTimeout:
            continue

    if not loaded:
        logger.warning("[shopee] DOM: product selectors timed out for keyword=%s", keyword)
        return []

    links = await page.query_selector_all('a[href*="-i."]')
    items: list[WatcherItem] = []
    seen_ids: set[str] = set()

    for a in links[:25]:
        try:
            href = await a.get_attribute("href") or ""
            m = re.search(r"-i\.(\d+)\.(\d+)", href)
            if not m:
                continue
            shop_id, item_id = m.group(1), m.group(2)
            if item_id in seen_ids:
                continue
            seen_ids.add(item_id)

            slug_match = re.match(r"/([^?]+)-i\.", href)
            name = ""
            if slug_match:
                from urllib.parse import unquote
                raw_slug = unquote(slug_match.group(1))
                name = raw_slug.replace("-", " ").strip()
            if not name:
                name = f"item-{item_id}"

            full_url = f"https://shopee.tw{href}" if href.startswith("/") else href

            price = None
            price_text = None
            try:
                price_el = await a.query_selector('[class*="price"]')
                if not price_el:
                    container = await a.evaluate_handle(
                        "el => el.closest('[data-sqe]') || el.parentElement"
                    )
                    if container:
                        price_el = await container.query_selector('[class*="price"]')
                if price_el:
                    raw_price_text = await price_el.inner_text()
                    price = _parse_price(raw_price_text)
                    price_text = _extract_price_text(raw_price_text)
            except Exception:
                pass

            image_url = None
            try:
                img_el = await a.query_selector("img")
                if img_el:
                    src = await img_el.get_attribute("src") or ""
                    image_url = None if src.startswith("data:") else src or None
            except Exception:
                pass

            items.append(
                WatcherItem(
                    platform="shopee",
                    item_id=item_id,
                    name=name[:120],
                    price=price,
                    url=full_url,
                    image_url=image_url,
                    seller_name=None,
                    price_text=price_text,
                )
            )
        except Exception as exc:
            logger.debug("[shopee] DOM parse error: %s", exc)

    logger.info("[shopee] DOM returned %d item(s) for keyword=%s", len(items), keyword)
    return items


async def scrape_shopee(
    page: Page,
    keyword: str,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
) -> list[WatcherItem]:
    """
    Search Shopee for newest listings matching keyword.

    Strategy:
    1. Navigate directly to the search URL (avoids repeated homepage bot detection).
    2. Override navigator.webdriver to bypass basic headless detection.
    3. Try internal JSON API via browser fetch (inherits cookies).
    4. Fall back to DOM scraping if API returns nothing.

    Returns list of WatcherItem, filtered by price range if configured.
    Never raises — returns [] on any error.
    """
    # ── Step 1: Override webdriver flag before any navigation ────────────
    await page.add_init_script(
        "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
    )

    # ── Step 2: Navigate directly to search page ──────────────────────────
    search_url = (
        f"https://shopee.tw/search?keyword={quote(keyword)}&sortBy=ctime&order=desc"
    )
    try:
        await page.goto(search_url, timeout=25_000, wait_until="domcontentloaded")
        await asyncio.sleep(3)
    except Exception as exc:
        logger.error("[shopee] Navigation error: %s", exc)
        return []

    current_url = page.url
    if "login" in current_url:
        logger.warning("[shopee] Redirected to login for keyword=%s", keyword)
        return []

    logger.info("[shopee] Loaded search page for keyword=%s url=%s", keyword, current_url[:80])

    # ── Step 3: Try internal API (cookies now set by search page) ────────
    items = await _scrape_shopee_api(page, keyword)

    # ── Step 4: DOM fallback if API yielded nothing ───────────────────────
    if not items:
        logger.info("[shopee] API returned 0 items, falling back to DOM scrape for keyword=%s", keyword)
        items = await _scrape_shopee_dom_from_loaded_page(page, keyword)

    # ── Step 5: Apply price filter ────────────────────────────────────────
    return _apply_price_filter(items, min_price, max_price)
