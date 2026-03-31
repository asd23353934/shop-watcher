"""
Shopee scraper using Playwright headless Chromium.

Strategy: visit homepage first to obtain session cookies,
then navigate to search page. No playwright-stealth required.
"""

import asyncio
import logging
import re
from typing import Optional

from playwright.async_api import Page, TimeoutError as PWTimeout

from src.watchers.base import WatcherItem

logger = logging.getLogger(__name__)

SEARCH_TIMEOUT = 15_000  # ms
HOMEPAGE_WAIT = 3  # seconds after homepage load


def _parse_price(text: str) -> Optional[float]:
    """Parse TWD price string → float. Returns None if unparseable."""
    if not text:
        return None
    digits = re.sub(r"[^\d.]", "", text.replace(",", ""))
    try:
        return float(digits) if digits else None
    except ValueError:
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


async def scrape_shopee(
    page: Page,
    keyword: str,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
) -> list[WatcherItem]:
    """
    Search Shopee for newest listings matching keyword.

    Returns list of WatcherItem, filtered by price range if configured.
    Never raises — returns [] on any error.
    """
    # ── Step 1: Homepage first to obtain session cookies ──────────────────
    # Shopee search navigates to homepage first to obtain session cookies
    try:
        await page.goto(
            "https://shopee.tw/",
            timeout=20_000,
            wait_until="domcontentloaded",
        )
        await asyncio.sleep(HOMEPAGE_WAIT)
    except Exception as exc:
        logger.error("[shopee] Homepage navigation error: %s", exc)
        return []

    if "login" in page.url:
        logger.warning("[shopee] Homepage redirected to login — bot detected")
        return []

    # ── Step 2: Navigate to search page ───────────────────────────────────
    search_url = (
        f"https://shopee.tw/search?keyword={keyword}&sortBy=ctime&order=desc"
    )
    try:
        await page.goto(
            search_url, timeout=20_000, wait_until="domcontentloaded"
        )
        await asyncio.sleep(3)
    except PWTimeout:
        logger.error("[shopee] Search page navigation timed out")
        return []
    except Exception as exc:
        logger.error("[shopee] Search page error: %s", exc)
        return []

    if "login" in page.url:
        logger.warning("[shopee] Search page redirected to login")
        return []

    # ── Step 3: Wait for product cards ────────────────────────────────────
    # Shopee search returns newest listings sorted by creation time
    loaded = False
    for sel in [
        '[data-sqe="item"]',
        ".shopee-search-item-result__item",
        'a[href*="-i."]',
    ]:
        try:
            await page.wait_for_selector(sel, timeout=SEARCH_TIMEOUT)
            loaded = True
            break
        except PWTimeout:
            continue

    if not loaded:
        # Shopee search timeout returns empty list
        logger.warning("[shopee] Product selectors timed out for keyword=%s", keyword)
        return []

    # ── Step 4: Extract items ─────────────────────────────────────────────
    links = await page.query_selector_all('a[href*="-i."]')
    items: list[WatcherItem] = []
    seen_ids: set[str] = set()

    for a in links[:25]:
        try:
            href = await a.get_attribute("href") or ""
            # Pattern: /{slug}-i.{shopid}.{itemid}
            m = re.search(r"-i\.(\d+)\.(\d+)", href)
            if not m:
                continue
            shop_id, item_id = m.group(1), m.group(2)
            if item_id in seen_ids:
                continue
            seen_ids.add(item_id)

            # Name: decode URL-encoded slug, take readable text
            slug_match = re.match(r"/([^?]+)-i\.", href)
            name = ""
            if slug_match:
                from urllib.parse import unquote
                raw_slug = unquote(slug_match.group(1))
                # Remove trailing duplicate product ID portion
                name = raw_slug.replace("-", " ").strip()
            if not name:
                name = f"item-{item_id}"

            # URL: Shopee item ID and shop ID are extracted from the product card link
            full_url = f"https://shopee.tw{href}" if href.startswith("/") else href

            # Price: extract from [class*="price"] element
            price = None
            try:
                price_el = await a.query_selector('[class*="price"]')
                if not price_el:
                    # Try parent container
                    container = await a.evaluate_handle(
                        "el => el.closest('[data-sqe]') || el.parentElement"
                    )
                    if container:
                        price_el = await container.query_selector('[class*="price"]')
                if price_el:
                    price = _parse_price(await price_el.inner_text())
            except Exception:
                pass

            # Image
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
                )
            )
        except Exception as exc:
            logger.debug("[shopee] Parse error: %s", exc)

    # ── Step 5: Apply price filter ────────────────────────────────────────
    return _apply_price_filter(items, min_price, max_price)
