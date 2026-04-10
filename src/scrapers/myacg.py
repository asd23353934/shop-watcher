"""
買動漫 (MyACG / myacg.com.tw) scraper.

AJAX endpoint: /goods_list_show_002.php?keyword_body={keyword}&sort=1&page=1&ct18=1
sort=1 = newest first. ct18=1 includes R18 doujinshi / adult anime merchandise.
The endpoint returns an HTML fragment directly (no full page rendering needed).
Age modal is frontend-only — AJAX endpoint does not enforce it. No Playwright needed.
"""

import logging
import re
from typing import Optional
from urllib.parse import quote

import httpx
from bs4 import BeautifulSoup
from playwright.async_api import Page

from src.watchers.base import WatcherItem
from src.scrapers.shopee import _apply_price_filter, _parse_price

logger = logging.getLogger(__name__)

_BASE_URL = "https://www.myacg.com.tw"
_AJAX_URL = _BASE_URL + "/goods_list_show_002.php"
_DETAIL_URL = _BASE_URL + "/goods_detail.php?gid={gid}"

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8",
    "Referer": _BASE_URL + "/",
    "X-Requested-With": "XMLHttpRequest",
}


async def scrape_myacg(
    page: Page,
    keyword: str,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
) -> list[WatcherItem]:
    """
    Search 買動漫 (MyACG) for newest listings matching keyword.

    Calls AJAX sub-endpoint directly — bypasses frontend age modal.
    ct18=1 includes R18 products. No Playwright used.
    price may be null if not present in AJAX fragment.
    Never raises — returns [] on any error.
    """
    params = {
        "keyword_body": keyword,
        "sort": "1",
        "page": "1",
        "ct18": "1",
    }
    try:
        async with httpx.AsyncClient(headers=_HEADERS, timeout=20, follow_redirects=True) as client:
            resp = await client.get(_AJAX_URL, params=params)
            resp.raise_for_status()
            html = resp.text
    except Exception as exc:
        logger.warning("[myacg] Request failed for keyword=%s: %s", keyword, exc)
        return []

    soup = BeautifulSoup(html, "html.parser")

    # Each product: <li> or container with a link to goods_detail.php?gid=...
    product_links = soup.select('a[href*="goods_detail.php"]')
    if not product_links:
        logger.debug("[myacg] No product links found for keyword=%s", keyword)
        return []

    items: list[WatcherItem] = []
    seen_gids: set[str] = set()

    for a in product_links:
        try:
            href = a.get("href", "")
            m = re.search(r"gid=(\d+)", href)
            if not m:
                continue
            gid = m.group(1)
            if gid in seen_gids:
                continue
            seen_gids.add(gid)

            # Each product is wrapped in <li> containing div.pic and div.name
            li = a.find_parent("li")

            # Name: prefer div.name > a text (more reliable than img alt which may be garbled)
            name = ""
            if li:
                name_a = li.select_one("div.name a")
                if name_a:
                    name = name_a.get_text(strip=True)[:120]
            if not name:
                img_el = a.select_one("img")
                name = (img_el.get("alt", "") if img_el else a.get_text(separator=" ", strip=True)).strip()[:120]
            if not name:
                continue

            # Image: CDN image from cdn.myacg.com.tw
            img = a.select_one("img")
            image_url = None
            if img:
                src = img.get("src", "") or img.get("data-src", "")
                if src and not src.startswith("data:"):
                    image_url = src if src.startswith("http") else _BASE_URL + src

            # Price: in <li> > div.name > p (e.g. "售價: 219")
            price = None
            if li:
                price_p = li.select_one("div.name p")
                if price_p:
                    price = _parse_price(price_p.get_text())

            items.append(
                WatcherItem(
                    platform="myacg",
                    item_id=gid,
                    name=name,
                    price=price,
                    url=_DETAIL_URL.format(gid=gid),
                    image_url=image_url,
                )
            )
        except Exception as exc:
            logger.debug("[myacg] Parse error: %s", exc)

    return _apply_price_filter(items, min_price, max_price)
