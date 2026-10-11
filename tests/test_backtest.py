"""
tests/test_backtest.py — Unit tests for historical simulation, replay engine, and calibration metrics.
"""

import os
import pytest
from mone.backtest import DataLoader, BacktestEngine, compute_metrics, export_backtest_report


def test_data_loader_generation():
    loader = DataLoader()
    records = loader.generate_calibrated_history(days=7)
    # 7 days * 22 stations = 154 records
    assert len(records) == 154
    assert all(r.actual_resolution in ("YES", "NO") for r in records)
    assert all(0.0 <= r.model_rain_prob_pct <= 100.0 for r in records)


def test_compute_metrics():
    sample_trades = [
        {"pnl": 5.0, "invested": 10.0},
        {"pnl": 5.0, "invested": 10.0},
        {"pnl": -10.0, "invested": 10.0},
        {"pnl": 5.0, "invested": 10.0},
    ]
    curve = [100.0, 105.0, 110.0, 100.0, 105.0]
    brier_pairs = [(0.8, 1), (0.2, 0), (0.9, 1), (0.1, 0)]

    summary = compute_metrics(
        name="Test Strategy",
        trades=sample_trades,
        equity_curve=curve,
        brier_pairs=brier_pairs,
        starting_balance=100.0,
        days=4,
        total_stations=88,
    )

    assert summary.trades_executed == 4
    assert summary.trades_won == 3
    assert summary.trades_lost == 1
    assert summary.win_rate_pct == 75.0
    assert summary.cumulative_pnl_usd == 5.0
    assert summary.roi_pct == 5.0
    assert summary.brier_score < 0.10


def test_backtest_engine_run(tmp_path):
    engine = BacktestEngine(starting_balance=1000.00)
    results = engine.run(days=14)

    assert results["total_days"] == 14
    assert results["starting_balance_usd"] == 1000.00
    assert "agent" in results
    assert "market_consensus" in results
    assert "random_baseline" in results

    agent = results["agent"]
    assert agent["win_rate_pct"] > 70.0
    assert agent["brier_score"] < results["market_consensus"]["brier_score"]
    assert len(results["equity_curve"]) == 15

    # Test report export
    json_path = str(tmp_path / "out.json")
    md_path = str(tmp_path / "out.md")
    export_backtest_report(results, output_json=json_path, output_md=md_path)
    assert os.path.exists(json_path)
    assert os.path.exists(md_path)
