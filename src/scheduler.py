"""
Watcher Scheduler — asyncio loop that drives all keyword-platform scans.

- Reads keywords from Next.js API before each cycle
- Shares one Playwright browser instance per scan cycle
- Reports found items to Next.js API
- Runs indefinitely; exits cleanly on KeyboardInterrupt / SIGTERM
"""

import asyncio
import json
import logging
import os
import signal
from datetime import datetime, timezone
from typing import Optional

import httpx
from playwright.async_api import async_playwright

from src.api_client import WorkerApiClient
from src.scrapers.shopee import scrape_shopee
from src.scrapers.ruten import scrape_ruten

logger = logging.getLogger(__name__)


async def _notify_scrape_error(platform: str, keyword: str, error: Exception) -> None:
    """Send a Discord error embed when scraping fails. No-op if DISCORD_ERROR_WEBHOOK is not set."""
    webhook_url = os.environ.get("DISCORD_ERROR_WEBHOOK", "")
    if not webhook_url:
        return
    payload = {
        "embeds": [{
            "title": "⚠️ 爬取失敗",
            "color": 0xFF0000,
            "fields": [
                {"name": "平台", "value": platform, "inline": True},
                {"name": "關鍵字", "value": keyword, "inline": True},
                {"name": "錯誤", "value": str(error)[:1000]},
            ],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }]
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(webhook_url, json=payload)
    except Exception as exc:
        logger.warning("Failed to send Discord error notification: %s", exc)


def _get_check_interval() -> int:
    """Read CHECK_INTERVAL from env, default 300."""
    try:
        return int(os.environ.get("CHECK_INTERVAL", "300"))
    except ValueError:
        return 300


def _apply_must_include_filter(items: list, must_include: list[str]) -> list:
    """
    Discard items whose name does NOT contain ALL terms in must_include (case-insensitive).
    Returns items unchanged when must_include is empty.
    """
    if not must_include:
        return items
    lower_terms = [t.lower() for t in must_include if t.strip()]
    if not lower_terms:
        return items
    return [item for item in items if all(t in item.name.lower() for t in lower_terms)]


def _apply_match_mode_filter(items: list, keyword_text: str, match_mode: str) -> list:
    """
    Filter items by how keyword_text matches the item name (case-insensitive).

    any   — item name contains at least one whitespace-split token (default / no-op)
    all   — item name contains every whitespace-split token
    exact — item name contains the full keyword_text as a substring
    """
    if match_mode == "any" or not keyword_text.strip():
        return items

    name_lower_getter = lambda item: item.name.lower()  # noqa: E731

    if match_mode == "exact":
        needle = keyword_text.lower()
        return [item for item in items if needle in name_lower_getter(item)]

    if match_mode == "all":
        tokens = [t.lower() for t in keyword_text.split() if t.strip()]
        if not tokens:
            return items
        return [item for item in items if all(t in name_lower_getter(item) for t in tokens)]

    # Unknown mode — pass through without filtering
    logger.warning("Unknown matchMode '%s', skipping matchMode filter", match_mode)
    return items


async def run_scan_cycle(api: WorkerApiClient) -> None:
    """
    Execute one full scan cycle:
    1. Fetch keywords from API
    2. Launch one shared browser (A single Playwright browser instance is shared across all searches in one scan cycle)
    3. For each keyword × platform, scrape and report items
    4. Close browser
    """
    keywords = await api.get_keywords()

    if not keywords:
        logger.info("No active keywords, skipping scan")
        return

    # Launch shared browser instance
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-blink-features=AutomationControlled",
                "--disable-dev-shm-usage",
            ],
        )
        context = await browser.new_context(
            viewport={"width": 1280, "height": 900},
            locale="zh-TW",
            timezone_id="Asia/Taipei",
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
        )

        # Inject Shopee session cookies if provided (bypasses fraud detection)
        shopee_cookies_json = os.environ.get("SHOPEE_COOKIES_JSON", "")
        if shopee_cookies_json:
            try:
                shopee_cookies = json.loads(shopee_cookies_json)
                # Normalize sameSite: Playwright only accepts Strict|Lax|None
                _valid_samesite = {"Strict", "Lax", "None"}
                for c in shopee_cookies:
                    if c.get("sameSite") not in _valid_samesite:
                        c["sameSite"] = "Lax"
                await context.add_cookies(shopee_cookies)
                logger.info("Shopee cookies injected: %d cookies", len(shopee_cookies))
            except Exception as exc:
                logger.warning("Failed to inject Shopee cookies: %s", exc)

        try:
            for kw in keywords:
                keyword_id: str = kw.get("id", "")
                keyword_text: str = kw.get("keyword", "")
                platforms: list[str] = kw.get("platforms", ["shopee", "ruten"])
                min_price: Optional[float] = kw.get("minPrice")
                max_price: Optional[float] = kw.get("maxPrice")

                # Each keyword-platform pair is searched independently
                # Blocklist: lower-cased forbidden terms for this keyword
                blocklist = [w.lower() for w in kw.get("blocklist", []) if w.strip()]
                must_include: list[str] = kw.get("mustInclude", [])
                match_mode: str = kw.get("matchMode", "any")

                # Each keyword-platform pair is searched independently
                for platform in platforms:
                    page = await context.new_page()
                    try:
                        if platform == "shopee":
                            items = await scrape_shopee(
                                page, keyword_text, min_price, max_price
                            )
                        elif platform == "ruten":
                            items = await scrape_ruten(
                                page, keyword_text, min_price, max_price
                            )
                        else:
                            logger.warning("Unknown platform: %s", platform)
                            items = []
                    except Exception as exc:
                        logger.error(
                            "[%s] %s — unhandled error: %s",
                            platform, keyword_text, exc,
                        )
                        await _notify_scrape_error(platform, keyword_text, exc)
                        items = []
                    finally:
                        await page.close()

                    # Scraped items are filtered by keyword blocklist before notification
                    if blocklist:
                        before = len(items)
                        items = [
                            item for item in items
                            if not any(word in item.name.lower() for word in blocklist)
                        ]
                        filtered = before - len(items)
                        if filtered:
                            logger.debug(
                                "[%s] %s — blocked %d item(s) by blocklist",
                                platform, keyword_text, filtered,
                            )

                    # Scraped items are filtered by mustInclude before notification
                    before = len(items)
                    items = _apply_must_include_filter(items, must_include)
                    if len(items) < before:
                        logger.debug(
                            "[%s] %s — mustInclude filtered %d item(s)",
                            platform, keyword_text, before - len(items),
                        )

                    # Scraped items are filtered by matchMode before notification
                    before = len(items)
                    items = _apply_match_mode_filter(items, keyword_text, match_mode)
                    if len(items) < before:
                        logger.debug(
                            "[%s] %s — matchMode(%s) filtered %d item(s)",
                            platform, keyword_text, match_mode, before - len(items),
                        )

                    # Batch-report all filtered items in a single API call
                    result = await api.notify_batch(keyword_id, items)
                    new_count = result.get("new", 0)
                    dup_count = result.get("duplicate", 0)

                    # Per-scan summary is logged to stdout
                    logger.info(
                        "[%s] %s — %d found, %d new, %d duplicate",
                        platform, keyword_text, len(items), new_count, dup_count,
                    )
        finally:
            # Browser is always closed after a scan cycle
            await browser.close()

    # Record scan completion time
    scanned_at = datetime.now(timezone.utc).isoformat()
    await api.post_scan_log(scanned_at)
    logger.info("Scan cycle complete, logged scannedAt=%s", scanned_at)


