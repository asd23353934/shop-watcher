"""
PChome 24h scraper using official JSON search API.

API: https://ecshweb.pchome.com.tw/search/v3.3/all/results?q={keyword}&sort=new&offset=0
Returns JSON with prods[] array. No Playwright needed.
"""

import logging
from typing import Optional
from urllib.parse import quote

import httpx
from playwright.async_api import Page

from src.watchers.base import WatcherItem
from src.scrapers._price_utils import _apply_price_filter

logger = logging.getLogger(__name__)

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8",
    "Referer": "https://24h.pchome.com.tw/",
}

_IMAGE_BASE = "https://cs-b.ecimg.tw"


async def scrape_pchome(
    page: Page,  # unused — kept for consistent scraper signature
    keyword: str,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
) -> list[WatcherItem]:
    """
    Search PChome 24h for newest listings matching keyword.

    Uses official JSON API — no Playwright. page parameter is accepted for
    interface consistency but not used.
    Returns list of WatcherItem, filtered by price range if configured.
    Never raises — returns [] on any error.
    """
    url = (
        f"https://ecshweb.pchome.com.tw/search/v3.3/all/results"
        f"?q={quote(keyword)}&sort=new&offset=0"
    )
    try:
        async with httpx.AsyncClient(headers=_HEADERS, timeout=15, follow_redirects=True) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()
    except Exception as exc:
        logger.warning("[pchome] Request failed for keyword=%s: %s", keyword, exc)
        return []

    prods = data.get("prods") or []
    if not prods:
        logger.debug("[pchome] No products found for keyword=%s", keyword)
        return []

    items: list[WatcherItem] = []
    for prod in prods:
        try:
            item_id = str(prod.get("Id", "")).strip()
            if not item_id:
                continue

            name = str(prod.get("name", "")).strip()[:120]
            if not name:
                continue

            raw_price = prod.get("price")
            price = float(raw_price) if raw_price is not None else None

            pic_b = prod.get("picB", "")
            image_url = f"{_IMAGE_BASE}{pic_b}" if pic_b else None

            items.append(
                WatcherItem(
                    platform="pchome",
                    item_id=item_id,
                    name=name,
                    price=price,
                    url=f"https://24h.pchome.com.tw/prod/{item_id}",
                    image_url=image_url,
                )
            )
        except Exception as exc:
            logger.debug("[pchome] Parse error: %s", exc)

    return _apply_price_filter(items, min_price, max_price)
