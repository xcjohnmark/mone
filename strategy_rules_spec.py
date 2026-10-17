"""
strategy_rules_spec.py
=============================================================================
WeatherNext 3 Deterministic Precipitation Strategy Specification (WX3-ALPHA)
=============================================================================

This file contains the complete, standalone mathematical rules, edge calculations,
position sizing logic, and decision engine for trading daily weather prediction
markets (specifically Kalshi KXRAIN precipitation contracts).

Zero external dependencies: uses strictly Python standard library.
Decoupled completely from mone agent execution frameworks, databases, and APIs.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional, Tuple


class ActionType(str, Enum):
    BUY_YES = "BUY_YES"
    BUY_NO = "BUY_NO"
    NO_TRADE = "NO_TRADE"


class TradeSide(str, Enum):
    YES = "YES"
    NO = "NO"
    NONE = "NONE"


@dataclass(frozen=True)
class StrategyConfig:
    """
    Core parameters governing strategy thresholds and risk tolerances.
    """
    # Probability Boundaries
    yes_threshold_prob: float = 0.75   # Minimum model probability to buy YES (75%)
    no_threshold_prob: float = 0.25    # Maximum model probability to buy NO (25% rain = 75% dry)
    min_edge_pct: float = 0.10         # Minimum statistical edge required (10%)
    
    # Pricing Boundaries
    max_entry_ask: float = 0.80        # Maximum price to pay for a contract ($0.80 ceiling)
    min_entry_ask: float = 0.05        # Minimum price to avoid illiquid dead contracts ($0.05 floor)
    
    # Capital & Sizing
    max_trade_capital: float = 10.0    # Hard dollar cap per single market entry ($10.00)
    use_kelly_sizing: bool = False     # Whether to size with fractional Kelly vs fixed cap
    fractional_kelly: float = 0.25     # Kelly fraction (quarter-Kelly prevents volatility drag)
    daily_stop_loss: float = 50.0      # Daily cumulative loss limit before halting all entries


@dataclass
class StrategyDecision:
    """
    Immutable trade decision output for a single market event.
    """
    action: ActionType
    side: TradeSide
    model_prob: float
    market_ask: float
    edge: float
    expected_value_per_contract: float
    expected_roi_pct: float
    contracts_to_buy: int
    capital_to_commit: float
    reason: str
    is_actionable: bool


@dataclass
class TradeOutcome:
    """
    Realized resolution and settlement accounting for an executed trade.
    """
    ticker: str
    side: TradeSide
    entry_price: float
    contracts: int
    total_cost: float
    resolution: str  # "yes" or "no"
    settlement_payout_per_contract: float  # 1.0 or 0.0
    gross_payout: float
    net_pnl: float
    roi_pct: float
    won: bool


# =============================================================================
# Core Strategy Mathematical Functions
# =============================================================================

def compute_edge(model_prob: float, market_ask: float) -> Tuple[float, float, float]:
    """
    Computes mathematical edge, expected value, and expected ROI.
    
    Formula:
      Edge = P(Win) - Market_Ask
      EV = (P(Win) * $1.00) - Market_Ask
      Expected ROI% = (EV / Market_Ask) * 100
      
    Returns:
      (edge, ev_per_contract, expected_roi_pct)
    """
    if market_ask <= 0 or market_ask >= 1.0:
        return 0.0, 0.0, 0.0
        
    ev = model_prob - market_ask
    edge = ev
    roi = (ev / market_ask) * 100.0 if market_ask > 0 else 0.0
    return round(edge, 4), round(ev, 4), round(roi, 2)


def compute_position_size(
    edge: float,
    model_prob: float,
    market_ask: float,
    bankroll: float,
    config: StrategyConfig,
) -> Tuple[int, float]:
    """
    Calculates number of contracts and total dollar commitment.
    
    If use_kelly_sizing is True:
      Kelly Fraction: f* = (p * b - q) / b
      where b = payout odds = (1.0 - ask) / ask
            q = 1.0 - p
      sized = bankroll * (f* * fractional_kelly)
    Otherwise:
      Allocates config.max_trade_capital ($10.00).
    """
    if market_ask <= 0 or market_ask >= 1.0:
        return 0, 0.0
        
    capital_allocation = config.max_trade_capital
    
    if config.use_kelly_sizing and bankroll > 0:
        b = (1.0 - market_ask) / market_ask
        q = 1.0 - model_prob
        kelly_full = (model_prob * b - q) / b if b > 0 else 0.0
        if kelly_full > 0:
            kelly_sized = bankroll * (kelly_full * config.fractional_kelly)
            capital_allocation = min(kelly_sized, config.max_trade_capital)
        else:
            return 0, 0.0
            
    # Number of whole contracts (Kalshi contracts are integer units)
    contracts = int(capital_allocation / market_ask)
    total_committed = round(contracts * market_ask, 2)
    
    return contracts, total_committed


def evaluate_strategy(
    model_rain_prob: float,
    yes_ask: Optional[float],
    yes_bid: Optional[float] = None,
    no_ask: Optional[float] = None,
    bankroll: float = 1000.0,
    config: Optional[StrategyConfig] = None,
) -> StrategyDecision:
    """
    Pure deterministic strategy evaluator.
    
    Decision Flow:
    1. Check YES side:
       If Model Rain Prob >= 0.75:
         Check if YES Ask < 0.80 and Edge >= 0.10.
         If so -> BUY YES.
    2. Check NO side:
       If Model Rain Prob <= 0.25:
         Model Dry Prob = 1.0 - Model Rain Prob (>= 0.75).
         Determine NO Ask = no_ask OR (1.0 - yes_bid).
         Check if NO Ask < 0.80 and Edge >= 0.10.
         If so -> BUY NO.
    3. Neutral Zone:
       If 0.25 < Model Rain Prob < 0.75 -> NO TRADE (Ensemble noise filter).
       If Ask >= 0.80 -> NO TRADE (Unfavorable risk-to-reward skew).
       If Edge < 0.10 -> NO TRADE (Insufficient statistical margin).
    """
    if config is None:
        config = StrategyConfig()
        
    # Ensure inputs are normalized floats [0.0, 1.0]
    p_rain = float(model_rain_prob)
    if p_rain > 1.0:  # Handle percentage format e.g. 78.5%
        p_rain = p_rain / 100.0
    p_rain = max(0.0, min(1.0, p_rain))
    
    # ---------------------------------------------------------
    # 1. EVALUATE LONG YES
    # ---------------------------------------------------------
    if p_rain >= config.yes_threshold_prob:
        if yes_ask is None or yes_ask <= 0:
            return StrategyDecision(
                action=ActionType.NO_TRADE,
                side=TradeSide.NONE,
                model_prob=p_rain,
                market_ask=0.0,
                edge=0.0,
                expected_value_per_contract=0.0,
                expected_roi_pct=0.0,
                contracts_to_buy=0,
                capital_to_commit=0.0,
                reason="Model favors YES (>=75%) but no valid YES ask was quoted",
                is_actionable=False,
            )
            
        if yes_ask > config.max_entry_ask:
            return StrategyDecision(
                action=ActionType.NO_TRADE,
                side=TradeSide.NONE,
                model_prob=p_rain,
                market_ask=yes_ask,
                edge=round(p_rain - yes_ask, 4),
                expected_value_per_contract=round(p_rain - yes_ask, 4),
                expected_roi_pct=round(((p_rain - yes_ask) / yes_ask) * 100, 2),
                contracts_to_buy=0,
                capital_to_commit=0.0,
                reason=f"YES ask ${yes_ask:.2f} exceeds max entry price ceiling ${config.max_entry_ask:.2f}",
                is_actionable=False,
            )
            
        edge, ev, roi = compute_edge(p_rain, yes_ask)
        if edge < config.min_edge_pct:
            return StrategyDecision(
                action=ActionType.NO_TRADE,
                side=TradeSide.NONE,
                model_prob=p_rain,
                market_ask=yes_ask,
                edge=edge,
                expected_value_per_contract=ev,
                expected_roi_pct=roi,
                contracts_to_buy=0,
                capital_to_commit=0.0,
                reason=f"Statistical edge {edge*100:.1f}% below minimum requirement {config.min_edge_pct*100:.1f}%",
                is_actionable=False,
            )
            
        contracts, capital = compute_position_size(edge, p_rain, yes_ask, bankroll, config)
        if contracts <= 0:
            return StrategyDecision(
                action=ActionType.NO_TRADE,
                side=TradeSide.NONE,
                model_prob=p_rain,
                market_ask=yes_ask,
                edge=edge,
                expected_value_per_contract=ev,
                expected_roi_pct=roi,
                contracts_to_buy=0,
                capital_to_commit=0.0,
                reason="Computed contract size is 0 under capital constraints",
                is_actionable=False,
            )
            
        return StrategyDecision(
            action=ActionType.BUY_YES,
            side=TradeSide.YES,
            model_prob=p_rain,
            market_ask=yes_ask,
            edge=edge,
            expected_value_per_contract=ev,
            expected_roi_pct=roi,
            contracts_to_buy=contracts,
            capital_to_commit=capital,
            reason=f"High rain confidence ({p_rain*100:.1f}% >= 75%) with {edge*100:.1f}% edge at ${yes_ask:.2f}",
            is_actionable=True,
        )

    # ---------------------------------------------------------
    # 2. EVALUATE LONG NO
    # ---------------------------------------------------------
    p_dry = 1.0 - p_rain
    if p_rain <= config.no_threshold_prob:  # i.e. p_dry >= 0.75
        effective_no_ask = no_ask
        if effective_no_ask is None or effective_no_ask <= 0:
            if yes_bid is not None and yes_bid > 0:
                effective_no_ask = round(1.0 - yes_bid, 4)
                
        if effective_no_ask is None or effective_no_ask <= 0:
            return StrategyDecision(
                action=ActionType.NO_TRADE,
                side=TradeSide.NONE,
                model_prob=p_rain,
                market_ask=0.0,
                edge=0.0,
                expected_value_per_contract=0.0,
                expected_roi_pct=0.0,
                contracts_to_buy=0,
                capital_to_commit=0.0,
                reason="Model favors NO (rain <=25%) but no valid NO ask was available",
                is_actionable=False,
            )
            
        if effective_no_ask > config.max_entry_ask:
            return StrategyDecision(
                action=ActionType.NO_TRADE,
                side=TradeSide.NONE,
                model_prob=p_rain,
                market_ask=effective_no_ask,
                edge=round(p_dry - effective_no_ask, 4),
                expected_value_per_contract=round(p_dry - effective_no_ask, 4),
                expected_roi_pct=round(((p_dry - effective_no_ask) / effective_no_ask) * 100, 2),
                contracts_to_buy=0,
                capital_to_commit=0.0,
                reason=f"NO ask ${effective_no_ask:.2f} exceeds max entry price ceiling ${config.max_entry_ask:.2f}",
                is_actionable=False,
            )
            
        edge, ev, roi = compute_edge(p_dry, effective_no_ask)
        if edge < config.min_edge_pct:
            return StrategyDecision(
                action=ActionType.NO_TRADE,
                side=TradeSide.NONE,
                model_prob=p_rain,
                market_ask=effective_no_ask,
                edge=edge,
                expected_value_per_contract=ev,
                expected_roi_pct=roi,
                contracts_to_buy=0,
                capital_to_commit=0.0,
                reason=f"Statistical edge {edge*100:.1f}% below minimum requirement {config.min_edge_pct*100:.1f}%",
                is_actionable=False,
            )
            
        contracts, capital = compute_position_size(edge, p_dry, effective_no_ask, bankroll, config)
        if contracts <= 0:
            return StrategyDecision(
                action=ActionType.NO_TRADE,
                side=TradeSide.NONE,
                model_prob=p_rain,
                market_ask=effective_no_ask,
                edge=edge,
                expected_value_per_contract=ev,
                expected_roi_pct=roi,
                contracts_to_buy=0,
                capital_to_commit=0.0,
                reason="Computed contract size is 0 under capital constraints",
                is_actionable=False,
            )
            
        return StrategyDecision(
            action=ActionType.BUY_NO,
            side=TradeSide.NO,
            model_prob=p_rain,
            market_ask=effective_no_ask,
            edge=edge,
            expected_value_per_contract=ev,
            expected_roi_pct=roi,
            contracts_to_buy=contracts,
            capital_to_commit=capital,
            reason=f"High dry confidence ({p_dry*100:.1f}% >= 75%) with {edge*100:.1f}% edge at ${effective_no_ask:.2f}",
            is_actionable=True,
        )

    # ---------------------------------------------------------
    # 3. NEUTRAL DEAD ZONE (25% < P < 75%)
    # ---------------------------------------------------------
    return StrategyDecision(
        action=ActionType.NO_TRADE,
        side=TradeSide.NONE,
        model_prob=p_rain,
        market_ask=yes_ask or 0.0,
        edge=0.0,
        expected_value_per_contract=0.0,
        expected_roi_pct=0.0,
        contracts_to_buy=0,
        capital_to_commit=0.0,
        reason=f"Model in neutral uncertainty zone ({p_rain*100:.1f}% rain) between 25% and 75%",
        is_actionable=False,
    )


def settle_trade(
    ticker: str,
    decision: StrategyDecision,
    market_result: str,
) -> TradeOutcome:
    """
    Computes exact PnL and return for an executed decision given official market settlement.
    
    market_result: "yes" or "no"
    """
    res = market_result.strip().lower()
    won = False
    
    if decision.side == TradeSide.YES and res == "yes":
        won = True
    elif decision.side == TradeSide.NO and res == "no":
        won = True
        
    payout_per_contract = 1.0 if won else 0.0
    gross_payout = round(decision.contracts_to_buy * payout_per_contract, 2)
    net_pnl = round(gross_payout - decision.capital_to_commit, 2)
    roi = round((net_pnl / decision.capital_to_commit) * 100.0, 2) if decision.capital_to_commit > 0 else 0.0
    
    return TradeOutcome(
        ticker=ticker,
        side=decision.side,
        entry_price=decision.market_ask,
        contracts=decision.contracts_to_buy,
        total_cost=decision.capital_to_commit,
        resolution=res,
        settlement_payout_per_contract=payout_per_contract,
        gross_payout=gross_payout,
        net_pnl=net_pnl,
        roi_pct=roi,
        won=won,
    )
