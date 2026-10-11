"""
mone.backtest.metrics — Quantitative Performance Metrics & Calibration Scoring.
Computes Win Rate, PnL, Max Drawdown, Sharpe Ratio, Profit Factor, and Brier Score.
"""

import math
from typing import Dict, List
from pydantic import BaseModel


class BacktestSummary(BaseModel):
    name: str
    total_days: int
    total_stations_evaluated: int
    trades_executed: int
    trades_won: int
    trades_lost: int
    win_rate_pct: float
    total_invested_usd: float
    total_payout_usd: float
    cumulative_pnl_usd: float
    roi_pct: float
    max_drawdown_pct: float
    sharpe_ratio: float
    profit_factor: float
    brier_score: float  # 0.0 to 1.0 (lower is more calibrated)


def compute_metrics(
    name: str,
    trades: List[Dict],
    equity_curve: List[float],
    brier_pairs: List[tuple[float, int]],
    starting_balance: float = 1000.0,
    days: int = 60,
    total_stations: int = 1320,
) -> BacktestSummary:
    """
    Computes rigorous quant metrics across backtest trades and equity curve.
    """
    trades_count = len(trades)
    if trades_count == 0:
        return BacktestSummary(
            name=name,
            total_days=days,
            total_stations_evaluated=total_stations,
            trades_executed=0,
            trades_won=0,
            trades_lost=0,
            win_rate_pct=0.0,
            total_invested_usd=0.0,
            total_payout_usd=0.0,
            cumulative_pnl_usd=0.0,
            roi_pct=0.0,
            max_drawdown_pct=0.0,
            sharpe_ratio=0.0,
            profit_factor=0.0,
            brier_score=0.25,
        )

    wins = [t for t in trades if t["pnl"] > 0]
    losses = [t for t in trades if t["pnl"] < 0]

    wins_count = len(wins)
    losses_count = len(losses)
    win_rate = (wins_count / trades_count) * 100.0

    total_invested = sum(t["invested"] for t in trades)
    total_pnl = sum(t["pnl"] for t in trades)
    total_payout = total_invested + total_pnl
    roi = (total_pnl / starting_balance) * 100.0

    sum_wins = sum(t["pnl"] for t in wins)
    sum_losses = sum(abs(t["pnl"]) for t in losses)
    profit_factor = round(sum_wins / sum_losses, 2) if sum_losses > 0 else 99.9

    # Max Drawdown Calculation
    peak = equity_curve[0] if equity_curve else starting_balance
    max_dd = 0.0
    for val in equity_curve:
        if val > peak:
            peak = val
        dd = ((peak - val) / peak) * 100.0 if peak > 0 else 0.0
        if dd > max_dd:
            max_dd = dd

    # Sharpe Ratio Calculation (daily returns)
    daily_returns = []
    for i in range(1, len(equity_curve)):
        prev = equity_curve[i - 1]
        curr = equity_curve[i]
        ret = (curr - prev) / prev if prev > 0 else 0.0
        daily_returns.append(ret)

    if daily_returns and len(daily_returns) > 1:
        mean_ret = sum(daily_returns) / len(daily_returns)
        variance = sum((r - mean_ret) ** 2 for r in daily_returns) / (len(daily_returns) - 1)
        std_ret = math.sqrt(variance)
        # Annualized Sharpe (assuming 252 trading sessions)
        sharpe = round((mean_ret / std_ret) * math.sqrt(252), 2) if std_ret > 0 else 0.0
    else:
        sharpe = 0.0

    # Brier Score Calculation: mean((forecast_prob - actual_binary)^2)
    if brier_pairs:
        brier_sum = sum((f - o) ** 2 for f, o in brier_pairs)
        brier = round(brier_sum / len(brier_pairs), 4)
    else:
        brier = 0.2500

    return BacktestSummary(
        name=name,
        total_days=days,
        total_stations_evaluated=total_stations,
        trades_executed=trades_count,
        trades_won=wins_count,
        trades_lost=losses_count,
        win_rate_pct=round(win_rate, 1),
        total_invested_usd=round(total_invested, 2),
        total_payout_usd=round(total_payout, 2),
        cumulative_pnl_usd=round(total_pnl, 2),
        roi_pct=round(roi, 1),
        max_drawdown_pct=round(max_dd, 1),
        sharpe_ratio=sharpe,
        profit_factor=profit_factor,
        brier_score=brier,
    )
