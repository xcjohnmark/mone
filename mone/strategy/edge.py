"""
mone.strategy.edge — Quantitative Edge and Expected Value Computation.
Calculates statistical edge between Google WeatherNext ensemble forecasts and market implied odds.
"""

from dataclasses import dataclass


@dataclass
class EdgeAnalysis:
    side: str  # "YES", "NO", or "NONE"
    model_prob: float  # 0.0 to 1.0
    market_ask: float  # 0.01 to 0.99
    market_implied_prob: float  # 0.0 to 1.0
    edge: float  # Model Prob - Market Implied Prob / Ask
    expected_value_per_share: float  # Expected payout ($1 * p) - ask
    expected_roi_pct: float  # (EV / Ask) * 100


def calculate_edge(model_prob_pct: float, yes_ask: float, no_ask: float) -> EdgeAnalysis:
    """
    Computes mathematical edge for both YES and NO sides of a precipitation contract.
    Returns the dominant opportunity or NONE if no edge exists.
    """
    p = model_prob_pct / 100.0

    # Calculate YES metrics
    if yes_ask > 0:
        ev_yes = p - yes_ask
        edge_yes = p - yes_ask
        roi_yes = (ev_yes / yes_ask) * 100.0 if yes_ask > 0 else 0.0
    else:
        ev_yes = -1.0
        edge_yes = -1.0
        roi_yes = 0.0

    # Calculate NO metrics
    q = 1.0 - p
    if no_ask > 0:
        ev_no = q - no_ask
        edge_no = q - no_ask
        roi_no = (ev_no / no_ask) * 100.0 if no_ask > 0 else 0.0
    else:
        ev_no = -1.0
        edge_no = -1.0
        roi_no = 0.0

    if edge_yes > edge_no and edge_yes > 0:
        return EdgeAnalysis(
            side="YES",
            model_prob=p,
            market_ask=yes_ask,
            market_implied_prob=yes_ask,
            edge=round(edge_yes, 4),
            expected_value_per_share=round(ev_yes, 4),
            expected_roi_pct=round(roi_yes, 2),
        )
    elif edge_no > 0:
        return EdgeAnalysis(
            side="NO",
            model_prob=q,
            market_ask=no_ask,
            market_implied_prob=no_ask,
            edge=round(edge_no, 4),
            expected_value_per_share=round(ev_no, 4),
            expected_roi_pct=round(roi_no, 2),
        )
    else:
        return EdgeAnalysis(
            side="NONE",
            model_prob=p,
            market_ask=max(yes_ask, no_ask),
            market_implied_prob=0.50,
            edge=0.0,
            expected_value_per_share=0.0,
            expected_roi_pct=0.0,
        )
