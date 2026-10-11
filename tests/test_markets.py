"""
tests/test_markets.py — Tests for prediction market connectors, stations, and paper broker.
"""

import pytest
from mone.config import MoneConfig
from mone.markets import (
    get_all_stations,
    get_station_by_code,
    get_station_by_suffix,
    get_station_by_city,
    MarketQuote,
    OrderRequest,
    KalshiClient,
    PaperMarketClient,
    get_market_client,
)


def test_station_lookups():
    stations = get_all_stations()
    assert len(stations) == 22

    # Lookup by code
    chicago = get_station_by_code("CLIORD")
    assert chicago is not None
    assert chicago.city == "Chicago"
    assert chicago.kalshi_suffix == "CHI"

    # Lookup by suffix
    denver = get_station_by_suffix("DEN")
    assert denver is not None
    assert denver.station_code == "CLIDEN"

    # Lookup by city
    mia = get_station_by_city("Miami")
    assert mia is not None
    assert mia.station_code == "CLIMIA"


def test_market_quote_implied_probabilities():
    quote = MarketQuote(
        market_id="KXRAIN-26OCT12-CHI",
        venue="kalshi_demo",
        station_code="CLIORD",
        city="Chicago",
        target_date="2026-10-12",
        yes_ask=0.35,
        yes_bid=0.31,
        no_ask=0.69,
        no_bid=0.65,
    )

    # Midpoint of 0.35 and 0.31 is 0.33 -> 33.0%
    assert quote.implied_yes_prob_pct == 33.0
    assert quote.implied_no_prob_pct == 67.0


def test_kalshi_date_code_formatting():
    assert KalshiClient.format_date_code("2026-10-12") == "26OCT12"
    assert KalshiClient.format_date_code("2026-09-30") == "26SEP30"


def test_paper_market_client_execution():
    client = PaperMarketClient(starting_balance=100.00)
    assert client.get_balance() == 100.00

    order = OrderRequest(
        market_id="KXRAIN-26OCT12-CHI",
        station_code="CLIORD",
        side="YES",
        contracts=20,
        max_price=0.40,
    )
    result = client.place_order(order)
    assert result.status == "FILLED"
    assert result.total_cost == 8.00  # 20 * 0.40
    assert client.get_balance() == 92.00  # 100 - 8

    # Test rejection on insufficient funds
    large_order = OrderRequest(
        market_id="KXRAIN-26OCT12-CHI",
        station_code="CLIORD",
        side="YES",
        contracts=500,
        max_price=0.50,  # 250 > 92
    )
    rej_res = client.place_order(large_order)
    assert rej_res.status == "REJECTED"
    assert "Insufficient paper balance" in rej_res.error


def test_market_client_factory():
    cfg_paper = MoneConfig(DEFAULT_VENUE="paper")
    c1 = get_market_client(cfg_paper)
    assert isinstance(c1, PaperMarketClient)

    cfg_demo = MoneConfig(DEFAULT_VENUE="kalshi_demo")
    c2 = get_market_client(cfg_demo)
    assert isinstance(c2, KalshiClient)
    assert c2.is_demo is True
