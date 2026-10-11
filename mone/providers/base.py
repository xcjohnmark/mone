"""
mone.providers.base — Abstract Weather Provider Interface and Data Models.
"""

from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class WeatherForecast(BaseModel):
    """
    Normalized weather forecast output produced by any weather provider.
    Standardized to 0.01 inches (0.25 mm) precipitation threshold for prediction markets.
    """
    station_code: str = Field(description="NWS 6-letter station code, e.g. CLIORD")
    city: str = Field(description="Associated city name, e.g. Chicago")
    target_date: str = Field(description="Forecast target date in YYYY-MM-DD format")
    provider_name: str = Field(description="Source provider: google_weathernext3 or openmeteo_weathernext2")
    mean_precipitation_mm: float = Field(default=0.0, description="Ensemble mean expected precipitation in mm")
    rain_probability_pct: float = Field(default=0.0, description="Ensemble probability of >= 0.25mm rain (0.0 - 100.0%)")
    ensemble_yes_votes: int = Field(default=0, description="Ensemble members exceeding threshold")
    ensemble_total_members: int = Field(default=63, description="Total ensemble members evaluated")
    timestamp_utc: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO timestamp when forecast was generated"
    )
    error: Optional[str] = Field(default=None, description="Error message if fetch failed")

    @property
    def mean_precipitation_inches(self) -> float:
        """Convert precipitation to inches (divide by 25.4)."""
        return self.mean_precipitation_mm / 25.4

    @property
    def is_valid(self) -> bool:
        return self.error is None and self.ensemble_total_members > 0


class WeatherProvider(ABC):
    """Abstract base class that all weather providers must implement."""

    @property
    @abstractmethod
    def provider_id(self) -> str:
        """Unique identifier string for the provider."""
        pass

    @abstractmethod
    def get_forecast(self, station: dict, target_date: str) -> WeatherForecast:
        """
        Fetch forecast for a single station dictionary containing:
        {
            'station_code': 'CLIORD',
            'city': 'Chicago',
            'lat': 41.9742,
            'lon': -87.9073,
            'timezone': 'America/Chicago'
        }
        """
        pass

    @abstractmethod
    def batch_get_forecasts(self, stations: List[dict], target_date: str) -> Dict[str, WeatherForecast]:
        """
        Fetch forecasts for a list of stations concurrently.
        Returns mapping from station_code -> WeatherForecast.
        """
        pass
