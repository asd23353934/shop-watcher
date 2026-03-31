from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class WatcherItem:
    platform: str
    item_id: str
    name: str
    price: Optional[float]      # TWD
    url: str
    image_url: Optional[str] = None
    seller: Optional[str] = None


class BaseWatcher(ABC):
    PLATFORM = ""

    @abstractmethod
    async def search(self, keyword: str, max_results: int = 20) -> list[WatcherItem]:
        """Search for items matching keyword. Return newest items first."""
        ...
