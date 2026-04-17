"""
Cross-cutting DOM-intact signal used by the canary cycle.

Each scraper records whether the expected top-level product container was
found on the page. The canary consumer reads the latest recorded value for
a platform after invoking its scraper, without needing to change scraper
return types.

Implementation note: we use a plain module-level dict rather than a
ContextVar because Worker runs canary serially in a single asyncio task —
record_dom_intact() followed by consume_dom_intact() within the same task
is sufficient. Records are overwritten each call; consumers should read
immediately after scraping.
"""

_latest: dict[str, bool] = {}


def record_dom_intact(platform: str, intact: bool) -> None:
    _latest[platform] = intact


def consume_dom_intact(platform: str, default: bool = False) -> bool:
    return _latest.pop(platform, default)
