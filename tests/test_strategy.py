"""
tests/test_strategy.py — Unit tests for deterministic quant strategy engine.
"""

import pytest
from mone.config import MoneConfig
from mone.markets.base import MarketQuote
from mone.providers.base import WeatherForecast
from mone.strategy import calculate_edge, calculate_position_size, evaluate_market_signal


def test_calculate_edge_and_ev():
    # Model 80%, Ask 40c -> Edge = 0.80 - 0.40 = 0.40 (40%), EV = 0.40
    res = calculate_edge(80.0, 0.40, 0.65)
    assert res.side == "YES"
    assert res.edge == 0.40
    assert res.expected_roi_pct == 100.0  # (0.40 / 0.40) * 100

    # Model 10%, Ask NO is 35c -> Edge for NO = 0.90 - 0.35 = 0.55
    res_no = calculate_edge(10.0, 0.70, 0.35)
    assert res_no.side == "NO"
    assert res_no.edge == 0.55


def test_calculate_position_size():
    # $10 capital, 40c ask -> 25 contracts, $10.00 invested
    contracts, invested = calculate_position_size(10.0, 0.40)
    assert contracts == 25
    assert invested == 10.00

    # $10 capital, 30c ask -> 33 contracts, $9.90 invested
    contracts2, invested2 = calculate_position_size(10.0, 0.30)
    assert contracts2 == 33
    assert invested2 == 9.90

    # Zero or negative capital
    assert calculate_position_size(0.0, 0.40) == (0, 0.0)


def test_evaluate_signal_long_yes():
    cfg = MoneConfig()
    forecast = WeatherForecast(
        station_code="CLIORD",
        city="Chicago",
        target_date="2026-10-12",
        provider_name="openmeteo_weathernext2",
        mean_precipitation_mm=2.5,
        rain_probability_pct=85.0,  # > 75%
        ensemble_yes_votes=54,
        ensemble_total_members=63,
    )
    quote = MarketQuote(
        market_id="KXRAIN-26OCT12-CHI",
        venue="paper",
        station_code="CLIORD",
        city="Chicago",
        target_date="2026-10-12",
        yes_ask=0.45,  # < 0.80
        yes_bid=0.40,
        no_ask=0.60,
        no_bid=0.55,
    )

    signal = evaluate_market_signal(forecast, quote, cfg)
    assert signal.action == "BUY_YES"
    assert signal.side == "YES"
    assert signal.is_actionable is True
    assert signal.contracts_suggested == 22  # floor(10.0 / 0.45)
    assert signal.capital_allocated == 9.90  # 22 * 0.45


def test_evaluate_signal_long_no():
    cfg = MoneConfig()
    forecast = WeatherForecast(
        station_code="CLILAX",
        city="Los Angeles",
        target_date="2026-10-12",
        provider_name="openmeteo_weathernext2",
        mean_precipitation_mm=0.0,
        rain_probability_pct=5.0,  # < 25% (dry = 95%)
        ensemble_yes_votes=3,
        ensemble_total_members=63,
    )
    quote = MarketQuote(
        market_id="KXRAIN-26OCT12-LAX",
        venue="paper",
        station_code="CLILAX",
        city="Los Angeles",
        target_date="2026-10-12",
        yes_ask=0.85,
        yes_bid=0.80,
        no_ask=0.20,  # < 0.80
        no_bid=0.15,
    )

    signal = evaluate_market_signal(forecast, quote, cfg)
    assert signal.action == "BUY_NO"
    assert signal.side == "NO"
    assert signal.is_actionable is True
    assert signal.contracts_suggested == 50  # 10.0 / 0.20
    assert signal.capital_allocated == 10.00


def test_evaluate_signal_neutral_zone():
    cfg = MoneConfig()
    forecast = WeatherForecast(
        station_code="CLIDEN",
        city="Denver",
        target_date="2026-10-12",
        provider_name="openmeteo_weathernext2",
        mean_precipitation_mm=0.3,
        rain_probability_pct=50.0,  # In 25%-75% neutral zone
        ensemble_yes_votes=31,
        ensemble_total_members=63,
    )
    quote = MarketQuote(
        market_id="KXRAIN-26OCT12-DEN",
        venue="paper",
        station_code="CLIDEN",
        city="Denver",
        target_date="2026-10-12",
        yes_ask=0.50,
        no_ask=0.55,
    )

    signal = evaluate_market_signal(forecast, quote, cfg)
    assert signal.action == "NO_TRADE"
    assert signal.is_actionable is False
    assert "Neutral forecast zone" in signal.reason


def test_evaluate_signal_ask_price_too_high():
    cfg = MoneConfig(MAX_ENTRY_ASK_PRICE=0.80)
    forecast = WeatherForecast(
        station_code="CLIMIA",
        city="Miami",
        target_date="2026-10-12",
        provider_name="openmeteo_weathernext2",
        mean_precipitation_mm=4.0,
        rain_probability_pct=90.0,  # Strong rain
        ensemble_yes_votes=57,
        ensemble_total_members=63,
    )
    quote = MarketQuote(
        market_id="KXRAIN-26OCT12-MIA",
        venue="paper",
        station_code="CLIMIA",
        city="Miami",
        target_date="2026-10-12",
        yes_ask=0.88,  # >= 0.80 safety limit!
        no_ask=0.15,
    )

    signal = evaluate_market_signal(forecast, quote, cfg)
    assert signal.action == "NO_TRADE"
    assert signal.is_actionable is False
    assert "safety ceiling" in signal.reason
