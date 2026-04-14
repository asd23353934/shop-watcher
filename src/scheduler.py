"""
Watcher Scheduler — asyncio loop that drives all keyword-platform scans.

- Reads keywords from Next.js API before each cycle
- Shares one Playwright browser instance + context per scan cycle
- Runs all keyword×platform scans concurrently via asyncio.gather
  with per-platform Semaphore(SEMAPHORE_PER_PLATFORM) to limit load
- Protected by asyncio.wait_for(SCAN_TIMEOUT_SECONDS) at the cycle level
- Reports found items to Next.js API via notify_batch
- Runs indefinitely; exits cleanly on KeyboardInterrupt / SIGTERM
"""

import asyncio
import logging
import os
import signal
from datetime import datetime, timezone
from typing import Optional

import httpx
from playwright.async_api import async_playwright, BrowserContext

from src.api_client import WorkerApiClient
from src.scrapers.ruten import scrape_ruten
from src.scrapers.pchome import scrape_pchome
from src.scrapers.momo import scrape_momo
from src.scrapers.animate import scrape_animate
from src.scrapers.yahoo_auction import scrape_yahoo_auction
from src.scrapers.mandarake import scrape_mandarake
from src.scrapers.myacg import scrape_myacg
from src.scrapers.kingstone import scrape_kingstone
from src.scrapers.booth import scrape_booth, scrape_booth_circle
from src.scrapers.dlsite import scrape_dlsite, scrape_dlsite_circle
from src.scrapers.toranoana import scrape_toranoana
from src.scrapers.melonbooks import scrape_melonbooks

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Environment helpers
# ---------------------------------------------------------------------------

def _get_check_interval() -> int:
    """Read CHECK_INTERVAL from env, default 300."""
    try:
        return int(os.environ.get("CHECK_INTERVAL", "300"))
    except ValueError:
        return 300


def _get_scan_timeout() -> int:
    """Read SCAN_TIMEOUT_SECONDS from env, default 300."""
    try:
        return int(os.environ.get("SCAN_TIMEOUT_SECONDS", "300"))
    except ValueError:
        return 300


def _get_semaphore_limit() -> int:
    """Read SEMAPHORE_PER_PLATFORM from env, default 3."""
    try:
        return max(1, int(os.environ.get("SEMAPHORE_PER_PLATFORM", "3")))
    except ValueError:
        return 3


# ---------------------------------------------------------------------------
# System alert (developer-facing, not user-facing)
# ---------------------------------------------------------------------------