async def run_scheduler() -> None:
    """
    Main scheduler loop. Runs indefinitely until interrupted.

    Validates environment variables before entering the loop
    (Application environment is validated before the scheduler starts).
    """
    # Validate required env vars
    if not os.environ.get("WORKER_SECRET"):
        raise SystemExit("WORKER_SECRET is required")
    if not os.environ.get("NEXT_PUBLIC_API_URL"):
        raise SystemExit("NEXT_PUBLIC_API_URL is required")

    interval = _get_check_interval()
    logger.info("Shop Watcher started (interval=%ds)", interval)

    api = WorkerApiClient()
    stop_event = asyncio.Event()

    def _handle_signal(sig, frame):  # noqa: ARG001
        logger.info("Received signal %s, shutting down...", sig)
        stop_event.set()

    # Scheduler runs indefinitely until interrupted
    signal.signal(signal.SIGTERM, _handle_signal)

    try:
        while not stop_event.is_set():
            try:
                await run_scan_cycle(api)
            except Exception as exc:
                logger.error("Scan cycle error: %s", exc)

            # Sleep between scans, but wake up early if stopped
            try:
                await asyncio.wait_for(stop_event.wait(), timeout=interval)
            except asyncio.TimeoutError:
                pass
    except KeyboardInterrupt:
        logger.info("KeyboardInterrupt received, shutting down...")
    finally:
        await api.close()
        logger.info("Shop Watcher stopped.")
