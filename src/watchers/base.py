from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class WatcherItem:
    platform: str
    item_id: str
    name: str
    price: Optional[float]      # TWD (min price for ranges; used for filtering/price-drop)
    url: str
    image_url: Optional[str] = None
    seller_name: Optional[str] = None
    price_text: Optional[str] = None  # Display text for price ranges, e.g. "100 ~ 1,000"


class BaseWatcher(ABC):
    PLATFORM = ""

    @abstractmethod
    async def search(self, keyword: str, max_results: int = 20) -> list[WatcherItem]:
        """Search for items matching keyword. Return newest items first."""
        ...
