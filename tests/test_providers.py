"""
tests/test_providers.py — Tests for Weather Providers (Open-Meteo, WeatherNext 3, and Fallback).
"""

from unittest.mock import MagicMock, patch
import pytest
from mone.config import MoneConfig, WeatherProviderType
from mone.providers.base import WeatherForecast
from mone.providers.openmeteo import OpenMeteoWeatherNextProvider
from mone.providers.weathernext3 import WeatherNext3Provider, WeatherNext3AuthError
from mone.providers.factory import FallbackWeatherProvider, get_weather_provider


SAMPLE_STATION = {
    "station_code": "CLIORD",
    "city": "Chicago",
    "lat": 41.9742,
    "lon": -87.9073,
    "timezone": "America/Chicago",
}


def test_weathernext3_lon_normalization():
    # Longitude -87.9073 should normalize to 272.0927
    normalized = WeatherNext3Provider.normalize_lon(-87.9073)
    assert normalized == pytest.approx(272.0927, rel=1e-4)

    # Positive longitude should stay identical
    assert WeatherNext3Provider.normalize_lon(12.5) == 12.5


def test_weathernext3_missing_credentials():
    provider = WeatherNext3Provider(gcp_project_id=None, credentials_path=None)
    with pytest.raises(WeatherNext3AuthError):
        # Without GCP credentials or installed ADC, accessing client raises WeatherNext3AuthError
        provider.get_forecast(SAMPLE_STATION, "2026-10-12")


def test_openmeteo_parse_ensemble_voting():
    provider = OpenMeteoWeatherNextProvider()

    # Create dummy ensemble with 4 members across 2 hours for 2026-10-12
    # Member 0: 0.15 + 0.15 = 0.30mm (>= 0.25mm -> YES)
    # Member 1: 0.20 + 0.10 = 0.30mm (>= 0.25mm -> YES)
    # Member 2: 0.05 + 0.05 = 0.10mm (< 0.25mm -> NO)
    # Member 3: 0.00 + 0.00 = 0.00mm (< 0.25mm -> NO)
    mock_data = {
        "hourly": {
            "time": ["2026-10-12T00:00", "2026-10-12T01:00"],
            "precipitation_member01": [0.15, 0.15],
            "precipitation_member02": [0.20, 0.10],
            "precipitation_member03": [0.05, 0.05],
            "precipitation_member04": [0.00, 0.00],
        }
    }

    forecast = provider._parse_ensemble_response(
        mock_data, "CLIORD", "Chicago", "2026-10-12"
    )

    assert forecast.station_code == "CLIORD"
    assert forecast.city == "Chicago"
    assert forecast.ensemble_total_members == 4
    assert forecast.ensemble_yes_votes == 2  # 2 members >= 0.25mm
    assert forecast.rain_probability_pct == 50.0  # 2/4 = 50%
    assert forecast.is_valid is True
    assert forecast.error is None


def test_fallback_weather_provider():
    primary = MagicMock()
    # Primary fails with error
    primary.provider_id = "failing_primary"
    primary.get_forecast.side_effect = RuntimeError("BigQuery connection timed out")

    secondary = MagicMock()
    secondary.provider_id = "backup_secondary"
    secondary.get_forecast.return_value = WeatherForecast(
        station_code="CLIORD",
        city="Chicago",
        target_date="2026-10-12",
        provider_name="backup_secondary",
        mean_precipitation_mm=1.2,
        rain_probability_pct=85.0,
        ensemble_yes_votes=54,
        ensemble_total_members=63,
    )

    composite = FallbackWeatherProvider(primary=primary, secondary=secondary)
    forecast = composite.get_forecast(SAMPLE_STATION, "2026-10-12")

    assert forecast.is_valid is True
    assert forecast.rain_probability_pct == 85.0
    assert forecast.provider_name == "backup_secondary"
    assert composite.fallback_active is True


def test_provider_factory():
    cfg_om = MoneConfig(WEATHER_PROVIDER="openmeteo")
    p1 = get_weather_provider(cfg_om)
    assert isinstance(p1, OpenMeteoWeatherNextProvider)

    cfg_wn3 = MoneConfig(WEATHER_PROVIDER="weathernext3")
    p2 = get_weather_provider(cfg_wn3)
    assert isinstance(p2, WeatherNext3Provider)

    cfg_auto_no_creds = MoneConfig(WEATHER_PROVIDER="auto")
    p3 = get_weather_provider(cfg_auto_no_creds)
    # Without GCP credentials, auto gracefully returns Open-Meteo
    assert isinstance(p3, OpenMeteoWeatherNextProvider)

    cfg_auto_creds = MoneConfig(WEATHER_PROVIDER="auto", GCP_PROJECT_ID="test-gcp-proj")
    p4 = get_weather_provider(cfg_auto_creds)
    # With GCP credentials, auto returns FallbackWeatherProvider
    assert isinstance(p4, FallbackWeatherProvider)
