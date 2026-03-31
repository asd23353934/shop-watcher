import httpx
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional


PLATFORM_COLORS = {
    "shopee": 0xEE4D2D,   # Shopee orange-red
    "ruten":  0x0066CC,   # Ruten blue
}

PLATFORM_LABELS = {
    "shopee": "蝦皮 Shopee",
    "ruten":  "露天拍賣 Ruten",
}


@dataclass
class NotifyItem:
    platform: str
    item_id: str
    keyword: str
    name: str
    price: Optional[float]        # TWD
    url: str
    image_url: Optional[str] = None
    seller: Optional[str] = None


async def send_discord_notification(
    webhook_url: str,
    item: NotifyItem,
    mention_role_id: str = "",
) -> bool:
    """Send a Discord embed for a newly found item. Returns True on success."""

    price_str = f"NT$ {item.price:,.0f}" if item.price else "價格未知"
    platform_label = PLATFORM_LABELS.get(item.platform, item.platform)
    color = PLATFORM_COLORS.get(item.platform, 0x95A5A6)
    now = datetime.now(timezone.utc).isoformat()

    embed = {
        "title": item.name[:256],
        "url": item.url,
        "color": color,
        "fields": [
            {"name": "平台", "value": platform_label, "inline": True},
            {"name": "價格", "value": price_str, "inline": True},
            {"name": "關鍵字", "value": item.keyword, "inline": True},
        ],
        "footer": {"text": f"Shop Watcher • {item.platform}"},
        "timestamp": now,
    }

    if item.seller:
        embed["fields"].append({"name": "賣家", "value": item.seller, "inline": True})

    if item.image_url:
        embed["thumbnail"] = {"url": item.image_url}

    content = f"<@&{mention_role_id}> 發現新商品！" if mention_role_id else "發現新商品！"

    payload = {"content": content, "embeds": [embed]}

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(webhook_url, json=payload)
        if resp.status_code not in (200, 204):
            print(f"[notifier] Discord webhook failed: {resp.status_code} {resp.text}")
            return False
        return True


async def send_startup_message(webhook_url: str, keywords: list[str]) -> None:
    """Send a one-time startup notification."""
    payload = {
        "embeds": [{
            "title": "Shop Watcher 已啟動",
            "description": f"正在監控 **{len(keywords)}** 個關鍵字：\n" + "\n".join(f"• {k}" for k in keywords),
            "color": 0x2ECC71,
            "footer": {"text": "Shop Watcher"},
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }]
    }
    async with httpx.AsyncClient(timeout=10) as client:
        await client.post(webhook_url, json=payload)
