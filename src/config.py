import os
import yaml
from dataclasses import dataclass, field
from typing import Optional
from dotenv import load_dotenv

load_dotenv()


@dataclass
class KeywordConfig:
    name: str
    platforms: list[str]
    min_price: Optional[float] = None
    max_price: Optional[float] = None


@dataclass
class DiscordConfig:
    webhook_url: str
    mention_role_id: str = ""


@dataclass
class AppConfig:
    discord: DiscordConfig
    keywords: list[KeywordConfig]
    check_interval: int = 300


def load_config(path: str = "config.yaml") -> AppConfig:
    with open(path, "r", encoding="utf-8") as f:
        raw = yaml.safe_load(f)

    webhook_url = (
        os.environ.get("DISCORD_WEBHOOK_URL")
        or raw.get("discord", {}).get("webhook_url", "")
    )
    if not webhook_url:
        raise ValueError(
            "Discord webhook URL is required. Set DISCORD_WEBHOOK_URL env var or discord.webhook_url in config.yaml"
        )

    discord = DiscordConfig(
        webhook_url=webhook_url,
        mention_role_id=raw.get("discord", {}).get("mention_role_id", ""),
    )

    keywords = [
        KeywordConfig(
            name=kw["name"],
            platforms=kw.get("platforms", ["shopee", "ruten"]),
            min_price=kw.get("min_price"),
            max_price=kw.get("max_price"),
        )
        for kw in raw.get("keywords", [])
    ]

    return AppConfig(
        discord=discord,
        keywords=keywords,
        check_interval=raw.get("check_interval", 300),
    )
