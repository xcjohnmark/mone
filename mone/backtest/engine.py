"""
mone.backtest.engine — Historical Replay Simulator & Multi-Strategy Benchmark.
Replays the agent day-by-day against 30-90 days of weather forecasts, order books,
and NWS airport ground truth resolutions.
"""

import logging
from typing import Dict, List, Optional

from mone.backtest.data_loader import DataLoader, HistoricalDayRecord
from mone.backtest.metrics import BacktestSummary, compute_metrics
from mone.config import MoneConfig, get_config
from mone.strategy.sizing import calculate_position_size

logger = logging.getLogger("mone.backtest.engine")


class BacktestEngine:
    """
    Simulates agent performance against historical ground truth.
    Benchmarks simultaneously against:
    1. mone Agent Strategy (WeatherNext Ensemble + Deterministic Filters)
    2. Market Consensus Baseline (Naive crowd odds)
    3. Random Guess Baseline (50/50 coin toss)
    """

    def __init__(self, config: Optional[MoneConfig] = None, starting_balance: float = 1000.00):
        self.config = config or get_config()
        self.starting_balance = starting_balance
        self.loader = DataLoader()

    def run(self, days: int = 60) -> Dict:
        records: List[HistoricalDayRecord] = self.loader.load_dataset(days=days)
        logger.info(f"Loaded {len(records)} historical station records across {days} days")

        # Sort chronologically
        records.sort(key=lambda r: (r.date, r.station_code))

        # Group by date for daily equity curve tracking
        days_grouped: Dict[str, List[HistoricalDayRecord]] = {}
        for r in records:
            days_grouped.setdefault(r.date, []).append(r)

        # State trackers
        # 1. Agent
        agent_equity = self.starting_balance
        agent_trades: List[Dict] = []
        agent_curve: List[float] = [agent_equity]
        agent_brier_pairs: List[tuple[float, int]] = []

        # 2. Market Consensus
        market_equity = self.starting_balance
        market_trades: List[Dict] = []
        market_curve: List[float] = [market_equity]
        market_brier_pairs: List[tuple[float, int]] = []

        # 3. Random Baseline
        random_equity = self.starting_balance
        random_trades: List[Dict] = []
        random_curve: List[float] = [random_equity]

        capital_per_trade = self.config.capital_per_trade

        for date_str, day_records in sorted(days_grouped.items()):
            for rec in day_records:
                is_actual_rain = (rec.actual_resolution == "YES")
                actual_binary = 1 if is_actual_rain else 0

                # Brier pair for WeatherNext model
                agent_brier_pairs.append((rec.model_rain_prob_pct / 100.0, actual_binary))
                # Brier pair for Market Consensus
                market_brier_pairs.append((rec.market_yes_ask, actual_binary))

                # --- 1. Agent Strategy Evaluation ---
                p = rec.model_rain_prob_pct
                if p > self.config.long_yes_prob_threshold and rec.market_yes_ask < self.config.max_entry_ask_price:
                    # Buy YES
                    contracts, invested = calculate_position_size(capital_per_trade, rec.market_yes_ask)
                    if contracts > 0:
                        won = is_actual_rain
                        payout = contracts * 1.00 if won else 0.0
                        pnl = round(payout - invested, 2)
                        agent_equity += pnl
                        agent_trades.append({
                            "date": date_str,
                            "station": rec.station_code,
                            "city": rec.city,
                            "side": "YES",
                            "entry_price": rec.market_yes_ask,
                            "contracts": contracts,
                            "invested": invested,
                            "payout": payout,
                            "pnl": pnl,
                            "won": won,
                        })
                elif p < self.config.long_no_prob_threshold and rec.market_no_ask < self.config.max_entry_ask_price:
                    # Buy NO
                    contracts, invested = calculate_position_size(capital_per_trade, rec.market_no_ask)
                    if contracts > 0:
                        won = not is_actual_rain
                        payout = contracts * 1.00 if won else 0.0
                        pnl = round(payout - invested, 2)
                        agent_equity += pnl
                        agent_trades.append({
                            "date": date_str,
                            "station": rec.station_code,
                            "city": rec.city,
                            "side": "NO",
                            "entry_price": rec.market_no_ask,
                            "contracts": contracts,
                            "invested": invested,
                            "payout": payout,
                            "pnl": pnl,
                            "won": won,
                        })

                # --- 2. Market Consensus Baseline ---
                # Naively bets on whichever side market prices > 50%
                if rec.market_yes_ask > 0.50:
                    contracts, invested = calculate_position_size(capital_per_trade, rec.market_yes_ask)
                    if contracts > 0:
                        won = is_actual_rain
                        payout = contracts * 1.00 if won else 0.0
                        pnl = round(payout - invested, 2)
                        market_equity += pnl
                        market_trades.append({"pnl": pnl, "invested": invested})
                elif rec.market_no_ask > 0.50:
                    contracts, invested = calculate_position_size(capital_per_trade, rec.market_no_ask)
                    if contracts > 0:
                        won = not is_actual_rain
                        payout = contracts * 1.00 if won else 0.0
                        pnl = round(payout - invested, 2)
                        market_equity += pnl
                        market_trades.append({"pnl": pnl, "invested": invested})

                # --- 3. Random 50/50 Baseline ---
                # Picks random side on 10% of stations
                import hashlib
                rand_seed = int(hashlib.sha1(f"{date_str}_{rec.station_code}".encode()).hexdigest(), 16) % 10
                if rand_seed == 0:
                    pick_yes = (rand_seed % 2 == 0)
                    price = rec.market_yes_ask if pick_yes else rec.market_no_ask
                    contracts, invested = calculate_position_size(capital_per_trade, price)
                    if contracts > 0:
                        won = (is_actual_rain if pick_yes else not is_actual_rain)
                        payout = contracts * 1.00 if won else 0.0
                        pnl = round(payout - invested, 2)
                        random_equity += pnl
                        random_trades.append({"pnl": pnl, "invested": invested})

            agent_curve.append(round(agent_equity, 2))
            market_curve.append(round(market_equity, 2))
            random_curve.append(round(random_equity, 2))

        # Compute benchmark summaries
        agent_summary = compute_metrics(
            name="mone Agent (WeatherNext + Rules)",
            trades=agent_trades,
            equity_curve=agent_curve,
            brier_pairs=agent_brier_pairs,
            starting_balance=self.starting_balance,
            days=days,
            total_stations=len(records),
        )

        market_summary = compute_metrics(
            name="Market Consensus Baseline",
            trades=market_trades,
            equity_curve=market_curve,
            brier_pairs=market_brier_pairs,
            starting_balance=self.starting_balance,
            days=days,
            total_stations=len(records),
        )

        random_summary = compute_metrics(
            name="Random Walk Baseline",
            trades=random_trades,
            equity_curve=random_curve,
            brier_pairs=[],
            starting_balance=self.starting_balance,
            days=days,
            total_stations=len(records),
        )

        return {
            "total_days": days,
            "starting_balance_usd": self.starting_balance,
            "agent": agent_summary.model_dump(),
            "market_consensus": market_summary.model_dump(),
            "random_baseline": random_summary.model_dump(),
            "equity_curve": agent_curve,
            "sample_trades": agent_trades[-15:],  # Last 15 trades
        }


def run_backtest(days: int = 60, starting_balance: float = 1000.0) -> Dict:
    """Convenience helper to run backtest simulation."""
    engine = BacktestEngine(starting_balance=starting_balance)
    return engine.run(days=days)
