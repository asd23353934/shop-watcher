"""
Shop Watcher - Playwright PoC v3
- Shopee: playwright-stealth 反 bot 偵測
- Ruten:  修正 URL 格式 + 名稱/圖片擷取
執行: python poc/test_scraper.py
"""

import asyncio
import re
import os
from dataclasses import dataclass
from typing import Optional
from playwright.async_api import async_playwright, Page, TimeoutError as PWTimeout

try:
    from playwright_stealth import stealth_async
    HAS_STEALTH = True
except ImportError:
    HAS_STEALTH = False
    print("[!] playwright_stealth not available, running without stealth")

KEYWORD = "PS5"
TIMEOUT = 25_000
SCREENSHOT_DIR = "poc/screenshots"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)


@dataclass
class ScrapedItem:
    platform: str
    item_id: str
    name: str
    price: Optional[float]
    url: str
    image_url: Optional[str] = None


def parse_price(text: str) -> Optional[float]:
    if not text:
        return None
    digits = re.sub(r"[^\d.]", "", text.replace(",", ""))
    try:
        return float(digits) if digits else None
    except ValueError:
        return None


# ─────────────────────────────────────────────
# 蝦皮 Shopee (playwright-stealth + 多 selector)
# ─────────────────────────────────────────────

async def scrape_shopee(page: Page, keyword: str) -> list[ScrapedItem]:
    print(f"\n[Shopee] keyword={keyword}  stealth={'ON' if HAS_STEALTH else 'OFF'}")

    if HAS_STEALTH:
        await stealth_async(page)

    # 先造訪首頁讓 cookie 初始化
    try:
        await page.goto("https://shopee.tw/", timeout=TIMEOUT, wait_until="domcontentloaded")
        await asyncio.sleep(3)
        print(f"  homepage title : {await page.title()}")
        print(f"  homepage url   : {page.url[:70]}")
    except Exception as e:
        print(f"  homepage error : {e}")

    # 若首頁已被導到登入，直接回報
    if "login" in page.url:
        print("  => Homepage redirected to login, Shopee blocks headless")
        await page.screenshot(path=f"{SCREENSHOT_DIR}/shopee_blocked.png")
        return []

    # 搜尋
    search_url = f"https://shopee.tw/search?keyword={keyword}&sortBy=ctime&order=desc"
    try:
        await page.goto(search_url, timeout=TIMEOUT, wait_until="domcontentloaded")
        await asyncio.sleep(4)
    except PWTimeout:
        print("  search page timeout")
        await page.screenshot(path=f"{SCREENSHOT_DIR}/shopee_timeout.png")
        return []

    print(f"  search url   : {page.url[:70]}")
    print(f"  search title : {await page.title()}")
    await page.screenshot(path=f"{SCREENSHOT_DIR}/shopee.png")

    if "login" in page.url:
        print("  => Blocked by login wall even with stealth")
        return []

    # 等待商品卡片
    loaded = False
    for sel in ['[data-sqe="item"]', '.shopee-search-item-result__item', 'a[href*="-i."]']:
        try:
            await page.wait_for_selector(sel, timeout=8_000)
            loaded = True
            print(f"  selector hit : {sel}")
            break
        except PWTimeout:
            continue

    if not loaded:
        print("  no product selector matched")
        return []

    items: list[ScrapedItem] = []
    links = await page.query_selector_all('a[href*="-i."]')
    print(f"  product links: {len(links)}")

    seen_ids: set[str] = set()
    for a in links[:20]:
        try:
            href = await a.get_attribute("href") or ""
            m = re.search(r"-i\.(\d+)\.(\d+)", href)
            if not m:
                continue
            shop_id, item_id = m.group(1), m.group(2)
            if item_id in seen_ids:
                continue
            seen_ids.add(item_id)

            name_el = await a.query_selector('[class*="ellipsis"],[class*="name"],span')
            name = (await name_el.inner_text()).strip() if name_el else ""
            if not name:
                name = href.split("/")[-1].split("-i.")[0].replace("-", " ")

            price_el = await a.query_selector('[class*="price"]')
            price = parse_price((await price_el.inner_text()) if price_el else "")

            img_el = await a.query_selector("img")
            image_url = await img_el.get_attribute("src") if img_el else None

            full_url = f"https://shopee.tw{href}" if href.startswith("/") else href
            items.append(ScrapedItem("shopee", item_id, name[:80], price, full_url, image_url))
        except Exception as e:
            print(f"  parse error: {e}")

    return items


# ─────────────────────────────────────────────
# 露天拍賣 Ruten (修正 URL 格式 + 名稱擷取)
# ─────────────────────────────────────────────

