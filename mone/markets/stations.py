"""
mone.markets.stations — 22 Official NWS Airport Weather Stations for Prediction Markets.
Maps between Kalshi KXRAIN ticker suffixes, NWS airport station codes, and exact coordinates.
"""

from typing import Dict, List, Optional
from pydantic import BaseModel


class StationInfo(BaseModel):
    city: str
    station_code: str
    kalshi_suffix: str
    lat: float
    lon: float
    timezone: str
    nws_airport_code: str


NWS_STATIONS: List[StationInfo] = [
    StationInfo(
        city="Chicago",
        station_code="CLIORD",
        kalshi_suffix="CHI",
        lat=41.9742,
        lon=-87.9073,
        timezone="America/Chicago",
        nws_airport_code="KORD",
    ),
    StationInfo(
        city="Denver",
        station_code="CLIDEN",
        kalshi_suffix="DEN",
        lat=39.8561,
        lon=-104.6737,
        timezone="America/Denver",
        nws_airport_code="KDEN",
    ),
    StationInfo(
        city="Los Angeles",
        station_code="CLILAX",
        kalshi_suffix="LAX",
        lat=33.9425,
        lon=-118.4081,
        timezone="America/Los_Angeles",
        nws_airport_code="KLAX",
    ),
    StationInfo(
        city="Las Vegas",
        station_code="CLILAS",
        kalshi_suffix="LV",
        lat=36.0840,
        lon=-115.1537,
        timezone="America/Los_Angeles",
        nws_airport_code="KLAS",
    ),
    StationInfo(
        city="Miami",
        station_code="CLIMIA",
        kalshi_suffix="MIA",
        lat=25.7959,
        lon=-80.2870,
        timezone="America/New_York",
        nws_airport_code="KMIA",
    ),
    StationInfo(
        city="New Orleans",
        station_code="CLIMSY",
        kalshi_suffix="NOLA",
        lat=29.9934,
        lon=-90.2580,
        timezone="America/Chicago",
        nws_airport_code="KMSY",
    ),
    StationInfo(
        city="New York City",
        station_code="CLINYC",
        kalshi_suffix="NYC",
        lat=40.7829,
        lon=-73.9654,
        timezone="America/New_York",
        nws_airport_code="KNYC",
    ),
    StationInfo(
        city="Philadelphia",
        station_code="CLIPHL",
        kalshi_suffix="PHIL",
        lat=39.8729,
        lon=-75.2437,
        timezone="America/New_York",
        nws_airport_code="KPHL",
    ),
    StationInfo(
        city="San Francisco",
        station_code="CLISFO",
        kalshi_suffix="SFO",
        lat=37.6213,
        lon=-122.3790,
        timezone="America/Los_Angeles",
        nws_airport_code="KSFO",
    ),
    StationInfo(
        city="Trenton",
        station_code="CLITTN",
        kalshi_suffix="TTN",
        lat=40.2767,
        lon=-74.8160,
        timezone="America/New_York",
        nws_airport_code="KTTN",
    ),
    StationInfo(
        city="Atlanta",
        station_code="CLIATL",
        kalshi_suffix="ATL",
        lat=33.6407,
        lon=-84.4277,
        timezone="America/New_York",
        nws_airport_code="KATL",
    ),
    StationInfo(
        city="Austin",
        station_code="CLIAUS",
        kalshi_suffix="AUS",
        lat=30.1975,
        lon=-97.6664,
        timezone="America/Chicago",
        nws_airport_code="KAUS",
    ),
    StationInfo(
        city="Boston",
        station_code="CLIBOS",
        kalshi_suffix="BOS",
        lat=42.3656,
        lon=-71.0096,
        timezone="America/New_York",
        nws_airport_code="KBOS",
    ),
    StationInfo(
        city="Dallas",
        station_code="CLIDFW",
        kalshi_suffix="DAL",
        lat=32.8998,
        lon=-97.0403,
        timezone="America/Chicago",
        nws_airport_code="KDFW",
    ),
    StationInfo(
        city="Washington DC",
        station_code="CLIDCA",
        kalshi_suffix="DC",
        lat=38.8512,
        lon=-77.0402,
        timezone="America/New_York",
        nws_airport_code="KDCA",
    ),
    StationInfo(
        city="Newark",
        station_code="CLIEWR",
        kalshi_suffix="EWR",
        lat=40.6895,
        lon=-74.1745,
        timezone="America/New_York",
        nws_airport_code="KEWR",
    ),
    StationInfo(
        city="Houston",
        station_code="CLIHOU",
        kalshi_suffix="HOU",
        lat=29.6454,
        lon=-95.2789,
        timezone="America/Chicago",
        nws_airport_code="KHOU",
    ),
    StationInfo(
        city="Minneapolis",
        station_code="CLIMSP",
        kalshi_suffix="MIN",
        lat=44.8848,
        lon=-93.2223,
        timezone="America/Chicago",
        nws_airport_code="KMSP",
    ),
    StationInfo(
        city="Oklahoma City",
        station_code="CLIOKC",
        kalshi_suffix="OKC",
        lat=35.3931,
        lon=-97.6007,
        timezone="America/Chicago",
        nws_airport_code="KOKC",
    ),
    StationInfo(
        city="Phoenix",
        station_code="CLIPHX",
        kalshi_suffix="PHX",
        lat=33.4373,
        lon=-112.0078,
        timezone="America/Phoenix",
        nws_airport_code="KPHX",
    ),
    StationInfo(
        city="San Antonio",
        station_code="CLISAT",
        kalshi_suffix="SATX",
        lat=29.5337,
        lon=-98.4698,
        timezone="America/Chicago",
        nws_airport_code="KSAT",
    ),
    StationInfo(
        city="Seattle",
        station_code="CLISEA",
        kalshi_suffix="SEA",
        lat=47.4502,
        lon=-122.3088,
        timezone="America/Los_Angeles",
        nws_airport_code="KSEA",
    ),
]

_BY_CODE: Dict[str, StationInfo] = {s.station_code: s for s in NWS_STATIONS}
_BY_SUFFIX: Dict[str, StationInfo] = {s.kalshi_suffix: s for s in NWS_STATIONS}
_BY_CITY: Dict[str, StationInfo] = {s.city.lower(): s for s in NWS_STATIONS}


def get_all_stations() -> List[StationInfo]:
    """Returns all 22 official NWS stations."""
    return NWS_STATIONS


def get_station_by_code(code: str) -> Optional[StationInfo]:
    """Returns station by 6-letter station code (e.g. CLIORD)."""
    return _BY_CODE.get(code.upper())


def get_station_by_suffix(suffix: str) -> Optional[StationInfo]:
    """Returns station by Kalshi suffix (e.g. CHI, MIA)."""
    return _BY_SUFFIX.get(suffix.upper())


def get_station_by_city(city: str) -> Optional[StationInfo]:
    """Returns station by city name case-insensitively."""
    return _BY_CITY.get(city.strip().lower())
