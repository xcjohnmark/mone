"""
tests.test_cli_queries — Unit tests for CLI commands and query parsing.
"""

import pytest
from mone.agent import MoneAgent
from mone.config import MoneConfig, MarketVenueType
from mone.markets import resolve_station
from mone.state import Database, PositionRecord, SignalRecord


def test_resolve_station_fuzzy():
    # 1. By ticker suffix
    s1 = resolve_station("SATX")
    assert s1 is not None
    assert s1.station_code == "CLISAT"
    assert s1.city == "San Antonio"

    # 2. By market ticker
    s2 = resolve_station("KXRAIN-26OCT12-CHI")
    assert s2 is not None
    assert s2.station_code == "CLIORD"

    # 3. By city name
    s3 = resolve_station("Miami")
    assert s3 is not None
    assert s3.station_code == "CLIMIA"

    # 4. By station code
    s4 = resolve_station("CLIDEN")
    assert s4 is not None
    assert s4.city == "Denver"


def test_execute_custom_trade_by_station(tmp_path):
    db_file = str(tmp_path / "test_cli.db")
    cfg = MoneConfig(
        database_url=f"sqlite:///{db_file}",
        default_venue=MarketVenueType.KALSHI_DEMO,
        capital_per_trade=15.0,
    )
    db = Database(db_path=db_file)
    agent = MoneAgent(config=cfg, db=db)

    # Place trade on station ticker
    pos = agent.execute_custom_trade(
        identifier="SATX",
        side="YES",
        capital=10.0,
        contracts=20,
    )

    assert pos is not None
    assert pos.station_code == "CLISAT"
    assert pos.side == "YES"
    assert pos.contracts == 20
    assert pos.status == "OPEN"

    eq = db.get_equity_summary()
    assert eq.open_positions_count >= 1
    assert eq.cash_balance < 100.0


def test_execute_custom_trade_by_staged_signal(tmp_path):
    db_file = str(tmp_path / "test_cli2.db")
    cfg = MoneConfig(
        database_url=f"sqlite:///{db_file}",
        default_venue=MarketVenueType.KALSHI_DEMO,
        capital_per_trade=10.0,
    )
    db = Database(db_path=db_file)
    agent = MoneAgent(config=cfg, db=db)

    # Insert a staged signal
    from mone.strategy import TradeSignal
    sig = TradeSignal(
        station_code="CLIORD",
        city="Chicago",
        target_date="2026-10-12",
        market_id="KXRAIN-26OCT12-CHI",
        venue="kalshi_demo",
        action="BUY_YES",
        side="YES",
        model_prob_pct=85.0,
        market_ask=0.45,
        market_implied_prob_pct=45.0,
        edge_pct=40.0,
        expected_roi_pct=122.2,
        contracts_suggested=22,
        capital_allocated=9.90,
        reason="Test staged signal",
        is_actionable=True,
    )
    sig_id = db.record_signal(sig, status="STAGED")

    # Trade by signal ID string "1" or "#1"
    pos = agent.execute_custom_trade(identifier=f"#{sig_id}")
    assert pos is not None
    assert pos.market_id == "KXRAIN-26OCT12-CHI"
    assert pos.city == "Chicago"

    staged_remaining = db.get_staged_signals()
    assert not any(s.id == sig_id for s in staged_remaining)
