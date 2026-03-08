from abc import ABC, abstractmethod
from typing import Any

class ScraperBase(ABC):
    @abstractmethod
    async def fetch_data(self, url: str) -> Any:
        pass

    @abstractmethod
    def parse_data(self, html_content: str) -> Any:
        pass
