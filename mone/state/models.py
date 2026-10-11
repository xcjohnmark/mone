"""
mone.state.models — Database records for positions, signals, and account equity.
"""

from datetime import datetime, timezone
from typing import Literal, Optional
from pydantic import BaseModel, Field


class PositionRecord(BaseModel):
    id: Optional[int] = None
    market_id: str
    station_code: str
    city: str
    target_date: str
    side: Literal["YES", "NO"]
    entry_price: float
    contracts: int
    total_invested: float
    potential_payout: float
    status: Literal["OPEN", "SETTLED", "CANCELLED"] = "OPEN"
    resolution: Optional[str] = None
    realized_pnl: Optional[float] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    settled_at: Optional[str] = None


class SignalRecord(BaseModel):
    id: Optional[int] = None
    station_code: str
    city: str
    target_date: str
    market_id: str
    venue: str
    action: Literal["BUY_YES", "BUY_NO", "NO_TRADE"]
    side: Literal["YES", "NO", "NONE"]
    model_prob_pct: float
    market_ask: float
    edge_pct: float
    contracts: int
    capital: float
    reason: str
    status: Literal["STAGED", "APPROVED", "REJECTED", "EXECUTED"] = "STAGED"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class EquitySummary(BaseModel):
    cash_balance: float
    invested_capital: float
    total_equity: float
    cumulative_realized_pnl: float
    open_positions_count: int
    settled_trades_count: int
    win_rate_pct: float
