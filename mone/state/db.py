"""
mone.state.db — Zero-Config SQLite Persistence Ledger.
Maintains persistent trade log, pending positions, copilot approval queue, and account equity.
"""

import logging
import os
import sqlite3
from datetime import datetime, timezone
from typing import Dict, List, Optional

from mone.state.models import EquitySummary, PositionRecord, SignalRecord
from mone.strategy.rules import TradeSignal

logger = logging.getLogger("mone.state.db")


class Database:
    """
    SQLite-backed transactional store for the mone trading agent.
    """

    def __init__(self, db_path: str = "mone.db"):
        self.db_path = db_path
        self._init_schema()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_schema(self):
        """Initializes tables for positions, signals, equity, and fuel credits."""
        with self._get_connection() as conn:
            cursor = conn.cursor()

            # Account & Equity Ledger
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS account_ledger (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    cash_balance REAL NOT NULL DEFAULT 100.00,
                    cumulative_realized_pnl REAL NOT NULL DEFAULT 0.00,
                    last_updated TEXT NOT NULL
                )
            """)
            cursor.execute("""
                INSERT OR IGNORE INTO account_ledger (id, cash_balance, cumulative_realized_pnl, last_updated)
                VALUES (1, 100.00, 0.00, datetime('now'))
            """)

            # Signals Queue (Copilot Mode staging)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS signals (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    station_code TEXT NOT NULL,
                    city TEXT NOT NULL,
                    target_date TEXT NOT NULL,
                    market_id TEXT NOT NULL,
                    venue TEXT NOT NULL,
                    action TEXT NOT NULL,
                    side TEXT NOT NULL,
                    model_prob_pct REAL NOT NULL,
                    market_ask REAL NOT NULL,
                    edge_pct REAL NOT NULL,
                    contracts INTEGER NOT NULL,
                    capital REAL NOT NULL,
                    reason TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'STAGED',
                    created_at TEXT NOT NULL
                )
            """)

            # Positions & Executed Trades
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS positions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    market_id TEXT NOT NULL,
                    station_code TEXT NOT NULL,
                    city TEXT NOT NULL,
                    target_date TEXT NOT NULL,
                    side TEXT NOT NULL,
                    entry_price REAL NOT NULL,
                    contracts INTEGER NOT NULL,
                    total_invested REAL NOT NULL,
                    potential_payout REAL NOT NULL,
                    status TEXT NOT NULL DEFAULT 'OPEN',
                    resolution TEXT,
                    realized_pnl REAL,
                    created_at TEXT NOT NULL,
                    settled_at TEXT
                )
            """)

            # Dodo Payments Fuel Credit Balances
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS fuel_credits (
                    user_id TEXT PRIMARY KEY,
                    credit_balance_usd REAL NOT NULL DEFAULT 0.00,
                    is_pro_subscriber INTEGER NOT NULL DEFAULT 0,
                    subscription_expires_at TEXT,
                    last_updated TEXT NOT NULL
                )
            """)

            conn.commit()

    # --- Signals Operations ---
    def record_signal(self, sig: TradeSignal, status: str = "STAGED") -> int:
        """Stores a generated trade signal into the signals queue."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO signals (
                    station_code, city, target_date, market_id, venue,
                    action, side, model_prob_pct, market_ask, edge_pct,
                    contracts, capital, reason, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    sig.station_code,
                    sig.city,
                    sig.target_date,
                    sig.market_id,
                    sig.venue,
                    sig.action,
                    sig.side,
                    sig.model_prob_pct,
                    sig.market_ask,
                    sig.edge_pct,
                    sig.contracts_suggested,
                    sig.capital_allocated,
                    sig.reason,
                    status,
                    datetime.now(timezone.utc).isoformat(),
                ),
            )
            conn.commit()
            return cursor.lastrowid

    def get_staged_signals(self) -> List[SignalRecord]:
        """Returns all unconfirmed signals awaiting Copilot approval."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM signals WHERE status = 'STAGED' ORDER BY id DESC")
            rows = cursor.fetchall()
            return [SignalRecord(**dict(r)) for r in rows]

    def update_signal_status(self, signal_id: int, status: str):
        """Updates signal status (e.g. APPROVED, REJECTED, EXECUTED)."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE signals SET status = ? WHERE id = ?", (status, signal_id))
            conn.commit()

    # --- Positions & Execution Operations ---
    def record_position(self, pos: PositionRecord) -> int:
        """Records an executed position and deducts cash balance."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO positions (
                    market_id, station_code, city, target_date, side,
                    entry_price, contracts, total_invested, potential_payout,
                    status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    pos.market_id,
                    pos.station_code,
                    pos.city,
                    pos.target_date,
                    pos.side,
                    pos.entry_price,
                    pos.contracts,
                    pos.total_invested,
                    pos.potential_payout,
                    pos.status,
                    pos.created_at,
                ),
            )
            pos_id = cursor.lastrowid

            # Deduct cash
            cursor.execute(
                "UPDATE account_ledger SET cash_balance = cash_balance - ?, last_updated = datetime('now') WHERE id = 1",
                (pos.total_invested,),
            )
            conn.commit()
            return pos_id

    def get_open_positions(self) -> List[PositionRecord]:
        """Returns all open active positions."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM positions WHERE status = 'OPEN' ORDER BY id DESC")
            rows = cursor.fetchall()
            return [PositionRecord(**dict(r)) for r in rows]

    def get_all_positions(self) -> List[PositionRecord]:
        """Returns all positions (both open and settled)."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM positions ORDER BY id DESC")
            rows = cursor.fetchall()
            return [PositionRecord(**dict(r)) for r in rows]

    def resolve_position(
        self,
        position_id: int,
        actual_resolution: str,
        payout_dollars: float,
        net_pnl: float,
    ):
        """Settles an open position, adding payout to cash balance and updating realized PnL."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                UPDATE positions
                SET status = 'SETTLED',
                    resolution = ?,
                    realized_pnl = ?,
                    settled_at = ?
                WHERE id = ?
                """,
                (
                    actual_resolution,
                    net_pnl,
                    datetime.now(timezone.utc).isoformat(),
                    position_id,
                ),
            )

            # Credit payout to cash & update cumulative PnL
            cursor.execute(
                """
                UPDATE account_ledger
                SET cash_balance = cash_balance + ?,
                    cumulative_realized_pnl = cumulative_realized_pnl + ?,
                    last_updated = datetime('now')
                WHERE id = 1
                """,
                (payout_dollars, net_pnl),
            )
            conn.commit()

    # --- Equity Summary ---
    def get_equity_summary(self) -> EquitySummary:
        """Computes current balance, active investment, and win rate."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT cash_balance, cumulative_realized_pnl FROM account_ledger WHERE id = 1")
            row = cursor.fetchone()
            cash = float(row["cash_balance"]) if row else 100.00
            cum_pnl = float(row["cumulative_realized_pnl"]) if row else 0.00

            cursor.execute("SELECT SUM(total_invested) as invested, COUNT(*) as cnt FROM positions WHERE status = 'OPEN'")
            open_row = cursor.fetchone()
            invested = float(open_row["invested"] or 0.0)
            open_count = int(open_row["cnt"] or 0)

            cursor.execute("SELECT COUNT(*) as settled_cnt, SUM(CASE WHEN realized_pnl > 0 THEN 1 ELSE 0 END) as wins FROM positions WHERE status = 'SETTLED'")
            settled_row = cursor.fetchone()
            settled_cnt = int(settled_row["settled_cnt"] or 0)
            wins = int(settled_row["wins"] or 0)
            win_rate = (wins / settled_cnt) * 100.0 if settled_cnt > 0 else 0.0

            return EquitySummary(
                cash_balance=round(cash, 2),
                invested_capital=round(invested, 2),
                total_equity=round(cash + invested, 2),
                cumulative_realized_pnl=round(cum_pnl, 2),
                open_positions_count=open_count,
                settled_trades_count=settled_cnt,
                win_rate_pct=round(win_rate, 1),
            )
