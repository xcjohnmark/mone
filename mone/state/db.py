"""
mone.state.db — Zero-Config SQLite Persistence Ledger.
Maintains persistent trade log, pending positions, copilot approval queue, and account equity.
"""

import logging
import os
import sqlite3
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

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

            # Native USDC Crypto Payments Ledger (Replay Protection & Audit)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS crypto_payments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    tx_hash TEXT UNIQUE NOT NULL,
                    network TEXT NOT NULL,
                    plan_key TEXT NOT NULL,
                    amount_usdc REAL NOT NULL,
                    runs_granted INTEGER NOT NULL,
                    days_granted INTEGER,
                    status TEXT NOT NULL,
                    note TEXT,
                    recipient TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
            """)

            # User Fuel Credit Balances & Subscriptions
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS fuel_credits (
                    user_id TEXT PRIMARY KEY,
                    credit_balance_usd REAL NOT NULL DEFAULT 0.00,
                    is_pro_subscriber INTEGER NOT NULL DEFAULT 0,
                    subscription_expires_at TEXT,
                    last_updated TEXT NOT NULL
                )
            """)

            # Anti-Abuse Sybil Protection: Consumed Free Trials Ledger (Cryptographic Tombstones)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS consumed_trials (
                    google_sub_hash TEXT PRIMARY KEY,
                    first_granted_at TEXT NOT NULL,
                    trial_expires_at TEXT NOT NULL,
                    runs_used INTEGER NOT NULL DEFAULT 0,
                    runs_allowed INTEGER NOT NULL DEFAULT 50,
                    device_hash TEXT,
                    is_revoked INTEGER NOT NULL DEFAULT 0
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
        """Updates signal status (e.g. APPROVED, REJECTED, EXECUTED, EXPIRED)."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE signals SET status = ? WHERE id = ?", (status, signal_id))
            conn.commit()

    def expire_stale_signals(self, today_str: str) -> int:
        """
        Marks any unapproved staged signals whose target_date is in the past as EXPIRED.
        Protects traders who reopen their laptop days later from executing outdated opportunities.
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE signals SET status = 'EXPIRED' WHERE status = 'STAGED' AND target_date < ?",
                (today_str,),
            )
            count = cursor.rowcount
            conn.commit()
            return count

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

    # --- Crypto Payment Operations ---
    def record_crypto_payment(
        self,
        tx_hash: str,
        network: str,
        plan_key: str,
        amount_usdc: float,
        runs_granted: int,
        days_granted: Optional[int],
        status: str,
        note: Optional[str],
        recipient: str,
    ) -> int:
        """Stores a confirmed USDC crypto payment into the persistent database ledger."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT OR REPLACE INTO crypto_payments (
                    tx_hash, network, plan_key, amount_usdc,
                    runs_granted, days_granted, status, note, recipient, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    tx_hash.strip().lower(),
                    network.lower(),
                    plan_key,
                    amount_usdc,
                    runs_granted,
                    days_granted,
                    status,
                    note,
                    recipient,
                    datetime.now(timezone.utc).isoformat(),
                ),
            )
            conn.commit()
            return cursor.lastrowid

    def is_tx_already_recorded(self, tx_hash: str) -> bool:
        """Checks if a transaction hash has already been credited (persistent replay protection)."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT id FROM crypto_payments WHERE tx_hash = ?",
                (tx_hash.strip().lower(),),
            )
            return cursor.fetchone() is not None

    def get_all_crypto_payments(self) -> List[dict]:
        """Retrieves audit trail of all confirmed crypto transactions."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM crypto_payments ORDER BY id DESC")
            return [dict(row) for row in cursor.fetchall()]

    # --- Anti-Abuse Sybil Trial Management ---
    def check_or_grant_trial(
        self,
        google_sub: str,
        device_hash: Optional[str] = None,
        default_runs: int = 50,
        trial_days: int = 7,
    ) -> Dict[str, Any]:
        """
        Anti-Abuse Sybil Verification:
        Ensures a single Google account (keyed by SHA-256 hash of permanent Google 'sub')
        can only ever claim one 7-day free trial.
        Even if user deletes their profile or attempts to re-register, the cryptographic
        tombstone record persists and denies renewal or restores existing remaining time/runs.
        """
        import hashlib

        sub_hash = hashlib.sha256(google_sub.strip().encode("utf-8")).hexdigest()
        now = datetime.now(timezone.utc)

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM consumed_trials WHERE google_sub_hash = ?",
                (sub_hash,),
            )
            row = cursor.fetchone()

            if row:
                trial_data = dict(row)
                exp_dt = datetime.fromisoformat(trial_data["trial_expires_at"])
                runs_used = trial_data["runs_used"]
                runs_allowed = trial_data["runs_allowed"]
                runs_left = max(0, runs_allowed - runs_used)
                days_left = max(0, (exp_dt - now).days) if exp_dt > now else 0

                is_active = (exp_dt > now) and (runs_left > 0) and not trial_data["is_revoked"]

                return {
                    "is_new_trial": False,
                    "is_trial_active": is_active,
                    "trial_days_remaining": days_left if is_active else 0,
                    "runs_remaining": runs_left if is_active else 0,
                    "plan": "7-Day Free Trial" if is_active else "Expired Free Trial",
                    "reason": "Existing trial record restored" if is_active else "Free trial previously consumed and expired",
                    "first_granted_at": trial_data["first_granted_at"],
                }

            # Device-level duplicate check (max 2 trials per device footprint)
            if device_hash:
                cursor.execute(
                    "SELECT COUNT(*) as cnt FROM consumed_trials WHERE device_hash = ?",
                    (device_hash.strip(),),
                )
                dev_count = cursor.fetchone()["cnt"]
                if dev_count >= 2:
                    return {
                        "is_new_trial": False,
                        "is_trial_active": False,
                        "trial_days_remaining": 0,
                        "runs_remaining": 0,
                        "plan": "Expired Free Trial",
                        "reason": "Device trial allocation limit reached. Please purchase a Starter Pass or Pro tier.",
                    }

            # Legitimate new trial grant
            expires_at = (now + timedelta(days=trial_days)).isoformat()
            cursor.execute(
                """
                INSERT INTO consumed_trials (
                    google_sub_hash, first_granted_at, trial_expires_at,
                    runs_used, runs_allowed, device_hash, is_revoked
                ) VALUES (?, ?, ?, 0, ?, ?, 0)
                """,
                (
                    sub_hash,
                    now.isoformat(),
                    expires_at,
                    default_runs,
                    device_hash.strip() if device_hash else None,
                ),
            )
            conn.commit()

            return {
                "is_new_trial": True,
                "is_trial_active": True,
                "trial_days_remaining": trial_days,
                "runs_remaining": default_runs,
                "plan": "7-Day Free Trial",
                "reason": "New 7-Day Free Trial granted",
                "first_granted_at": now.isoformat(),
            }

    def record_trial_run_used(self, google_sub: str) -> int:
        """Increments the consumed runs counter for a trial user and returns remaining runs."""
        import hashlib
        sub_hash = hashlib.sha256(google_sub.strip().encode("utf-8")).hexdigest()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE consumed_trials SET runs_used = runs_used + 1 WHERE google_sub_hash = ?",
                (sub_hash,),
            )
            conn.commit()
            cursor.execute(
                "SELECT runs_allowed - runs_used AS runs_left FROM consumed_trials WHERE google_sub_hash = ?",
                (sub_hash,),
            )
            res = cursor.fetchone()
            return max(0, res["runs_left"]) if res else 0

    def delete_user_account(self, user_id: str, google_sub: Optional[str] = None) -> bool:
        """
        Compliant account deletion:
        Removes user profile and session data from active tables, but PRESERVES the
        cryptographic tombstone in 'consumed_trials' so the trial cannot be reclaimed.
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM fuel_credits WHERE user_id = ?", (user_id,))
            conn.commit()
            logger.info(
                f"Account deleted for {user_id}. Consumed trial tombstone preserved in immutable ledger."
            )
            return True
