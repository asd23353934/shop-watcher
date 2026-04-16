"""
Animate Taiwan online shop scraper (animate-onlineshop.com.tw).

URL: /Form/Product/ProductList.aspx?KeyWord={keyword}&sort=07&udns=1
sort=07 = newest arrivals. ASP.NET SSR — full product data in initial HTML.
No Playwright needed.
"""

import logging
import re
from typing import Optional
from urllib.parse import quote, urljoin, parse_qs, urlparse

import httpx
from bs4 import BeautifulSoup
from playwright.async_api import Page

from src.watchers.base import WatcherItem
from src.scrapers._price_utils import _apply_price_filter

logger = logging.getLogger(__name__)

_BASE_URL = "https://www.animate-onlineshop.com.tw"

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8",
    "Referer": _BASE_URL + "/",
}


def _parse_nt_price(text: str) -> Optional[float]:
    """Parse NT$ price string, returning lowest numeric value found."""
    numbers = re.findall(r"[\d,]+", text)
    if not numbers:
        return None
    try:
        values = [float(n.replace(",", "")) for n in numbers]
        return min(values)  # discounted (lower) price takes priority
    except ValueError:
        return None


async def scrape_animate(
    page: Page,
    keyword: str,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
) -> list[WatcherItem]:
    """
    Search Animate Taiwan for newest anime merchandise matching keyword.

    Parses ASP.NET SSR HTML. No Playwright used.
    Never raises — returns [] on any error.
    """
    url = (
        f"{_BASE_URL}/Form/Product/ProductList.aspx"
        f"?KeyWord={quote(keyword)}&sort=07&udns=1"
    )
    try:
        async with httpx.AsyncClient(headers=_HEADERS, timeout=15, follow_redirects=True) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            html = resp.text
    except Exception as exc:
        logger.warning("[animate] Request failed for keyword=%s: %s", keyword, exc)
        return []

    soup = BeautifulSoup(html, "html.parser")

    # Product cards: <li> elements containing a link to ProductDetail.aspx?pid=...
    product_links = soup.select('a[href*="ProductDetail.aspx"]')
    if not product_links:
        logger.debug("[animate] No product cards found for keyword=%s", keyword)
        return []

    items: list[WatcherItem] = []
    seen_ids: set[str] = set()

    for a in product_links:
        try:
            href = a.get("href", "")
            parsed = urlparse(href)
            params = parse_qs(parsed.query)
            pid = params.get("pid", [None])[0]
            if not pid or pid in seen_ids:
                continue
            seen_ids.add(pid)

            # Name: try title element, then img alt (image-only links), then link text
            name = ""
            title_el = a.select_one(".proName, .product-name, .name, p, span")
            if title_el:
                name = title_el.get_text(strip=True)
            if not name:
                img_el = a.select_one("img")
                name = img_el.get("alt", "").strip() if img_el else ""
            if not name:
                name = a.get_text(separator=" ", strip=True)
            name = name[:120]
            if not name:
                continue

            # Price: look in parent container for price elements
            container = a.parent or a
            price = None
            price_el = container.select_one(
                '[class*="price"], [class*="Price"], .proPrice, .special-price'
            )
            if price_el:
                price = _parse_nt_price(price_el.get_text())

            # Image
            img = a.select_one("img") or (container.select_one("img") if container else None)
            image_url = None
            if img:
                src = img.get("src", "") or img.get("data-src", "")
                if src and not src.startswith("data:"):
                    image_url = src if src.startswith("http") else urljoin(_BASE_URL, src)

            detail_url = (
                f"{_BASE_URL}/Form/Product/ProductDetail.aspx?shop=0&pid={pid}"
            )

            items.append(
                WatcherItem(
                    platform="animate",
                    item_id=pid,
                    name=name,
                    price=price,
                    url=detail_url,
                    image_url=image_url,
                )
            )
        except Exception as exc:
            logger.debug("[animate] Parse error: %s", exc)

    return _apply_price_filter(items, min_price, max_price)
