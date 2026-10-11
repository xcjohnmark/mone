"""
tests/test_config.py — Unit tests for mone.config validation & BYOK resolution.
"""

import pytest
from pydantic import ValidationError
from mone.config import MoneConfig, WeatherProviderType, MarketVenueType, AutonomyMode, get_config


def test_default_config():
    config = MoneConfig()
    assert config.weather_provider == WeatherProviderType.AUTO
    assert config.default_venue == MarketVenueType.PAPER
    assert config.agent_autonomy_mode == AutonomyMode.COPILOT
    assert config.long_yes_prob_threshold == 75.0
    assert config.long_no_prob_threshold == 25.0
    assert config.max_entry_ask_price == 0.80
    assert config.capital_per_trade == 10.00
    assert config.max_daily_drawdown == 50.00
    assert config.rain_threshold_mm == 0.25


def test_custom_overrides():
    config = MoneConfig(
        WEATHER_PROVIDER="openmeteo",
        DEFAULT_VENUE="kalshi_demo",
        AGENT_AUTONOMY_MODE="autonomous",
        CAPITAL_PER_TRADE=25.0,
        MAX_ENTRY_ASK_PRICE=0.70,
    )
    assert config.weather_provider == WeatherProviderType.OPENMETEO
    assert config.default_venue == MarketVenueType.KALSHI_DEMO
    assert config.agent_autonomy_mode == AutonomyMode.AUTONOMOUS
    assert config.capital_per_trade == 25.0
    assert config.max_entry_ask_price == 0.70


def test_invalid_probability_thresholds():
    with pytest.raises(ValidationError):
        # Long YES threshold must be between 50 and 100
        MoneConfig(LONG_YES_PROB_THRESHOLD=45.0)

    with pytest.raises(ValidationError):
        # Long NO threshold must be between 0 and 50
        MoneConfig(LONG_NO_PROB_THRESHOLD=55.0)


def test_invalid_risk_parameters():
    with pytest.raises(ValidationError):
        MoneConfig(CAPITAL_PER_TRADE=-10.0)

    with pytest.raises(ValidationError):
        MoneConfig(MAX_DAILY_DRAWDOWN=0.0)

    with pytest.raises(ValidationError):
        MoneConfig(MAX_ENTRY_ASK_PRICE=1.50)


def test_singleton_get_config():
    c1 = get_config(reload=True, CAPITAL_PER_TRADE=15.0)
    assert c1.capital_per_trade == 15.0
    c2 = get_config()
    assert c2.capital_per_trade == 15.0
