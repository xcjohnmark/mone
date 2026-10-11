"""
mone.strategy.sizing — Position Sizing and Capital Allocation.
Computes contract allocation given capital constraints and ask prices.
"""

from typing import Tuple


def calculate_position_size(
    capital_per_trade: float, ask_price: float
) -> Tuple[int, float]:
    """
    Computes exact number of contracts to purchase and total invested capital.
    Contracts = floor(capital_per_trade / ask_price).
    Returns (contracts_count, total_invested_dollars).
    """
    if ask_price <= 0.0 or capital_per_trade <= 0.0:
        return 0, 0.0

    contracts = int(capital_per_trade / ask_price)
    if contracts <= 0:
        return 0, 0.0

    invested = round(contracts * ask_price, 2)
    return contracts, invested
