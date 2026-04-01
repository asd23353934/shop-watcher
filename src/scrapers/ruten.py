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
from src.scrapers.shopee import _apply_price_filter, _parse_price

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

    for a in links[:30]:
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

            # ── Name & Seller ─────────────────────────────────────────────
            # Ruten item name is extracted from the card text
            # Ruten seller name is the second non-empty line of card text
            raw_text = (await a.inner_text()).strip()
            lines = [
                ln.strip()
                for ln in raw_text.split("\n")
                if ln.strip() and not ln.strip().isdigit()
            ]
            name = lines[0] if lines else ""
            seller_name = lines[1] if len(lines) > 1 else None

            if not name:
                img_el = await a.query_selector("img")
                if img_el:
                    name = (await img_el.get_attribute("alt") or "").strip()
            if not name:
                name = f"item-{item_id}"

            # ── Price ─────────────────────────────────────────────────────
            price = None
            try:
                container = await a.evaluate_handle(
                    "el => el.closest('li') || el.closest('article') || el.parentElement"
                )
                if container:
                    price_el = await container.query_selector(
                        '[class*="price"],[class*="Price"]'
                    )
                    if price_el:
                        price = _parse_price(await price_el.inner_text())
            except Exception:
                pass

            # ── Image ─────────────────────────────────────────────────────
            # Ruten product image is extracted from the card
            image_url = None
            try:
                img_el = await a.query_selector("img")
                if not img_el:
                    container = await a.evaluate_handle(
                        "el => el.closest('li') || el.closest('article') || el.parentElement"
                    )
                    if container:
                        img_el = await container.query_selector("img")
                if img_el:
                    src = await img_el.get_attribute("src") or ""
                    if src.startswith("data:"):
                        src = await img_el.get_attribute("data-src") or ""
                    image_url = src or None
            except Exception:
                pass

            # ── URL ───────────────────────────────────────────────────────
            full_url = (
                href
                if href.startswith("http")
                else f"https://www.ruten.com.tw/item/{item_id}/"
            )

            items.append(
                WatcherItem(
                    platform="ruten",
                    item_id=item_id,
                    name=name[:120],
                    price=price,
                    url=full_url,
                    image_url=image_url,
                    seller_name=seller_name[:80] if seller_name else None,
                )
            )
        except Exception as exc:
            logger.debug("[ruten] Parse error: %s", exc)

    return _apply_price_filter(items, min_price, max_price)
