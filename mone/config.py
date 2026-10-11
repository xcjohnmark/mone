"""
mone.config — Central Configuration & Bring-Your-Own-Key (BYOK) Validator.
Loads configuration from environment variables, .env files, and CLI overrides.
"""

from enum import Enum
from typing import Literal, Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class WeatherProviderType(str, Enum):
    AUTO = "auto"
    WEATHERNEXT3 = "weathernext3"
    OPENMETEO = "openmeteo"


class MarketVenueType(str, Enum):
    PAPER = "paper"
    KALSHI_DEMO = "kalshi_demo"
    KALSHI_LIVE = "kalshi_live"
    POLYMARKET = "polymarket"


class AutonomyMode(str, Enum):
    COPILOT = "copilot"
    AUTONOMOUS = "autonomous"


class MoneConfig(BaseSettings):
    """
    Central settings for the mone agent.
    Validates risk boundaries, exchange credentials, and weather provider setups.
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False
    )

    # --- Neatlogs Observability ---
    neatlogs_api_key: Optional[str] = Field(default=None, alias="NEATLOGS_API_KEY")
    neatlogs_workflow_name: str = Field(default="mone-trading-agent", alias="NEATLOGS_WORKFLOW_NAME")
    neatlogs_tracing_enabled: bool = Field(default=True, alias="NEATLOGS_TRACING_ENABLED")

    # --- Weather Provider ---
    weather_provider: WeatherProviderType = Field(default=WeatherProviderType.AUTO, alias="WEATHER_PROVIDER")
    google_application_credentials: Optional[str] = Field(default=None, alias="GOOGLE_APPLICATION_CREDENTIALS")
    gcp_project_id: Optional[str] = Field(default=None, alias="GCP_PROJECT_ID")
    weathernext3_bq_table: str = Field(default="weathernext_3_0_0_0p05deg", alias="WEATHERNEXT3_BQ_TABLE")
    weathernext3_gcs_bucket: str = Field(default="weathernext3_spatial", alias="WEATHERNEXT3_GCS_BUCKET")
    openmeteo_api_url: str = Field(
        default="https://ensemble-api.open-meteo.com/v1/ensemble",
        alias="OPENMETEO_API_URL"
    )
    openmeteo_timeout_seconds: int = Field(default=15, alias="OPENMETEO_TIMEOUT_SECONDS")

    # --- Market Venues & Keys ---
    default_venue: MarketVenueType = Field(default=MarketVenueType.PAPER, alias="DEFAULT_VENUE")
    
    # Kalshi Demo
    kalshi_demo_email: Optional[str] = Field(default=None, alias="KALSHI_DEMO_EMAIL")
    kalshi_demo_password: Optional[str] = Field(default=None, alias="KALSHI_DEMO_PASSWORD")
    kalshi_demo_api_key_id: Optional[str] = Field(default=None, alias="KALSHI_DEMO_API_KEY_ID")
    kalshi_demo_private_key_path: Optional[str] = Field(default=None, alias="KALSHI_DEMO_PRIVATE_KEY_PATH")

    # Kalshi Live Production
    kalshi_email: Optional[str] = Field(default=None, alias="KALSHI_EMAIL")
    kalshi_password: Optional[str] = Field(default=None, alias="KALSHI_PASSWORD")
    kalshi_api_key_id: Optional[str] = Field(default=None, alias="KALSHI_API_KEY_ID")
    kalshi_private_key_path: Optional[str] = Field(default=None, alias="KALSHI_PRIVATE_KEY_PATH")

    # Polymarket
    polymarket_api_key: Optional[str] = Field(default=None, alias="POLYMARKET_API_KEY")
    polymarket_api_secret: Optional[str] = Field(default=None, alias="POLYMARKET_API_SECRET")
    polymarket_passphrase: Optional[str] = Field(default=None, alias="POLYMARKET_PASSPHRASE")
    polymarket_proxy_wallet: Optional[str] = Field(default=None, alias="POLYMARKET_PROXY_WALLET")

    # --- Strategy & Risk Parameters ---
    long_yes_prob_threshold: float = Field(default=75.0, alias="LONG_YES_PROB_THRESHOLD")
    long_no_prob_threshold: float = Field(default=25.0, alias="LONG_NO_PROB_THRESHOLD")
    max_entry_ask_price: float = Field(default=0.80, alias="MAX_ENTRY_ASK_PRICE")
    capital_per_trade: float = Field(default=10.00, alias="CAPITAL_PER_TRADE")
    max_daily_drawdown: float = Field(default=50.00, alias="MAX_DAILY_DRAWDOWN")
    min_edge_threshold: float = Field(default=0.05, alias="MIN_EDGE_THRESHOLD")
    rain_threshold_mm: float = Field(default=0.25, alias="RAIN_THRESHOLD_MM")

    # --- Agent Autonomy & Execution ---
    agent_autonomy_mode: AutonomyMode = Field(default=AutonomyMode.COPILOT, alias="AGENT_AUTONOMY_MODE")
    execution_interval_minutes: int = Field(default=60, alias="EXECUTION_INTERVAL_MINUTES")
    database_url: str = Field(default="sqlite:///./mone.db", alias="DATABASE_URL")

    # --- Dodo Payments ---
    dodo_payments_api_key: Optional[str] = Field(default=None, alias="DODO_PAYMENTS_API_KEY")
    dodo_payments_webhook_secret: Optional[str] = Field(default=None, alias="DODO_PAYMENTS_WEBHOOK_SECRET")
    dodo_payments_environment: str = Field(default="test", alias="DODO_PAYMENTS_ENVIRONMENT")

    # --- Validators ---
    @field_validator("long_yes_prob_threshold")
    @classmethod
    def validate_yes_prob(cls, v: float) -> float:
        if not (50.0 <= v <= 100.0):
            raise ValueError(f"LONG_YES_PROB_THRESHOLD must be between 50.0 and 100.0, got {v}")
        return v

    @field_validator("long_no_prob_threshold")
    @classmethod
    def validate_no_prob(cls, v: float) -> float:
        if not (0.0 <= v <= 50.0):
            raise ValueError(f"LONG_NO_PROB_THRESHOLD must be between 0.0 and 50.0, got {v}")
        return v

    @field_validator("max_entry_ask_price")
    @classmethod
    def validate_ask_price(cls, v: float) -> float:
        if not (0.01 <= v <= 0.99):
            raise ValueError(f"MAX_ENTRY_ASK_PRICE must be between 0.01 and 0.99 (dollars), got {v}")
        return v

    @field_validator("capital_per_trade")
    @classmethod
    def validate_capital_per_trade(cls, v: float) -> float:
        if v <= 0:
            raise ValueError(f"CAPITAL_PER_TRADE must be strictly positive, got {v}")
        return v

    @field_validator("max_daily_drawdown")
    @classmethod
    def validate_drawdown(cls, v: float) -> float:
        if v <= 0:
            raise ValueError(f"MAX_DAILY_DRAWDOWN must be strictly positive, got {v}")
        return v

    @field_validator("rain_threshold_mm")
    @classmethod
    def validate_rain_threshold(cls, v: float) -> float:
        if v <= 0:
            raise ValueError(f"RAIN_THRESHOLD_MM must be strictly positive, got {v}")
        return v

    # --- Helper checks ---
    def has_neatlogs(self) -> bool:
        return bool(self.neatlogs_api_key and self.neatlogs_tracing_enabled)

    def has_weathernext3_credentials(self) -> bool:
        return bool(self.google_application_credentials or self.gcp_project_id)

    def has_kalshi_credentials(self) -> bool:
        if self.default_venue == MarketVenueType.KALSHI_DEMO:
            return bool((self.kalshi_demo_email and self.kalshi_demo_password) or self.kalshi_demo_api_key_id)
        if self.default_venue == MarketVenueType.KALSHI_LIVE:
            return bool((self.kalshi_email and self.kalshi_password) or self.kalshi_api_key_id)
        return False


# Global singleton instance cache
_config_instance: Optional[MoneConfig] = None


def get_config(reload: bool = False, **overrides) -> MoneConfig:
    """
    Returns the application configuration singleton.
    Can be overridden with runtime kwargs for testing or CLI arguments.
    """
    global _config_instance
    cleaned_overrides = {k: v for k, v in overrides.items() if v is not None}
    if _config_instance is None or reload or cleaned_overrides:
        _config_instance = MoneConfig(**cleaned_overrides)
    return _config_instance
