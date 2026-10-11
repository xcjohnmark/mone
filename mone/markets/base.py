"""
mone.markets.base — Abstract Market Interface and Normalized Domain Models.
"""

from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, Field


class MarketQuote(BaseModel):
    """
    Normalized market quote across all venues (Kalshi Live, Kalshi Demo, Polymarket, Paper).
    Prices normalized to dollars (0.01 to 0.99).
    """
    market_id: str = Field(description="Unique contract identifier / ticker, e.g. KXRAIN-26OCT12-CHI")
    venue: str = Field(description="Venue identifier: kalshi_live, kalshi_demo, polymarket, paper")
    station_code: str = Field(description="NWS station code, e.g. CLIORD")
    city: str = Field(description="City name, e.g. Chicago")
    target_date: str = Field(description="Contract target date in YYYY-MM-DD")
    yes_ask: float = Field(default=0.0, description="Best Ask price to buy YES (in dollars)")
    yes_bid: float = Field(default=0.0, description="Best Bid price to sell YES (in dollars)")
    no_ask: float = Field(default=0.0, description="Best Ask price to buy NO (in dollars)")
    no_bid: float = Field(default=0.0, description="Best Bid price to sell NO (in dollars)")
    last_price: Optional[float] = Field(default=None, description="Last traded price in dollars")
    status: str = Field(default="open", description="Market status: open, closed, settled")
    settlement_result: Optional[Literal["YES", "NO"]] = Field(
        default=None, description="Official resolution if settled: YES or NO"
    )
    timestamp_utc: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )

    @property
    def implied_yes_prob_pct(self) -> float:
        """Market implied probability for YES based on midpoint or ask."""
        if self.yes_ask > 0 and self.yes_bid > 0:
            return round(((self.yes_ask + self.yes_bid) / 2.0) * 100.0, 1)
        if self.yes_ask > 0:
            return round(self.yes_ask * 100.0, 1)
        return 50.0

    @property
    def implied_no_prob_pct(self) -> float:
        """Market implied probability for NO."""
        return round(100.0 - self.implied_yes_prob_pct, 1)


class OrderRequest(BaseModel):
    """Execution order specification."""
    market_id: str
    station_code: str
    side: Literal["YES", "NO"]
    action: Literal["BUY", "SELL"] = "BUY"
    contracts: int = Field(gt=0, description="Number of contracts to trade")
    max_price: float = Field(gt=0.0, le=1.0, description="Max acceptable execution price (dollars)")
    order_type: str = "limit"


class OrderResult(BaseModel):
    """Normalized execution response from broker/venue."""
    order_id: str
    market_id: str
    station_code: str
    side: Literal["YES", "NO"]
    action: str = "BUY"
    contracts: int
    fill_price: float
    total_cost: float
    status: Literal["FILLED", "RESTING", "REJECTED", "CANCELLED"]
    timestamp_utc: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    error: Optional[str] = None


class MarketClient(ABC):
    """Abstract interface implemented by all market venue connectors."""

    @property
    @abstractmethod
    def venue_id(self) -> str:
        pass

    @abstractmethod
    def get_quotes_for_date(self, target_date: str) -> Dict[str, MarketQuote]:
        """
        Fetch all open rain contracts for a target date (YYYY-MM-DD).
        Returns mapping from station_code -> MarketQuote.
        """
        pass

    @abstractmethod
    def get_settled_markets(self, limit: int = 100) -> Dict[str, str]:
        """
        Fetch recently settled rain markets.
        Returns mapping from market_id / ticker -> 'YES' or 'NO'.
        """
        pass

    @abstractmethod
    def place_order(self, order: OrderRequest) -> OrderResult:
        """Submit an order to the venue."""
        pass

    @abstractmethod
    def get_balance(self) -> float:
        """Fetch available cash balance in USD."""
        pass
