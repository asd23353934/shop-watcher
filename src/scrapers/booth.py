"""
BOOTH (booth.pm) scraper — SSR HTML with data attributes.

URL: https://booth.pm/zh-tw/search/{keyword}?adult=t&sort=new_arrival
adult=t bypasses age verification — exposes all products including R18.
sort=new_arrival returns newest listings first.
Keyword search: products are embedded as li.item-card with data-product-* attributes (httpx).
Circle/shop scraping: uses Playwright to bypass Cloudflare on subdomain pages.
"""

import json
import logging
import re
from typing import Optional
from urllib.parse import quote

import httpx
from bs4 import BeautifulSoup
from playwright.async_api import Page, TimeoutError as PWTimeout

from src.watchers.base import WatcherItem
from src.scrapers.shopee import _apply_price_filter, _parse_price

logger = logging.getLogger(__name__)

_BASE_URL = "https://booth.pm"

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-TW,zh;q=0.9,ja;q=0.8,en-US;q=0.7",
    "Referer": _BASE_URL + "/",
}

# Cookie 繞過年齡驗證，URL 的 adult=t 參數僅控制搜尋結果，cookie 才能取得真實 R18 圖片
_COOKIES = {"adult": "t"}


def _parse_booth_cards(cards, log_prefix: str) -> list[WatcherItem]:
    """Parse li.item-card[data-product-id] elements into WatcherItem list."""
    items: list[WatcherItem] = []
    seen_ids: set[str] = set()

    for card in cards:
        try:
            item_id = card.get("data-product-id", "").strip()[:100]
            if not item_id or item_id in seen_ids:
                continue
            seen_ids.add(item_id)

            name = card.get("data-product-name", "").strip()[:120]
            if not name:
                title_el = card.select_one(".item-card__title, .caption")
                name = title_el.get_text(strip=True)[:120] if title_el else ""
            if not name:
                continue

            raw_price = card.get("data-product-price", "")
            price = float(raw_price) if raw_price else None

            img_el = card.select_one("[data-original]")
            image_url = img_el.get("data-original") if img_el else None

            seller_name = card.get("data-shop-name", "").strip() or None
            seller_id = card.get("data-shop-id", "").strip() or None
            if not seller_name:
                shop_el = card.select_one(".item-card__shop, .shop-name")
                seller_name = shop_el.get_text(strip=True)[:80] if shop_el else None
            if seller_name:
                seller_name = seller_name[:80]

            items.append(
                WatcherItem(
                    platform="booth",
                    item_id=item_id,
                    name=name,
                    price=price,
                    url=f"{_BASE_URL}/zh-tw/items/{item_id}",
                    image_url=image_url,
                    seller_name=seller_name,
                    seller_id=seller_id,
                )
            )
        except Exception as exc:
            logger.debug("[%s] Parse error: %s", log_prefix, exc)

    return items


async def scrape_booth(
    page: Page,  # unused — kept for consistent scraper signature
    keyword: str,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
) -> list[WatcherItem]:
    """
    Search BOOTH for newest listings matching keyword.

    Uses adult=t to bypass age verification (includes R18 products).
    Parses data-product-* attributes from li.item-card elements. No Playwright used.
    Never raises — returns [] on any error.
    """
    url = f"{_BASE_URL}/zh-tw/search/{quote(keyword, safe='')}?adult=t&sort=new_arrival"
    try:
        async with httpx.AsyncClient(
            headers=_HEADERS, cookies=_COOKIES, timeout=15, follow_redirects=True,
        ) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            html = resp.text
    except Exception as exc:
        logger.warning("[booth] Request failed for keyword=%s: %s", keyword, exc)
        return []

    soup = BeautifulSoup(html, "html.parser")
    cards = soup.select("li.item-card[data-product-id]")
    if not cards:
        logger.debug("[booth] No item cards found for keyword=%s", keyword)
        return []

    return _apply_price_filter(_parse_booth_cards(cards, "booth"), min_price, max_price)


async def scrape_booth_circle(
    page: Page,
    circle_id: str,
) -> list[WatcherItem]:
    """
    Scrape newest items from a BOOTH shop's new-arrival page using Playwright.

    URL: https://{circle_id}.booth.pm/?adult=t&sort=new_arrival
    Subdomain pages are protected by Cloudflare challenges that block httpx,
    so Playwright (headless browser) is required.
    Items are rendered client-side; data is embedded in li[data-item] JSON attributes.
    No price-range filtering — returns all found items.
    Never raises — returns [] on any error.
    """
    url = f"https://{circle_id}.booth.pm/?adult=t&sort=new_arrival"
    try:
        await page.context.add_cookies([{
            "name": "adult",
            "value": "t",
            "domain": f"{circle_id}.booth.pm",
            "path": "/",
        }])
    except Exception as exc:
        logger.warning("[booth-circle] Failed to set cookies for circle_id=%s: %s", circle_id, exc)
    try:
        resp = await page.goto(url, timeout=15_000, wait_until="domcontentloaded")
        if resp and resp.status >= 400:
            logger.warning("[booth-circle] HTTP %s for circle_id=%s", resp.status, circle_id)
            return []
        # Invalid shop subdomains redirect to booth.pm main page — detect and bail out.
        final_url = page.url
        if f"{circle_id}.booth.pm" not in final_url:
            logger.warning("[booth-circle] Redirected away for circle_id=%s (url=%s)", circle_id, final_url)
            return []
        try:
            await page.wait_for_selector("li[data-item]", timeout=5_000)
        except PWTimeout:
            logger.debug("[booth-circle] No data-item elements appeared for circle_id=%s", circle_id)
            return []
    except Exception as exc:
        logger.warning("[booth-circle] Navigation failed for circle_id=%s: %s", circle_id, exc)
        return []

    elements = await page.query_selector_all("li[data-item]")
    if not elements:
        logger.debug("[booth-circle] No data-item elements found for circle_id=%s", circle_id)
        return []

    items: list[WatcherItem] = []
    seen_ids: set[str] = set()

    for el in elements:
        try:
            raw = await el.get_attribute("data-item")
            if not raw:
                continue
            data = json.loads(raw)

            item_id = str(data.get("id", "")).strip()
            if not item_id or item_id in seen_ids:
                continue
            seen_ids.add(item_id)

            name = (data.get("name") or "").strip()[:120]
            if not name:
                continue

            price = _parse_price(str(data.get("price", "")))

            shop = data.get("shop", {})

            thumb_urls = data.get("thumbnail_image_urls", [])
            image_url = thumb_urls[0] if thumb_urls else None

            items.append(
                WatcherItem(
                    platform="booth",
                    item_id=item_id,
                    name=name,
                    price=price,
                    url=f"{_BASE_URL}/zh-tw/items/{item_id}",
                    image_url=image_url,
                    seller_name=shop.get("name") or None,
                    seller_id=circle_id,
                )
            )
        except Exception as exc:
            logger.debug("[booth-circle] Parse error: %s", exc)

    return items
