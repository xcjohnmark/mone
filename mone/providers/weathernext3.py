"""
mone.providers.weathernext3 — Google DeepMind WeatherNext 3 BigQuery & Spatial Provider.
Enables direct ingestion from WeatherNext 3 datasets on Google Cloud Platform.
Coordinates are mapped with longitude normalization (lon % 360) and 0.01-inch (0.25mm) thresholding.
"""

import logging
from typing import Dict, List, Optional
from datetime import datetime

from mone.providers.base import WeatherForecast, WeatherProvider

logger = logging.getLogger("mone.providers.weathernext3")

RAIN_THRESHOLD_MM = 0.25  # 0.01 inches threshold


class WeatherNext3Error(Exception):
    """Base error for WeatherNext 3 provider."""
    pass


class WeatherNext3AuthError(WeatherNext3Error):
    """Raised when Google Cloud credentials or permissions are missing."""
    pass


class WeatherNext3FetchError(WeatherNext3Error):
    """Raised when BigQuery or GCS query fails."""
    pass


class WeatherNext3Provider(WeatherProvider):
    """
    Ingests operational WeatherNext 3 forecasts from Google Cloud BigQuery.
    Applies 0-360 longitude normalization and member voting logic.
    """

    def __init__(
        self,
        gcp_project_id: Optional[str] = None,
        bq_table: str = "weathernext_3_0_0_0p05deg",
        credentials_path: Optional[str] = None,
        threshold_mm: float = RAIN_THRESHOLD_MM,
        bq_client=None,  # Injected client for unit testing
    ):
        self.gcp_project_id = gcp_project_id
        self.bq_table = bq_table
        self.credentials_path = credentials_path
        self.threshold_mm = threshold_mm
        self._client = bq_client

    @property
    def provider_id(self) -> str:
        return "google_weathernext3"

    def _get_bq_client(self):
        """Initializes BigQuery client lazily with explicit error diagnostics."""
        if self._client is not None:
            return self._client

        try:
            from google.cloud import bigquery
            from google.oauth2 import service_account
        except ImportError:
            raise WeatherNext3AuthError(
                "google-cloud-bigquery is not installed. Install with 'pip install google-cloud-bigquery' "
                "or switch WEATHER_PROVIDER to 'openmeteo'."
            )

        try:
            if self.credentials_path:
                credentials = service_account.Credentials.from_service_account_file(
                    self.credentials_path
                )
                self._client = bigquery.Client(
                    project=self.gcp_project_id or credentials.project_id,
                    credentials=credentials,
                )
            else:
                self._client = bigquery.Client(project=self.gcp_project_id)
            return self._client
        except Exception as e:
            raise WeatherNext3AuthError(
                f"Failed to authenticate with Google Cloud BigQuery for WeatherNext 3: {e}. "
                "Ensure GOOGLE_APPLICATION_CREDENTIALS or gcloud auth is configured."
            )

    @staticmethod
    def normalize_lon(lon: float) -> float:
        """
        Google WeatherNext 3 spatial tables utilize a 0-360 degree longitude convention.
        E.g., -87.9073 (Chicago) -> 272.0927 degrees.
        """
        return lon % 360.0

    def get_forecast(self, station: dict, target_date: str) -> WeatherForecast:
        """
        Queries BigQuery for the given station and forecast date.
        """
        code = station.get("station_code", "UNKNOWN")
        city = station.get("city", "Unknown City")
        lat = station.get("lat", 0.0)
        lon = station.get("lon", 0.0)
        norm_lon = self.normalize_lon(lon)

        try:
            client = self._get_bq_client()
        except WeatherNext3Error as e:
            logger.warning(f"WeatherNext 3 auth error for {code}: {e}")
            raise

        # Construct BigQuery SQL query targeting station coordinates and target date
        query = f"""
            SELECT
                forecast_valid_time,
                ensemble_member_id,
                total_precipitation_meters * 1000.0 as precip_mm
            FROM `{self.bq_table}`
            WHERE
                ABS(latitude - @lat) < 0.05
                AND ABS(longitude - @norm_lon) < 0.05
                AND DATE(forecast_valid_time) = @target_date
            ORDER BY forecast_valid_time ASC
        """

        try:
            from google.cloud import bigquery
            job_config = bigquery.QueryJobConfig(
                query_parameters=[
                    bigquery.ScalarQueryParameter("lat", "FLOAT64", lat),
                    bigquery.ScalarQueryParameter("norm_lon", "FLOAT64", norm_lon),
                    bigquery.ScalarQueryParameter("target_date", "DATE", target_date),
                ]
            )
            query_job = client.query(query, job_config=job_config)
            rows = list(query_job.result())

            if not rows:
                # Return empty forecast with error if no rows matched
                return WeatherForecast(
                    station_code=code,
                    city=city,
                    target_date=target_date,
                    provider_name=self.provider_id,
                    error=f"No WeatherNext 3 forecast records returned for {code} on {target_date}",
                    mean_precipitation_mm=0.0,
                    rain_probability_pct=0.0,
                    ensemble_yes_votes=0,
                    ensemble_total_members=50,
                )

            # Group precipitation by ensemble member
            member_totals: Dict[str, float] = {}
            for r in rows:
                member_id = str(r["ensemble_member_id"])
                precip = float(r["precip_mm"] or 0.0)
                member_totals[member_id] = member_totals.get(member_id, 0.0) + precip

            total_members = len(member_totals) or 50
            yes_votes = sum(1 for tot in member_totals.values() if tot >= self.threshold_mm)
            mean_mm = sum(member_totals.values()) / total_members if member_totals else 0.0
            prob_pct = (yes_votes / total_members) * 100.0 if total_members > 0 else 0.0

            return WeatherForecast(
                station_code=code,
                city=city,
                target_date=target_date,
                provider_name=self.provider_id,
                mean_precipitation_mm=round(mean_mm, 3),
                rain_probability_pct=round(prob_pct, 1),
                ensemble_yes_votes=yes_votes,
                ensemble_total_members=total_members,
            )
        except Exception as e:
            logger.error(f"WeatherNext 3 BigQuery execution failed for {code}: {e}")
            raise WeatherNext3FetchError(f"BigQuery failure for {code}: {e}")

    def batch_get_forecasts(self, stations: List[dict], target_date: str) -> Dict[str, WeatherForecast]:
        """Fetch forecasts across multiple stations."""
        results: Dict[str, WeatherForecast] = {}
        for st in stations:
            code = st.get("station_code", "UNKNOWN")
            try:
                results[code] = self.get_forecast(st, target_date)
            except Exception as e:
                logger.warning(f"Error querying WeatherNext 3 for {code}: {e}")
                results[code] = WeatherForecast(
                    station_code=code,
                    city=st.get("city", "Unknown"),
                    target_date=target_date,
                    provider_name=self.provider_id,
                    error=str(e),
                )
        return results
