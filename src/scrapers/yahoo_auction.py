"""
Yahoo拍賣 (tw.bid.yahoo.com) scraper.

URL: https://tw.bid.yahoo.com/search/auction/product?p={keyword}&sort=ontime
Products are embedded in __NEXT_DATA__ JSON in the initial HTML response.
sort=ontime returns newest listed auctions first. No Playwright needed.
"""

import json
import logging
import re
from typing import Optional
from urllib.parse import quote

import httpx
from playwright.async_api import Page

from src.watchers.base import WatcherItem
from src.scrapers.shopee import _apply_price_filter, _parse_price

logger = logging.getLogger(__name__)

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8",
    "Referer": "https://tw.bid.yahoo.com/",
}

_ITEM_URL_BASE = "https://tw.bid.yahoo.com/item/"


def _extract_item_id_from_url(url: str) -> Optional[str]:
    """Extract numeric item ID from Yahoo auction item URL."""
    m = re.search(r"/item/(\d+)", url)
    return m.group(1) if m else None


def _walk_for_products(obj: object) -> list[dict]:
    """Recursively search JSON structure for a list containing auction product dicts."""
    if isinstance(obj, list):
        # Check if this list looks like product listings
        if obj and isinstance(obj[0], dict):
            sample = obj[0]
            if any(k in sample for k in ("title", "itemUrl", "currentPrice", "price", "auctionID")):
                return obj
        for item in obj:
            result = _walk_for_products(item)
            if result:
                return result
    elif isinstance(obj, dict):
        for value in obj.values():
            result = _walk_for_products(value)
            if result:
                return result
    return []


async def scrape_yahoo_auction(
    page: Page,
    keyword: str,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
) -> list[WatcherItem]:
    """
    Search Yahoo拍賣 for newest auction listings matching keyword.

    Extracts __NEXT_DATA__ JSON from SSR HTML. No Playwright used.
    Never raises — returns [] on any error.
    """
    url = (
        f"https://tw.bid.yahoo.com/search/auction/product"
        f"?p={quote(keyword)}&sort=ontime"
    )
    try:
        async with httpx.AsyncClient(headers=_HEADERS, timeout=20, follow_redirects=True) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            html = resp.text
    except Exception as exc:
        logger.warning("[yahoo-auction] Request failed for keyword=%s: %s", keyword, exc)
        return []

    # Extract isoredux-data JSON (Yahoo拍賣 embeds product data in isoredux Redux state)
    m = re.search(r'<script id="isoredux-data"[^>]*>(.*?)</script>', html, re.DOTALL)
    if not m:
        logger.warning("[yahoo-auction] No isoredux-data found for keyword=%s", keyword)
        return []

    try:
        redux_data = json.loads(m.group(1))
    except json.JSONDecodeError as exc:
        logger.warning("[yahoo-auction] JSON parse error for keyword=%s: %s", keyword, exc)
        return []

    try:
        hits = redux_data["search"]["ecsearch"]["hits"]
    except (KeyError, TypeError):
        logger.debug("[yahoo-auction] No hits in isoredux-data for keyword=%s", keyword)
        return []

    if not hits:
        return []

    items: list[WatcherItem] = []
    seen_ids: set[str] = set()

    for prod in hits:
        try:
            name = str(prod.get("ec_title") or "").strip()[:120]
            if not name:
                continue

            item_url = prod.get("ec_item_url") or ""
            item_id = str(prod.get("ec_productid") or prod.get("ec_auid") or "")
            if not item_id:
                item_id = _extract_item_id_from_url(item_url)
            if not item_id or item_id in seen_ids:
                continue
            seen_ids.add(item_id)

            if not item_url:
                item_url = f"{_ITEM_URL_BASE}{item_id}"

            raw_price = prod.get("ec_price") or prod.get("ec_buyprice") or prod.get("ec_listprice")
            price = float(raw_price) if raw_price else None

            image_url = prod.get("ec_image") or prod.get("ec_img_uri") or None
            if image_url:
                image_url = str(image_url)

            items.append(
                WatcherItem(
                    platform="yahoo-auction",
                    item_id=item_id,
                    name=name,
                    price=price,
                    url=item_url,
                    image_url=image_url,
                )
            )
        except Exception as exc:
            logger.debug("[yahoo-auction] Parse error: %s", exc)

    return _apply_price_filter(items, min_price, max_price)
