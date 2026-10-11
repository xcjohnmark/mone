"""
mone.risk.guardrails — Risk Management Engine and Circuit Breakers.
Enforces hard maximum daily drawdown limits, single-position caps, and market safety bounds.
"""

import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional
from pydantic import BaseModel, Field

from mone.config import MoneConfig
from mone.strategy.rules import TradeSignal

logger = logging.getLogger("mone.risk.guardrails")


class RiskCheckResult(BaseModel):
    allowed: bool
    reason: str
    daily_drawdown_current: float
    daily_drawdown_limit: float
    circuit_breaker_tripped: bool


class RiskManager:
    """
    Evaluates proposed trades against active portfolio risk limits.
    Prevents account blowups by enforcing daily stop-losses and position caps.
    """

    def __init__(self, config: Optional[MoneConfig] = None):
        if config is None:
            from mone.config import get_config
            config = get_config()
        self.config = config
        self.max_daily_drawdown = config.max_daily_drawdown
        self.capital_per_trade = config.capital_per_trade

        # State tracking for the current session/day
        self.current_day_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        self.daily_realized_loss = 0.0  # Positive number representing cumulative losses
        self.circuit_breaker_tripped = False

    def reset_daily_metrics_if_new_day(self):
        """Resets daily loss counter at 00:00 UTC."""
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        if today != self.current_day_str:
            logger.info(f"Resetting daily risk limits for new calendar day {today}")
            self.current_day_str = today
            self.daily_realized_loss = 0.0
            self.circuit_breaker_tripped = False

    def record_loss(self, loss_amount: float):
        """Records a realized loss and checks if circuit breaker should trip."""
        self.reset_daily_metrics_if_new_day()
        if loss_amount > 0:
            self.daily_realized_loss += loss_amount
            logger.warning(
                f"Recorded loss: ${loss_amount:.2f}. Cumulative daily loss: ${self.daily_realized_loss:.2f} / ${self.max_daily_drawdown:.2f}"
            )
            if self.daily_realized_loss >= self.max_daily_drawdown:
                self.circuit_breaker_tripped = True
                logger.error(
                    f"CIRCUIT BREAKER TRIPPED! Daily loss ${self.daily_realized_loss:.2f} exceeded limit ${self.max_daily_drawdown:.2f}. Halting trading."
                )

    def validate_signal_risk(
        self,
        signal: TradeSignal,
        current_cash_balance: float,
        open_positions_count: int = 0,
    ) -> RiskCheckResult:
        """
        Validates if a signal can be safely executed under current risk guardrails.
        """
        self.reset_daily_metrics_if_new_day()

        # Check 1: Circuit breaker status
        if self.circuit_breaker_tripped or self.daily_realized_loss >= self.max_daily_drawdown:
            return RiskCheckResult(
                allowed=False,
                reason=f"Circuit Breaker Tripped: Daily loss ${self.daily_realized_loss:.2f} exceeds limit ${self.max_daily_drawdown:.2f}",
                daily_drawdown_current=self.daily_realized_loss,
                daily_drawdown_limit=self.max_daily_drawdown,
                circuit_breaker_tripped=True,
            )

        # Check 2: Signal actionability
        if not signal.is_actionable:
            return RiskCheckResult(
                allowed=False,
                reason=f"Signal is not actionable: {signal.reason}",
                daily_drawdown_current=self.daily_realized_loss,
                daily_drawdown_limit=self.max_daily_drawdown,
                circuit_breaker_tripped=False,
            )

        # Check 3: Available cash balance
        if current_cash_balance < signal.capital_allocated:
            return RiskCheckResult(
                allowed=False,
                reason=f"Insufficient balance (${current_cash_balance:.2f} available < ${signal.capital_allocated:.2f} required)",
                daily_drawdown_current=self.daily_realized_loss,
                daily_drawdown_limit=self.max_daily_drawdown,
                circuit_breaker_tripped=False,
            )

        # Check 4: Capital per trade cap
        if signal.capital_allocated > (self.capital_per_trade * 1.05):  # allow 5% rounding leeway
            return RiskCheckResult(
                allowed=False,
                reason=f"Trade capital ${signal.capital_allocated:.2f} exceeds max allocation ${self.capital_per_trade:.2f}",
                daily_drawdown_current=self.daily_realized_loss,
                daily_drawdown_limit=self.max_daily_drawdown,
                circuit_breaker_tripped=False,
            )

        # All checks passed
        return RiskCheckResult(
            allowed=True,
            reason="Risk checks passed",
            daily_drawdown_current=self.daily_realized_loss,
            daily_drawdown_limit=self.max_daily_drawdown,
            circuit_breaker_tripped=False,
        )
