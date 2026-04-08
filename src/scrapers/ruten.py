"""
Ruten (露天拍賣) scraper using Playwright headless Chromium.

Ruten is a SPA — wait for domcontentloaded then sleep 4s for JS render.
URL format: https://www.ruten.com.tw/item/{22-digit-id}/
"""

import asyncio
import logging
import re
from typing import Optional

from playwright.async_api import Page

from src.watchers.base import WatcherItem
from src.scrapers.shopee import _apply_price_filter, _parse_price, _extract_price_text

logger = logging.getLogger(__name__)

SPA_WAIT = 4  # seconds after domcontentloaded


async def scrape_ruten(
    page: Page,
    keyword: str,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
) -> list[WatcherItem]:
    """
    Search Ruten for newest listings matching keyword.

    Returns list of WatcherItem, filtered by price range if configured.
    Never raises — returns [] on any error.
    """
    search_url = f"https://www.ruten.com.tw/find/?q={keyword}&sort=new"
    try:
        await page.goto(
            search_url, timeout=20_000, wait_until="domcontentloaded"
        )
        # Ruten search returns newest listings via Playwright — wait for SPA render
        await asyncio.sleep(SPA_WAIT)
    except Exception as exc:
        logger.error("[ruten] Navigation error: %s", exc)
        return []

    # ── Extract product links ──────────────────────────────────────────────
    # Ruten item ID and URL are extracted from the product card link
    links = await page.query_selector_all('a[href*="ruten.com.tw/item/"]')

    if not links:
        # Fallback to goods.ruten.com.tw format (legacy)
        links = await page.query_selector_all('a[href*="goods.ruten"]')
        if not links:
            # Ruten search timeout returns empty list
            logger.warning("[ruten] No product links found for keyword=%s", keyword)
            return []

    items: list[WatcherItem] = []
    seen_ids: set[str] = set()

    for a in links[:60]:
        try:
            href = await a.get_attribute("href") or ""

            # Format 1: ruten.com.tw/item/{10+ digit id}/
            m = re.search(r"/item/(\d{10,})", href)
            # Format 2: goods.ruten.com.tw/item/show?{id}
            if not m:
                m = re.search(r"show\?(\d+)", href)
            if not m:
                continue

            item_id = m.group(1)
            if item_id in seen_ids:
                continue
            seen_ids.add(item_id)

            # ── Card container ────────────────────────────────────────────
            # Ruten is a SPA; the anchor may wrap only the thumbnail image.
            # We resolve the closest card container to extract name/seller/image.
            try:
                container = await a.evaluate_handle(
                    "el => el.closest('article') || el.closest('li') || el.closest('[class*=\"card\"]') || el.parentElement"
                )
            except Exception:
                container = None

            # ── Name ─────────────────────────────────────────────────────
            # Try container title/name elements first (robust against anchor-only-wraps-image pattern)
            name = ""
            seller_name = None
            if container:
                for sel in [
                    '[class*="title"]',
                    '[class*="name"]',
                    '[class*="goods-name"]',
                    '[class*="product-name"]',
                    'h2', 'h3', 'h4',
                ]:
                    try:
                        el = await container.query_selector(sel)
                        if el:
                            text = (await el.inner_text()).strip()
                            if text and not text.isdigit() and len(text) > 1:
                                name = text
                                break
                    except Exception:
                        pass

            if not name:
                # Fallback: read anchor inner_text (pre-SPA-change behaviour)
                raw_text = (await a.inner_text()).strip()
                lines = [
                    ln.strip()
                    for ln in raw_text.split("\n")
                    if ln.strip() and not ln.strip().isdigit()
                ]
                # Ignore lines that are clearly icon alt text (short all-ASCII)
                product_lines = [
                    ln for ln in lines
                    if len(ln) > 3 and not ln.isascii()
                ]
                if product_lines:
                    name = product_lines[0]
                    seller_name = product_lines[1] if len(product_lines) > 1 else None
                elif lines:
                    name = lines[0]

            if not name:
                name = f"item-{item_id}"

            # ── Seller ────────────────────────────────────────────────────
            if not seller_name and container:
                for sel in ['[class*="seller"]', '[class*="shop"]', '[class*="store"]']:
                    try:
                        el = await container.query_selector(sel)
                        if el:
                            text = (await el.inner_text()).strip()
                            if text:
                                seller_name = text
                                break
                    except Exception:
                        pass

            # ── Price ─────────────────────────────────────────────────────
            price = None
            price_text = None
            try:
                if container:
                    price_el = await container.query_selector(
                        '[class*="price"],[class*="Price"]'
                    )
                    if price_el:
                        raw_price_text = await price_el.inner_text()
                        price = _parse_price(raw_price_text)
                        price_text = _extract_price_text(raw_price_text)
            except Exception:
                pass

            # ── Image ─────────────────────────────────────────────────────
            # Try data-src / lazy-src first (Ruten uses lazy loading in SPA)
            image_url = None
            try:
                img_el = await a.query_selector("img")
                if not img_el and container:
                    img_el = await container.query_selector("img")
                if img_el:
                    # Priority: data-src → lazy-src → data-lazy-src → src
                    src = ""
                    for attr in ("data-src", "lazy-src", "data-lazy-src", "src"):
                        src = await img_el.get_attribute(attr) or ""
                        if src and not src.startswith("data:"):
                            break
                    image_url = src or None
            except Exception:
                pass

            # ── URL ───────────────────────────────────────────────────────
            full_url = (
                href
                if href.startswith("http")
                else f"https://www.ruten.com.tw/item/{item_id}/"
            )

            # Ruten item_id is a 22-digit number; first 10 digits = seller user ID
            seller_id = item_id[:10] if len(item_id) >= 10 else None

            items.append(
                WatcherItem(
                    platform="ruten",
                    item_id=item_id,
                    name=name[:120],
                    price=price,
                    url=full_url,
                    image_url=image_url,
                    seller_name=seller_name[:80] if seller_name else None,
                    seller_id=seller_id,
                    price_text=price_text,
                )
            )
        except Exception as exc:
            logger.debug("[ruten] Parse error: %s", exc)

    return _apply_price_filter(items, min_price, max_price)