async def send_system_alert(message: str) -> None:
    """
    Send a Discord alert to SYSTEM_ALERT_WEBHOOK (developer channel).
    No-op if SYSTEM_ALERT_WEBHOOK is not set — only logs to stdout.
    Does NOT raise exceptions.
    """
    logger.warning("[SYSTEM ALERT] %s", message)
    webhook_url = os.environ.get("SYSTEM_ALERT_WEBHOOK", "")
    if not webhook_url:
        return
    payload = {
        "embeds": [{
            "title": "⚠️ Shop Watcher 系統告警",
            "description": message,
            "color": 0xFF6600,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }]
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(webhook_url, json=payload)
    except Exception as exc:
        logger.warning("Failed to send system alert: %s", exc)


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


# ---------------------------------------------------------------------------
# Filtering helpers
# ---------------------------------------------------------------------------

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

    logger.warning("Unknown matchMode '%s', skipping matchMode filter", match_mode)
    return items


# ---------------------------------------------------------------------------
# Per-keyword-platform scan task
# ---------------------------------------------------------------------------

async def _scan_one(
    context: BrowserContext,
    semaphores: dict[str, asyncio.Semaphore],
    api: WorkerApiClient,
    kw: dict,
    platform: str,
) -> tuple[str, bool, Optional[str]]:
    """
    Scrape one keyword×platform combination and notify via API.

    Returns (platform, success, error_message).
    Acquires the per-platform Semaphore before scraping.
    """
    keyword_id: str = kw.get("id", "")
    keyword_text: str = kw.get("keyword", "")
    min_price: Optional[float] = kw.get("minPrice")
    max_price: Optional[float] = kw.get("maxPrice")
    blocklist = [w.lower() for w in kw.get("blocklist", []) if w.strip()]
    must_include: list[str] = kw.get("mustInclude", [])
    match_mode: str = kw.get("matchMode", "any")

    # Shopee is suspended — log and skip
    if platform == "shopee":
        logger.warning("[shopee] Platform is suspended, skipping keyword '%s'", keyword_text)
        return platform, True, None

    # Acquire per-platform Semaphore (create lazily at the limit set by env)
    if platform not in semaphores:
        semaphores[platform] = asyncio.Semaphore(_get_semaphore_limit())

    async with semaphores[platform]:
        page = await context.new_page()
        try:
            if platform == "ruten":
                items = await scrape_ruten(page, keyword_text, min_price, max_price)
            elif platform == "pchome":
                items = await scrape_pchome(page, keyword_text, min_price, max_price)
            elif platform == "momo":
                items = await scrape_momo(page, keyword_text, min_price, max_price)
            elif platform == "animate":
                items = await scrape_animate(page, keyword_text, min_price, max_price)
            elif platform == "yahoo-auction":
                items = await scrape_yahoo_auction(page, keyword_text, min_price, max_price)
            elif platform == "mandarake":
                items = await scrape_mandarake(page, keyword_text, min_price, max_price)
            elif platform == "myacg":
                items = await scrape_myacg(page, keyword_text, min_price, max_price)
            elif platform == "kingstone":
                items = await scrape_kingstone(page, keyword_text, min_price, max_price)
            elif platform == "booth":
                items = await scrape_booth(page, keyword_text, min_price, max_price)
            elif platform == "dlsite":
                items = await scrape_dlsite(page, keyword_text, min_price, max_price)
            elif platform == "toranoana":
                items = await scrape_toranoana(page, keyword_text, min_price, max_price)
            elif platform == "melonbooks":
                items = await scrape_melonbooks(page, keyword_text, min_price, max_price)
            else:
                logger.warning("Unknown platform: %s", platform)
                items = []
        except Exception as exc:
            logger.error("[%s] %s — unhandled error: %s", platform, keyword_text, exc)
            await _notify_scrape_error(platform, keyword_text, exc)
            return platform, False, str(exc)
        finally:
            await page.close()

    # Apply filters
    if blocklist:
        before = len(items)
        items = [item for item in items if not any(word in item.name.lower() for word in blocklist)]
        if len(items) < before:
            logger.debug("[%s] %s — blocked %d item(s) by blocklist", platform, keyword_text, before - len(items))

    before = len(items)
    items = _apply_must_include_filter(items, must_include)
    if len(items) < before:
        logger.debug("[%s] %s — mustInclude filtered %d item(s)", platform, keyword_text, before - len(items))

    before = len(items)
    items = _apply_match_mode_filter(items, keyword_text, match_mode)
    if len(items) < before:
        logger.debug("[%s] %s — matchMode(%s) filtered %d item(s)", platform, keyword_text, match_mode, before - len(items))

    # Batch report — forward per-keyword webhook and rate-limit overrides
    result = await api.notify_batch(
        keyword_id,
        items,
        keyword_webhook_url=kw.get("discordWebhookUrl"),
        max_notify_per_scan=kw.get("maxNotifyPerScan"),
    )
    new_count = result.get("new", 0)
    dup_count = result.get("duplicate", 0)

    logger.info("[%s] %s — %d found, %d new, %d duplicate", platform, keyword_text, len(items), new_count, dup_count)
    return platform, True, None


# ---------------------------------------------------------------------------
# CircleFollow scan task
# ---------------------------------------------------------------------------

async def _scan_circle(
    context: BrowserContext,
    semaphores: dict[str, asyncio.Semaphore],
    api: WorkerApiClient,
    follow: dict,
) -> None:
    """
    Scrape a single CircleFollow's new-arrival page and notify via API.

    BOOTH:  https://{circleId}.booth.pm/?adult=t&sort=new_arrival
    DLsite: https://www.dlsite.com/maniax/circle/profile/=/maker_id/{circleId}.html

    Uses per-follow webhookUrl for notifications.
    Deduplication is handled server-side via SeenItem(userId, platform, itemId).
    """
    platform = follow.get("platform", "")
    circle_id = follow.get("circleId", "")
    circle_name = follow.get("circleName", "")
    webhook_url: Optional[str] = follow.get("webhookUrl")
    circle_follow_id = follow.get("id", "")

    if platform not in semaphores:
        semaphores[platform] = asyncio.Semaphore(_get_semaphore_limit())

    async with semaphores[platform]:
        page = await context.new_page()
        try:
            if platform == "booth":
                items = await scrape_booth_circle(page, circle_id)
            elif platform == "dlsite":
                items = await scrape_dlsite_circle(page, circle_id)
            else:
                logger.warning("[circle] Unsupported platform: %s (circle_id=%s)", platform, circle_id)
                return
        except Exception as exc:
            logger.error("[circle/%s] %s — unhandled error: %s", platform, circle_id, exc)
            return
        finally:
            await page.close()

    result = await api.notify_batch(
        keyword_id=None,
        items=items,
        keyword_webhook_url=webhook_url,
        circle_follow_id=circle_follow_id,
    )
    new_count = result.get("new", 0)
    logger.info(
        "[circle/%s] %s (%s) — %d found, %d new",
        platform, circle_id, circle_name, len(items), new_count,
    )


# ---------------------------------------------------------------------------
# Core scan cycle
# ---------------------------------------------------------------------------

async def _run_scan_tasks(
    context: BrowserContext,
    api: WorkerApiClient,
    keywords: list[dict],
) -> None:
    """
    Build all keyword×platform tasks and execute them concurrently with
    asyncio.gather(return_exceptions=True).

    Each platform has a dedicated Semaphore to limit concurrency.
    After gather, per-platform success/failure is reported to the API.
    """
    semaphores: dict[str, asyncio.Semaphore] = {}

    # Build flat list of all (keyword, platform) tasks
    tasks = [
        _scan_one(context, semaphores, api, kw, platform)
        for kw in keywords
        for platform in kw.get("platforms", ["ruten"])
    ]

    if not tasks:
        return

    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Aggregate per-platform results
    # platform_errors[platform] = None means success, str means first error.
    # Any success from any keyword overrides a prior failure for the same platform
    # (platform reachability is shared — one keyword timing out doesn't mean the platform is down).
    platform_errors: dict[str, Optional[str]] = {}
    for res in results:
        if isinstance(res, Exception):
            logger.error("Unexpected gather exception: %s", res)
            continue
        p_name, success, err_msg = res
        if p_name not in platform_errors:
            platform_errors[p_name] = None if success else err_msg
        elif success:
            platform_errors[p_name] = None  # success from any keyword overrides earlier failure

    # Report per-platform health status to API (one upsert per platform per user)
    seen: set[tuple[str, str]] = set()
    for kw in keywords:
        user_id: str = kw.get("userId", "")
        if not user_id:
            continue
        for platform in kw.get("platforms", ["ruten"]):
            if platform == "shopee":
                continue
            key = (user_id, platform)
            if key in seen:
                continue
            seen.add(key)
            err = platform_errors.get(platform)
            await api.update_platform_scan_status(platform, err is None, err, user_id)


async def run_scan_cycle(api: WorkerApiClient) -> None:
    """
    Execute one full scan cycle:
    1. Fetch keywords and circle follows from API
    2. Launch one shared browser + context
    3. Run all keyword×platform tasks + circle follow scans concurrently
    4. Close browser
    5. Post scan log
    """
    keywords = await api.get_keywords()
    circle_follows = await api.get_circle_follows()

    if not keywords and not circle_follows:
        logger.info("No active keywords or circle follows, skipping scan")
        return

    timeout_secs = _get_scan_timeout()

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

        try:
            # Keyword scans and circle follow scans run within the same browser + timeout
            async def _run_all() -> None:
                if keywords:
                    await _run_scan_tasks(context, api, keywords)
                if circle_follows:
                    circle_semaphores: dict[str, asyncio.Semaphore] = {}
                    results = await asyncio.gather(
                        *[_scan_circle(context, circle_semaphores, api, follow) for follow in circle_follows],
                        return_exceptions=True,
                    )
                    for res in results:
                        if isinstance(res, Exception):
                            logger.error("Circle scan gather exception: %s", res)

            await asyncio.wait_for(
                _run_all(),
                timeout=timeout_secs,
            )
        except asyncio.TimeoutError:
            msg = (
                f"⏱ 掃描逾時：掃描任務超過 {timeout_secs} 秒未完成，已強制中止。\n"
                f"請考慮調整 SCAN_TIMEOUT_SECONDS 或 SEMAPHORE_PER_PLATFORM 設定。"
            )
            logger.error(msg)
            await send_system_alert(msg)
        except Exception as exc:
            logger.error("Scan cycle error: %s", exc)
        finally:
            await browser.close()

    # Record scan completion time
    scanned_at = datetime.now(timezone.utc).isoformat()
    await api.post_scan_log(scanned_at)
    logger.info("Scan cycle complete, logged scannedAt=%s", scanned_at)


# ---------------------------------------------------------------------------
# Scheduler loop
# ---------------------------------------------------------------------------

async def run_scheduler() -> None:
    """
    Main scheduler loop. Runs indefinitely until interrupted.

    Validates environment variables before entering the loop
    (Application environment is validated before the scheduler starts).
    """
    if not os.environ.get("WORKER_SECRET"):
        raise SystemExit("WORKER_SECRET is required")
    if not os.environ.get("NEXT_PUBLIC_API_URL"):
        raise SystemExit("NEXT_PUBLIC_API_URL is required")

    interval = _get_check_interval()
    logger.info(
        "Shop Watcher started (interval=%ds, semaphore=%d, timeout=%ds)",
        interval, _get_semaphore_limit(), _get_scan_timeout(),
    )

    api = WorkerApiClient()
    stop_event = asyncio.Event()

    def _handle_signal(sig, frame):  # noqa: ARG001
        logger.info("Received signal %s, shutting down...", sig)
        stop_event.set()

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
