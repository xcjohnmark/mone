"""
mone.providers.factory — Dual-Provider Weather Factory & Resilience Fallback.
Provides seamless auto-fallback from Google WeatherNext 3 to Open-Meteo WeatherNext 2.
"""

import logging
from typing import Dict, List, Optional

from mone.config import MoneConfig, WeatherProviderType
from mone.providers.base import WeatherForecast, WeatherProvider
from mone.providers.openmeteo import OpenMeteoWeatherNextProvider
from mone.providers.weathernext3 import WeatherNext3Provider, WeatherNext3Error

logger = logging.getLogger("mone.providers.factory")


class FallbackWeatherProvider(WeatherProvider):
    """
    Composite provider that tries a primary provider (e.g. WeatherNext 3)
    and transparently falls back to secondary provider (Open-Meteo WeatherNext 2)
    upon any authorization or query error.
    """

    def __init__(self, primary: WeatherProvider, secondary: WeatherProvider):
        self.primary = primary
        self.secondary = secondary
        self.fallback_active = False

    @property
    def provider_id(self) -> str:
        return f"composite({self.primary.provider_id}->{self.secondary.provider_id})"

    def get_forecast(self, station: dict, target_date: str) -> WeatherForecast:
        code = station.get("station_code", "UNKNOWN")
        if not self.fallback_active:
            try:
                forecast = self.primary.get_forecast(station, target_date)
                if forecast.is_valid:
                    return forecast
                logger.warning(
                    f"Primary provider {self.primary.provider_id} returned invalid forecast for {code}: {forecast.error}. "
                    f"Falling back to {self.secondary.provider_id}."
                )
            except Exception as exc:
                logger.warning(
                    f"Primary provider {self.primary.provider_id} failed for {code}: {exc}. "
                    f"Activating fallback to {self.secondary.provider_id}."
                )

        # Fallback to secondary provider
        self.fallback_active = True
        return self.secondary.get_forecast(station, target_date)

    def batch_get_forecasts(self, stations: List[dict], target_date: str) -> Dict[str, WeatherForecast]:
        results: Dict[str, WeatherForecast] = {}
        for st in stations:
            code = st.get("station_code", "UNKNOWN")
            results[code] = self.get_forecast(st, target_date)
        return results


def get_weather_provider(config: Optional[MoneConfig] = None) -> WeatherProvider:
    """
    Factory function returning the configured weather provider.
    - WeatherProviderType.OPENMETEO: Direct Open-Meteo WeatherNext 2 ensemble client.
    - WeatherProviderType.WEATHERNEXT3: Direct Google WeatherNext 3 BigQuery client.
    - WeatherProviderType.AUTO: Composite provider (WeatherNext 3 with Open-Meteo fallback).
    """
    if config is None:
        from mone.config import get_config
        config = get_config()

    openmeteo = OpenMeteoWeatherNextProvider(
        api_url=config.openmeteo_api_url,
        timeout=config.openmeteo_timeout_seconds,
        threshold_mm=config.rain_threshold_mm,
    )

    if config.weather_provider == WeatherProviderType.OPENMETEO:
        return openmeteo

    weathernext3 = WeatherNext3Provider(
        gcp_project_id=config.gcp_project_id,
        bq_table=config.weathernext3_bq_table,
        credentials_path=config.google_application_credentials,
        threshold_mm=config.rain_threshold_mm,
    )

    if config.weather_provider == WeatherProviderType.WEATHERNEXT3:
        return weathernext3

    # WeatherProviderType.AUTO:
    # If user provided GCP credentials, try WeatherNext 3 with fallback to Open-Meteo;
    # otherwise, if no credentials exist, default gracefully to Open-Meteo with info log.
    if config.has_weathernext3_credentials():
        return FallbackWeatherProvider(primary=weathernext3, secondary=openmeteo)
    else:
        logger.info(
            "No Google Cloud credentials detected for WeatherNext 3. Defaulting to Open-Meteo WeatherNext 2 ensemble."
        )
        return openmeteo
