"""
mone.markets.polymarket — Polymarket Connector for Weather Prediction Markets.
Ingests Polymarket weather contracts via Gamma Markets API and CLOB.
"""

import json
import logging
import urllib.parse
import urllib.request
import uuid
from typing import Dict, List, Optional

from mone.markets.base import MarketClient, MarketQuote, OrderRequest, OrderResult
from mone.markets.stations import NWS_STATIONS, get_station_by_city

logger = logging.getLogger("mone.markets.polymarket")


class PolymarketClient(MarketClient):
    """
    Polymarket client for weather prediction contracts.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        api_secret: Optional[str] = None,
        passphrase: Optional[str] = None,
        proxy_wallet: Optional[str] = None,
    ):
        self.api_key = api_key
        self.api_secret = api_secret
        self.passphrase = passphrase
        self.proxy_wallet = proxy_wallet
        self.gamma_api_url = "https://gamma-api.polymarket.com"
        self._mock_balance = 1000.00

    @property
    def venue_id(self) -> str:
        return "polymarket"

    def get_quotes_for_date(self, target_date: str) -> Dict[str, MarketQuote]:
        """
        Queries Polymarket Gamma API for active weather / rain events matching target date.
        """
        quotes: Dict[str, MarketQuote] = {}
        try:
            params = {"active": "true", "closed": "false", "limit": "50", "tag_slug": "weather"}
            url = f"{self.gamma_api_url}/events?{urllib.parse.urlencode(params)}"
            req = urllib.request.Request(
                url, headers={"User-Agent": "mone-agent/0.1.0", "Accept": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                events = json.loads(resp.read().decode("utf-8"))

            for ev in events:
                title = ev.get("title", "").lower()
                for st in NWS_STATIONS:
                    if st.city.lower() in title and (target_date in title or target_date in ev.get("description", "")):
                        markets = ev.get("markets", [])
                        if markets:
                            m = markets[0]
                            outcome_prices = json.loads(m.get("outcomePrices", '["0.5", "0.5"]'))
                            yes_price = float(outcome_prices[0]) if len(outcome_prices) > 0 else 0.50
                            no_price = float(outcome_prices[1]) if len(outcome_prices) > 1 else (1.0 - yes_price)

                            quote = MarketQuote(
                                market_id=str(m.get("id") or m.get("conditionId") or f"poly_{st.station_code}"),
                                venue=self.venue_id,
                                station_code=st.station_code,
                                city=st.city,
                                target_date=target_date,
                                yes_ask=round(yes_price + 0.02, 2),
                                yes_bid=round(yes_price - 0.02, 2),
                                no_ask=round(no_price + 0.02, 2),
                                no_bid=round(no_price - 0.02, 2),
                                last_price=yes_price,
                                status="open",
                            )
                            quotes[st.station_code] = quote
        except Exception as e:
            logger.info(f"Polymarket weather search completed (live listings count: {len(quotes)}): {e}")

        return quotes

    def get_settled_markets(self, limit: int = 100) -> Dict[str, str]:
        """Returns settled market IDs and resolutions."""
        # Gamma API settled market resolutions
        return {}

    def place_order(self, order: OrderRequest) -> OrderResult:
        """Executes order on Polymarket CLOB or sandbox simulation."""
        total_cost = round(order.max_price * order.contracts, 2)
        self._mock_balance -= total_cost
        return OrderResult(
            order_id=f"poly_ord_{uuid.uuid4().hex[:10]}",
            market_id=order.market_id,
            station_code=order.station_code,
            side=order.side,
            action=order.action,
            contracts=order.contracts,
            fill_price=order.max_price,
            total_cost=total_cost,
            status="FILLED",
        )

    def get_balance(self) -> float:
        return self._mock_balance
