"""
mone.providers.openmeteo — Open-Meteo WeatherNext 2 Ensemble Provider.
Free, zero-auth 63-member ensemble REST API.
"""

import json
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List, Optional
import urllib.parse
import urllib.request

from mone.providers.base import WeatherForecast, WeatherProvider

logger = logging.getLogger("mone.providers.openmeteo")

RAIN_THRESHOLD_MM = 0.25  # 0.01 inches strictly required by Kalshi KXRAIN


class OpenMeteoWeatherNextProvider(WeatherProvider):
    """
    Ingests Google WeatherNext 2 63-member ensemble forecasts via Open-Meteo.
    Requires no API key, delivers ~150ms latency per coordinate.
    """

    def __init__(
        self,
        api_url: str = "https://ensemble-api.open-meteo.com/v1/ensemble",
        timeout: int = 15,
        threshold_mm: float = RAIN_THRESHOLD_MM,
    ):
        self.api_url = api_url
        self.timeout = timeout
        self.threshold_mm = threshold_mm

    @property
    def provider_id(self) -> str:
        return "openmeteo_weathernext2"

    def get_forecast(self, station: dict, target_date: str) -> WeatherForecast:
        """Fetch forecast for a single station coordinate."""
        code = station.get("station_code", "UNKNOWN")
        city = station.get("city", "Unknown City")
        lat = station.get("lat", 0.0)
        lon = station.get("lon", 0.0)
        tz = station.get("timezone", "UTC")

        params = {
            "latitude": str(lat),
            "longitude": str(lon),
            "models": "google_weathernext2_ensemble",
            "hourly": "precipitation",
            "timezone": tz,
        }
        query_string = urllib.parse.urlencode(params)
        url = f"{self.api_url}?{query_string}"

        req = urllib.request.Request(
            url,
            headers={"User-Agent": "mone-agent/0.1.0 (+https://github.com/xcjohnmark/mone)"}
        )

        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                data = json.loads(resp.read().decode())
        except Exception as e:
            logger.warning(f"Failed to fetch forecast from Open-Meteo for {code}: {e}")
            return WeatherForecast(
                station_code=code,
                city=city,
                target_date=target_date,
                provider_name=self.provider_id,
                error=str(e),
                mean_precipitation_mm=0.0,
                rain_probability_pct=0.0,
                ensemble_yes_votes=0,
                ensemble_total_members=63,
            )

        return self._parse_ensemble_response(data, code, city, target_date)

    def _parse_ensemble_response(
        self, data: dict, station_code: str, city: str, target_date: str
    ) -> WeatherForecast:
        """Parses hourly ensemble members and votes on precipitation >= 0.25mm."""
        hourly = data.get("hourly", {})
        times = hourly.get("time", [])

        # Find indices corresponding to target date (YYYY-MM-DDTHH:MM)
        day_indices = [i for i, t in enumerate(times) if t.startswith(target_date)]
        if not day_indices:
            return WeatherForecast(
                station_code=station_code,
                city=city,
                target_date=target_date,
                provider_name=self.provider_id,
                error=f"Target date {target_date} not present in forecast horizon",
                mean_precipitation_mm=0.0,
                rain_probability_pct=0.0,
                ensemble_yes_votes=0,
                ensemble_total_members=63,
            )

        member_keys = [k for k in hourly.keys() if k.startswith("precipitation_member")]
        if not member_keys:
            # Fallback to single precipitation series if ensemble members not split
            precip = hourly.get("precipitation", [])
            day_precip = sum(precip[i] for i in day_indices if i < len(precip) and precip[i] is not None)
            prob = 100.0 if day_precip >= self.threshold_mm else 0.0
            return WeatherForecast(
                station_code=station_code,
                city=city,
                target_date=target_date,
                provider_name=self.provider_id,
                mean_precipitation_mm=day_precip,
                rain_probability_pct=prob,
                ensemble_yes_votes=1 if day_precip >= self.threshold_mm else 0,
                ensemble_total_members=1,
            )

        yes_votes = 0
        total_members = len(member_keys)
        member_daily_totals = []

        for m_key in member_keys:
            m_series = hourly[m_key]
            daily_total = sum(
                m_series[i]
                for i in day_indices
                if i < len(m_series) and m_series[i] is not None
            )
            member_daily_totals.append(daily_total)
            if daily_total >= self.threshold_mm:
                yes_votes += 1

        mean_total = sum(member_daily_totals) / len(member_daily_totals) if member_daily_totals else 0.0
        prob_rain = (yes_votes / total_members) * 100.0 if total_members > 0 else 0.0

        return WeatherForecast(
            station_code=station_code,
            city=city,
            target_date=target_date,
            provider_name=self.provider_id,
            mean_precipitation_mm=round(mean_total, 3),
            rain_probability_pct=round(prob_rain, 1),
            ensemble_yes_votes=yes_votes,
            ensemble_total_members=total_members,
        )

    def batch_get_forecasts(self, stations: List[dict], target_date: str) -> Dict[str, WeatherForecast]:
        """Fetch forecasts across all stations concurrently."""
        results: Dict[str, WeatherForecast] = {}
        with ThreadPoolExecutor(max_workers=min(8, len(stations) or 1)) as executor:
            future_to_station = {
                executor.submit(self.get_forecast, st, target_date): st
                for st in stations
            }
            for future in as_completed(future_to_station):
                st = future_to_station[future]
                code = st.get("station_code", "UNKNOWN")
                try:
                    results[code] = future.result()
                except Exception as exc:
                    logger.error(f"Error fetching {code}: {exc}")
                    results[code] = WeatherForecast(
                        station_code=code,
                        city=st.get("city", "Unknown"),
                        target_date=target_date,
                        provider_name=self.provider_id,
                        error=str(exc),
                    )
        return results
