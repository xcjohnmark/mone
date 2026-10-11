"""
tests/test_failure_recovery.py — Autonomous Failure Recovery & Neatlogs Telemetry Test.
Demonstrates Google Cloud disconnect -> automatic fallback to Open-Meteo WeatherNext 2 -> trade completion.
Captures structured trace proof for #neatHack hackathon submission criteria.
"""

import json
import os
from unittest.mock import MagicMock
import pytest

from mone.agent import MoneAgent
from mone.config import MoneConfig, AutonomyMode, WeatherProviderType
from mone.markets import PaperMarketClient, MarketQuote
from mone.providers import FallbackWeatherProvider, WeatherForecast, WeatherNext3FetchError
from mone.state import Database
from mone.telemetry import clear_recorded_spans, get_recorded_spans


def test_autonomous_failure_recovery_trace(tmp_path):
    clear_recorded_spans()
    db_file = str(tmp_path / "test_mone.db")
    db = Database(db_path=db_file)

    # 1. Setup mock primary WeatherNext 3 that simulates GCS / BigQuery disconnect
    failing_primary = MagicMock()
    failing_primary.provider_id = "google_weathernext3"
    failing_primary.get_forecast.side_effect = WeatherNext3FetchError(
        "GCS Bucket 'gs://weathernext3_spatial' connection reset by peer"
    )

    # 2. Setup mock secondary Open-Meteo that returns valid ensemble forecast
    backup_secondary = MagicMock()
    backup_secondary.provider_id = "openmeteo_weathernext2"
    backup_secondary.get_forecast.return_value = WeatherForecast(
        station_code="CLIORD",
        city="Chicago",
        target_date="2026-10-12",
        provider_name="openmeteo_weathernext2",
        mean_precipitation_mm=3.2,
        rain_probability_pct=88.0,  # Strong rain > 75%
        ensemble_yes_votes=55,
        ensemble_total_members=63,
    )
    backup_secondary.batch_get_forecasts.return_value = {
        "CLIORD": backup_secondary.get_forecast.return_value
    }

    # 3. Wrap in FallbackWeatherProvider
    composite_weather = FallbackWeatherProvider(
        primary=failing_primary, secondary=backup_secondary
    )

    # 4. Mock Market Quote with attractive ask price
    market = PaperMarketClient(starting_balance=100.00)
    market.get_quotes_for_date = MagicMock(
        return_value={
            "CLIORD": MarketQuote(
                market_id="KXRAIN-26OCT12-CHI",
                venue="paper",
                station_code="CLIORD",
                city="Chicago",
                target_date="2026-10-12",
                yes_ask=0.42,
                yes_bid=0.38,
                no_ask=0.62,
                no_bid=0.58,
                status="open",
            )
        }
    )

    # 5. Initialize MoneAgent in AUTONOMOUS mode
    cfg = MoneConfig(
        WEATHER_PROVIDER="auto",
        DEFAULT_VENUE="paper",
        AGENT_AUTONOMY_MODE="autonomous",
        DATABASE_URL=f"sqlite:///{db_file}",
    )

    agent = MoneAgent(
        config=cfg,
        weather_provider=composite_weather,
        market_client=market,
        db=db,
    )

    # 6. Execute Agent Step — should trigger failure recovery
    result = agent.step(target_date="2026-10-12")

    # 7. Assertions: agent did NOT crash, fallback was activated, and trade executed!
    assert composite_weather.fallback_active is True
    assert result["total_stations_evaluated"] >= 1
    assert result["executed_count"] == 1

    executed = result["executed_positions"][0]
    assert executed["station_code"] == "CLIORD"
    assert executed["side"] == "YES"
    assert executed["entry_price"] == 0.42

    # 8. Verify recorded Neatlogs spans
    spans = get_recorded_spans()
    span_names = [s["name"] for s in spans]
    assert "mone_trading_cycle" in span_names
    assert "fetch_weather_forecasts" in span_names
    assert "evaluate_market_signals" in span_names
    assert "execute_order" in span_names

    # 9. Export trace proof artifact
    os.makedirs("trace_exports", exist_ok=True)
    trace_artifact = {
        "scenario": "GCS_BIGQUERY_DISCONNECT_RECOVERY",
        "primary_error": "GCS Bucket 'gs://weathernext3_spatial' connection reset by peer",
        "recovery_provider": "openmeteo_weathernext2",
        "trade_executed": executed,
        "spans": spans,
        "account_equity_after": result["equity"],
    }
    with open("trace_exports/failure_recovery_trace.json", "w", encoding="utf-8") as f:
        json.dump(trace_artifact, f, indent=2)

    print("\n[+] Exported failure recovery proof trace to trace_exports/failure_recovery_trace.json")
