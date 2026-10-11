"""
tests/test_risk.py — Unit tests for risk management guardrails and circuit breaker.
"""

from mone.config import MoneConfig
from mone.risk import RiskManager
from mone.strategy.rules import TradeSignal


def create_dummy_signal(capital: float = 10.0, actionable: bool = True) -> TradeSignal:
    return TradeSignal(
        station_code="CLIORD",
        city="Chicago",
        target_date="2026-10-12",
        market_id="KXRAIN-26OCT12-CHI",
        venue="paper",
        action="BUY_YES" if actionable else "NO_TRADE",
        side="YES" if actionable else "NONE",
        model_prob_pct=85.0,
        market_ask=0.45,
        market_implied_prob_pct=45.0,
        edge_pct=40.0,
        expected_roi_pct=122.0,
        contracts_suggested=22,
        capital_allocated=capital,
        reason="Test signal",
        is_actionable=actionable,
    )


def test_risk_manager_allows_valid_signal():
    cfg = MoneConfig(MAX_DAILY_DRAWDOWN=50.0, CAPITAL_PER_TRADE=10.0)
    rm = RiskManager(cfg)
    sig = create_dummy_signal(capital=9.90, actionable=True)

    check = rm.validate_signal_risk(sig, current_cash_balance=100.0)
    assert check.allowed is True
    assert check.circuit_breaker_tripped is False


def test_risk_manager_blocks_insufficient_funds():
    cfg = MoneConfig()
    rm = RiskManager(cfg)
    sig = create_dummy_signal(capital=10.0, actionable=True)

    check = rm.validate_signal_risk(sig, current_cash_balance=5.0)
    assert check.allowed is False
    assert "Insufficient balance" in check.reason


def test_circuit_breaker_trips_on_max_drawdown():
    cfg = MoneConfig(MAX_DAILY_DRAWDOWN=50.0)
    rm = RiskManager(cfg)

    # First loss $30 - still fine
    rm.record_loss(30.0)
    assert rm.circuit_breaker_tripped is False

    # Second loss $25 - total $55 >= $50 -> Trips circuit breaker!
    rm.record_loss(25.0)
    assert rm.circuit_breaker_tripped is True

    sig = create_dummy_signal(capital=10.0, actionable=True)
    check = rm.validate_signal_risk(sig, current_cash_balance=1000.0)
    assert check.allowed is False
    assert check.circuit_breaker_tripped is True
    assert "Circuit Breaker Tripped" in check.reason
