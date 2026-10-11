"""
mone.providers — Weather data ingestion engines.
"""

from mone.providers.base import WeatherForecast, WeatherProvider
from mone.providers.openmeteo import OpenMeteoWeatherNextProvider
from mone.providers.weathernext3 import (
    WeatherNext3Provider,
    WeatherNext3Error,
    WeatherNext3AuthError,
    WeatherNext3FetchError,
)
from mone.providers.factory import FallbackWeatherProvider, get_weather_provider

__all__ = [
    "WeatherForecast",
    "WeatherProvider",
    "OpenMeteoWeatherNextProvider",
    "WeatherNext3Provider",
    "WeatherNext3Error",
    "WeatherNext3AuthError",
    "WeatherNext3FetchError",
    "FallbackWeatherProvider",
    "get_weather_provider",
]
