"""
mone.risk.circuit_breaker — Rapid Drawdown & Stop-Loss Circuit Breakers.
Re-exports and provides circuit breaker protection to halt executions when drawdown thresholds are reached.
"""

from mone.risk.guardrails import RiskCheckResult, RiskManager

__all__ = ["RiskManager", "RiskCheckResult"]
