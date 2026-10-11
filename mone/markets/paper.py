"""
mone.markets.paper — Zero-Risk Virtual Paper Brokerage.
Simulates order fills, balance tracking, and trade resolutions without risking capital.
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional

from mone.markets.base import MarketClient, MarketQuote, OrderRequest, OrderResult
from mone.markets.kalshi import KalshiClient
from mone.markets.stations import NWS_STATIONS

logger = logging.getLogger("mone.markets.paper")


class PaperMarketClient(MarketClient):
    """
    Virtual paper trading broker.
    Fetches real production market quotes from Kalshi or synthetic feeds,
    and executes fills locally against a simulated cash balance.
    """

    def __init__(self, starting_balance: float = 1000.00, live_quote_source: Optional[KalshiClient] = None):
        self.balance = starting_balance
        self.live_source = live_quote_source or KalshiClient(is_demo=False)
        self.executed_orders: List[OrderResult] = []

    @property
    def venue_id(self) -> str:
        return "paper"

    def get_quotes_for_date(self, target_date: str) -> Dict[str, MarketQuote]:
        """
        Attempts to fetch live Kalshi quotes; if unavailable, generates realistic quotes
        centered around 50c to allow paper evaluation.
        """
        try:
            live_quotes = self.live_source.get_quotes_for_date(target_date)
            if live_quotes:
                # Mark quotes venue as paper for tracking
                for q in live_quotes.values():
                    q.venue = "paper"
                return live_quotes
        except Exception as e:
            logger.info(f"Using synthetic paper quotes due to live quote fetch note: {e}")

        # Synthetic quotes fallback
        quotes: Dict[str, MarketQuote] = {}
        for st in NWS_STATIONS:
            quotes[st.station_code] = MarketQuote(
                market_id=f"PAPER-{target_date}-{st.kalshi_suffix}",
                venue="paper",
                station_code=st.station_code,
                city=st.city,
                target_date=target_date,
                yes_ask=0.52,
                yes_bid=0.48,
                no_ask=0.52,
                no_bid=0.48,
                last_price=0.50,
                status="open",
            )
        return quotes

    def get_settled_markets(self, limit: int = 100) -> Dict[str, str]:
        """Fetches settled markets from live Kalshi reference."""
        try:
            return self.live_source.get_settled_markets(limit)
        except Exception:
            return {}

    def place_order(self, order: OrderRequest) -> OrderResult:
        """Executes a paper order, deducting virtual balance."""
        total_cost = round(order.max_price * order.contracts, 2)
        if total_cost > self.balance:
            return OrderResult(
                order_id=f"paper_rej_{uuid.uuid4().hex[:8]}",
                market_id=order.market_id,
                station_code=order.station_code,
                side=order.side,
                action=order.action,
                contracts=order.contracts,
                fill_price=order.max_price,
                total_cost=0.0,
                status="REJECTED",
                error=f"Insufficient paper balance (${self.balance:.2f} < ${total_cost:.2f})",
            )

        self.balance = round(self.balance - total_cost, 2)
        result = OrderResult(
            order_id=f"paper_ord_{uuid.uuid4().hex[:10]}",
            market_id=order.market_id,
            station_code=order.station_code,
            side=order.side,
            action=order.action,
            contracts=order.contracts,
            fill_price=order.max_price,
            total_cost=total_cost,
            status="FILLED",
        )
        self.executed_orders.append(result)
        return result

    def get_balance(self) -> float:
        return self.balance
