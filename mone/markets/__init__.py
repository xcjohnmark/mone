"""
mone.markets — Prediction Market connectors and models.
"""

from typing import Optional
from mone.config import MoneConfig, MarketVenueType
from mone.markets.base import MarketClient, MarketQuote, OrderRequest, OrderResult
from mone.markets.stations import (
    NWS_STATIONS,
    StationInfo,
    get_all_stations,
    get_station_by_code,
    get_station_by_suffix,
    get_station_by_city,
)
from mone.markets.kalshi import KalshiClient
from mone.markets.polymarket import PolymarketClient
from mone.markets.paper import PaperMarketClient


def get_market_client(config: Optional[MoneConfig] = None) -> MarketClient:
    """
    Factory creating the configured MarketClient based on user config.
    """
    if config is None:
        from mone.config import get_config
        config = get_config()

    if config.default_venue == MarketVenueType.KALSHI_LIVE:
        return KalshiClient(
            is_demo=False,
            api_key_id=config.kalshi_api_key_id,
            private_key_path=config.kalshi_private_key_path,
            email=config.kalshi_email,
            password=config.kalshi_password,
        )
    elif config.default_venue == MarketVenueType.KALSHI_DEMO:
        return KalshiClient(
            is_demo=True,
            api_key_id=config.kalshi_demo_api_key_id,
            private_key_path=config.kalshi_demo_private_key_path,
            email=config.kalshi_demo_email,
            password=config.kalshi_demo_password,
        )
    elif config.default_venue == MarketVenueType.POLYMARKET:
        return PolymarketClient(
            api_key=config.polymarket_api_key,
            api_secret=config.polymarket_api_secret,
            passphrase=config.polymarket_passphrase,
            proxy_wallet=config.polymarket_proxy_wallet,
        )
    else:
        # Default to Paper trading
        return PaperMarketClient()


__all__ = [
    "MarketClient",
    "MarketQuote",
    "OrderRequest",
    "OrderResult",
    "StationInfo",
    "NWS_STATIONS",
    "get_all_stations",
    "get_station_by_code",
    "get_station_by_suffix",
    "get_station_by_city",
    "KalshiClient",
    "PolymarketClient",
    "PaperMarketClient",
    "get_market_client",
]