async def scrape_ruten(page: Page, keyword: str) -> list[ScrapedItem]:
    print(f"\n[Ruten] keyword={keyword}")

    url = f"https://www.ruten.com.tw/find/?q={keyword}&sort=new"
    try:
        await page.goto(url, timeout=TIMEOUT, wait_until="domcontentloaded")
        await asyncio.sleep(4)
    except PWTimeout:
        print("  page timeout")
        await page.screenshot(path=f"{SCREENSHOT_DIR}/ruten_timeout.png")
        return []

    print(f"  title : {await page.title()}")
    await page.screenshot(path=f"{SCREENSHOT_DIR}/ruten.png")

    # 確認商品連結 selector (ruten.com.tw/item/{id}/ 格式)
    links = await page.query_selector_all('a[href*="ruten.com.tw/item/"]')
    print(f"  product links (ruten.com.tw/item/): {len(links)}")

    if not links:
        # fallback: goods.ruten.com.tw format
        links = await page.query_selector_all('a[href*="goods.ruten"]')
        print(f"  product links (goods.ruten fallback): {len(links)}")

    items: list[ScrapedItem] = []
    seen_ids: set[str] = set()

    for a in links[:25]:
        try:
            href = await a.get_attribute("href") or ""
            # 格式 1: ruten.com.tw/item/{22-digit-id}/
            m = re.search(r"/item/(\d{10,})", href)
            # 格式 2: goods.ruten.com.tw/item/show?{id}
            if not m:
                m = re.search(r"show\?(\d+)", href)
            if not m:
                continue

            item_id = m.group(1)
            if item_id in seen_ids:
                continue
            seen_ids.add(item_id)

            # 商品名稱 — 從連結本身或父容器取文字
            raw_text = (await a.inner_text()).strip()
            # 過濾純數字行（item_id 本身），取第一個有意義的行
            lines = [l.strip() for l in raw_text.split("\n") if l.strip() and not l.strip().isdigit()]
            name = lines[0] if lines else ""

            if not name:
                # 嘗試從 img alt 取名稱
                img_el = await a.query_selector("img")
                name = (await img_el.get_attribute("alt") or "").strip() if img_el else ""
            if not name:
                name = f"item-{item_id}"

            # 父容器找價格
            container = await a.evaluate_handle(
                "el => el.closest('li') || el.closest('article') || el.parentElement"
            )
            price_el = await container.query_selector('[class*="price"],[class*="Price"]') if container else None
            price = parse_price((await price_el.inner_text()) if price_el else "")

            # 圖片
            img_el = await a.query_selector("img")
            if not img_el and container:
                img_el = await container.query_selector("img")
            image_url = None
            if img_el:
                image_url = (await img_el.get_attribute("src") or
                             await img_el.get_attribute("data-src") or None)
                if image_url and image_url.startswith("data:"):
                    image_url = await img_el.get_attribute("data-src") or None

            full_url = href if href.startswith("http") else f"https://www.ruten.com.tw/item/{item_id}/"
            items.append(ScrapedItem("ruten", item_id, name[:80], price, full_url, image_url))
        except Exception as e:
            print(f"  parse error: {e}")

    # 嘗試用 JS 直接抓頁面上的商品資料 (備用)
    if not items:
        print("  Trying JS extraction fallback...")
        try:
            data = await page.evaluate("""() => {
                const cards = document.querySelectorAll('[class*="goods"],[class*="product"],[class*="item"]');
                return Array.from(cards).slice(0,5).map(c => ({
                    text: c.innerText?.slice(0,100),
                    links: Array.from(c.querySelectorAll('a')).map(a => a.href).filter(h => h.includes('item')).slice(0,2)
                }));
            }""")
            print(f"  JS cards found: {len(data)}")
            for d in data[:3]:
                print(f"    text={d['text'][:50]}  links={d['links']}")
        except Exception as e:
            print(f"  JS fallback error: {e}")

    return items


# ─────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────

async def main():
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

        shopee_page = await context.new_page()
        shopee_items = await scrape_shopee(shopee_page, KEYWORD)
        await shopee_page.close()

        ruten_page = await context.new_page()
        ruten_items = await scrape_ruten(ruten_page, KEYWORD)
        await ruten_page.close()

        await browser.close()

    # ── 結果摘要 ──
    sep = "=" * 60
    print(f"\n{sep}")
    print(f"  Shopee: {len(shopee_items)} items")
    for i in shopee_items[:3]:
        print(f"    [{i.item_id}] NT${i.price}")
        print(f"    {i.name[:50]}")
        print(f"    {i.url[:65]}")

    print(f"\n  Ruten: {len(ruten_items)} items")
    for i in ruten_items[:3]:
        print(f"    [{i.item_id}] NT${i.price}")
        print(f"    name  : {i.name[:50]}")
        print(f"    url   : {i.url[:65]}")
        print(f"    image : {(i.image_url or 'none')[:65]}")

    print(f"\n{sep}")
    shopee_ok = len(shopee_items) > 0
    ruten_ok  = len(ruten_items) > 0
    print(f"  Shopee: {'PASS' if shopee_ok else 'FAIL'}")
    print(f"  Ruten : {'PASS' if ruten_ok  else 'FAIL'}")
    if shopee_ok and ruten_ok:
        print("  => Both OK - proceed to P2")
    elif ruten_ok:
        print("  => Ruten OK, Shopee needs alt strategy (try non-headless or paid proxy)")
    else:
        print("  => Both failed")
    print(f"  Screenshots saved to {SCREENSHOT_DIR}/")
    print(sep)


if __name__ == "__main__":
    asyncio.run(main())
