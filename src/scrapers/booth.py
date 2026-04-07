"""
BOOTH (booth.pm) scraper — SSR HTML with data attributes.

URL: https://booth.pm/zh-tw/search/{keyword}?adult=t&sort=new_arrival
adult=t bypasses age verification — exposes all products including R18.
sort=new_arrival returns newest listings first.
Products are embedded as li.item-card with data-product-* attributes. No Playwright needed.
"""

import logging
import re
from typing import Optional
from urllib.parse import quote

import httpx
from bs4 import BeautifulSoup
from playwright.async_api import Page

from src.watchers.base import WatcherItem
from src.scrapers.shopee import _apply_price_filter

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


async def scrape_booth(
    page: Page,
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
        async with httpx.AsyncClient(headers=_HEADERS, timeout=20, follow_redirects=True) as client:
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

    items: list[WatcherItem] = []
    seen_ids: set[str] = set()

    for card in cards:
        try:
            item_id = card.get("data-product-id", "").strip()
            if not item_id or item_id in seen_ids:
                continue
            seen_ids.add(item_id)

            name = card.get("data-product-name", "").strip()[:120]
            if not name:
                # Fallback: title element inside card
                title_el = card.select_one(".item-card__title, .caption")
                name = title_el.get_text(strip=True)[:120] if title_el else ""
            if not name:
                continue

            raw_price = card.get("data-product-price", "")
            price = float(raw_price) if raw_price else None

            # Image: data-original on .item-card__thumbnail-image (lazy loaded)
            img_el = card.select_one("[data-original]")
            image_url = img_el.get("data-original") if img_el else None

            # Shop (seller) name — BOOTH uses data-shop-name on the card element
            seller_name = card.get("data-shop-name", "").strip() or None
            seller_id = card.get("data-shop-id", "").strip() or None
            if not seller_name:
                # Fallback: shop name element inside card
                shop_el = card.select_one(".item-card__shop, .shop-name")
                seller_name = shop_el.get_text(strip=True)[:80] if shop_el else None
            if seller_name:
                seller_name = seller_name[:80]

            product_url = f"{_BASE_URL}/zh-tw/items/{item_id}"

            items.append(
                WatcherItem(
                    platform="booth",
                    item_id=item_id,
                    name=name,
                    price=price,
                    url=product_url,
                    image_url=image_url,
                    seller_name=seller_name,
                    seller_id=seller_id,
                )
            )
        except Exception as exc:
            logger.debug("[booth] Parse error: %s", exc)

    return _apply_price_filter(items, min_price, max_price)


async def scrape_booth_circle(
    page,  # Page (unused — kept for consistent scraper signature)
    circle_id: str,
) -> list[WatcherItem]:
    """
    Scrape newest items from a BOOTH shop's new-arrival page.

    URL: https://{circle_id}.booth.pm/?adult=t&sort=new_arrival
    Parses the same li.item-card[data-product-id] structure as keyword search.
    No price-range filtering — returns all found items.
    Never raises — returns [] on any error.
    """
    url = f"https://{circle_id}.booth.pm/?adult=t&sort=new_arrival"
    try:
        async with httpx.AsyncClient(headers=_HEADERS, timeout=20, follow_redirects=True) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            html = resp.text
    except Exception as exc:
        logger.warning("[booth-circle] Request failed for circle_id=%s: %s", circle_id, exc)
        return []

    soup = BeautifulSoup(html, "html.parser")
    cards = soup.select("li.item-card[data-product-id]")
    if not cards:
        logger.debug("[booth-circle] No item cards found for circle_id=%s", circle_id)
        return []

    items: list[WatcherItem] = []
    seen_ids: set[str] = set()

    for card in cards:
        try:
            item_id = card.get("data-product-id", "").strip()
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

            product_url = f"{_BASE_URL}/zh-tw/items/{item_id}"

            items.append(
                WatcherItem(
                    platform="booth",
                    item_id=item_id,
                    name=name,
                    price=price,
                    url=product_url,
                    image_url=image_url,
                    seller_name=seller_name,
                    seller_id=seller_id,
                )
            )
        except Exception as exc:
            logger.debug("[booth-circle] Parse error: %s", exc)

    return items
