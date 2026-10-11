"""
mone.cli — Command-Line Interface for the mone trading agent.
Provides CLI controls for running agent cycles, reviewing copilot queues, inspecting equity, and running backtests.
"""

import argparse
import json
import logging
import sys
import time
from typing import Optional

from mone.agent import MoneAgent
from mone.config import AutonomyMode, MarketVenueType, WeatherProviderType, get_config
from mone.state import Database

# Configure clean CLI logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("mone.cli")


def print_banner():
    banner = r"""
  __  __  ___  _  _ _____ 
 |  \/  |/ _ \| \| | ____|
 | |\/| | | | | .` |  _|  
 | |  | | |_| | |\ | |___ 
 |_|  |_|\___/|_|\_|_____|
 Google WeatherNext Autonomous Trading Agent (neatHack)
 Non-Custodial BYOK Prediction Market Runner
    """
    print(banner)


def cmd_run(args):
    """Executes trading cycles."""
    print_banner()
    config = get_config(
        weather_provider=args.provider or None,
        default_venue=args.venue or None,
        agent_autonomy_mode=args.mode or None,
    )

    agent = MoneAgent(config=config)
    print(f"[*] Initialized mone-agent in {config.agent_autonomy_mode.value.upper()} mode")
    print(f"[*] Weather Provider: {agent.weather.provider_id}")
    print(f"[*] Execution Venue: {agent.market.venue_id}")

    if args.loop:
        interval = args.interval or config.execution_interval_minutes * 60
        print(f"[*] Starting recurring loop every {interval} seconds... (Press Ctrl+C to stop)")
        try:
            while True:
                res = agent.step(target_date=args.date)
                print_cycle_summary(res)
                time.sleep(interval)
        except KeyboardInterrupt:
            print("\n[*] Gracefully stopping agent runner.")
    else:
        res = agent.step(target_date=args.date)
        print_cycle_summary(res)


def print_cycle_summary(res: dict):
    print("\n" + "=" * 65)
    print(f"  CYCLE SUMMARY — Target Date: {res['target_date']}")
    print("=" * 65)
    print(f"  Stations Analyzed : {res['total_stations_evaluated']}")
    print(f"  Actionable Signals: {res['actionable_signals_count']}")
    print(f"  Execution Mode    : {res['mode'].upper()}")
    print(f"  Orders Executed   : {res['executed_count']}")
    print(f"  Signals Staged    : {res['staged_count']} (Copilot Queue)")

    eq = res.get("equity", {})
    print("-" * 65)
    print(f"  Cash Balance      : ${eq.get('cash_balance', 0.0):.2f}")
    print(f"  Invested Capital  : ${eq.get('invested_capital', 0.0):.2f}")
    print(f"  Total Account Eq  : ${eq.get('total_equity', 0.0):.2f}")
    print(f"  Cumulative PnL    : ${eq.get('cumulative_realized_pnl', 0.0):+.2f}")
    print(f"  Win Rate          : {eq.get('win_rate_pct', 0.0):.1f}%")
    print("=" * 65 + "\n")


def cmd_status(args):
    """Prints current account balance, open positions, and pending copilot signals."""
    print_banner()
    config = get_config()
    db = Database(db_path=config.database_url.replace("sqlite:///", ""))
    eq = db.get_equity_summary()

    print("=" * 65)
    print("  PORTFOLIO STATUS & LEDGER")
    print("=" * 65)
    print(f"  Cash Balance          : ${eq.cash_balance:.2f}")
    print(f"  Capital in Open Trades: ${eq.invested_capital:.2f}")
    print(f"  Total Account Equity  : ${eq.total_equity:.2f}")
    print(f"  Cumulative Realized   : ${eq.cumulative_realized_pnl:+.2f}")
    print(f"  Settled Trades        : {eq.settled_trades_count} (Win Rate: {eq.win_rate_pct:.1f}%)")
    print("-" * 65)

    open_pos = db.get_open_positions()
    print(f"\n  OPEN POSITIONS ({len(open_pos)}):")
    if not open_pos:
        print("    None active.")
    for p in open_pos:
        print(f"    - [{p.side}] {p.city} ({p.market_id}) x{p.contracts} @ ${p.entry_price:.2f} (Inv: ${p.total_invested:.2f})")

    staged = db.get_staged_signals()
    print(f"\n  COPILOT STAGED SIGNALS ({len(staged)}):")
    if not staged:
        print("    None awaiting approval.")
    for s in staged:
        print(f"    - [ID: {s.id}] {s.action} {s.city} (Prob: {s.model_prob_pct:.1f}%, Ask: ${s.market_ask:.2f}, Edge: +{s.edge_pct:.1f}%)")
        print(f"      Reason: {s.reason}")
        print(f"      To approve run: mone approve {s.id}")
    print("=" * 65 + "\n")


def cmd_approve(args):
    """Approves and executes a staged copilot trade signal."""
    config = get_config()
    agent = MoneAgent(config=config)
    print(f"[*] Approving and executing staged signal #{args.signal_id}...")
    pos = agent.approve_copilot_signal(args.signal_id)
    if pos:
        print(f"[+] Successfully executed trade: {pos.side} {pos.city} ({pos.market_id}) x{pos.contracts} @ ${pos.entry_price:.2f}!")
    else:
        print(f"[-] Failed to execute signal #{args.signal_id}. Check status and logs.")


def cmd_doctor(args):
    """Diagnoses connectivity to weather providers, market venues, and Neatlogs."""
    print_banner()
    print("[*] Running system diagnostics...")
    config = get_config()

    # 1. Neatlogs check
    print(f"\n[1] Observability (Neatlogs):")
    if config.has_neatlogs():
        print(f"    [OK] Neatlogs API key configured: {config.neatlogs_api_key[:6]}...")
    else:
        print(f"    [INFO] Neatlogs key not set. Using local span recorder.")

    # 2. Weather Provider check
    print(f"\n[2] Weather Provider Engine:")
    try:
        from mone.providers import get_weather_provider
        prov = get_weather_provider(config)
        print(f"    [OK] Weather provider resolved: {prov.provider_id}")
    except Exception as e:
        print(f"    [ERROR] Failed to initialize weather provider: {e}")

    # 3. Market Venue check
    print(f"\n[3] Market Venue Connector:")
    try:
        from mone.markets import get_market_client
        mkt = get_market_client(config)
        print(f"    [OK] Market connector active: {mkt.venue_id} (Available Bal: ${mkt.get_balance():.2f})")
    except Exception as e:
        print(f"    [ERROR] Failed to initialize market client: {e}")

    # 4. Database check
    print(f"\n[4] SQLite State Ledger:")
    try:
        db = Database(db_path=config.database_url.replace("sqlite:///", ""))
        eq = db.get_equity_summary()
        print(f"    [OK] Database initialized successfully. Current cash: ${eq.cash_balance:.2f}")
    except Exception as e:
        print(f"    [ERROR] Database initialization failed: {e}")

    print("\n[+] Diagnostics complete.\n")


def cmd_backtest(args):
    """Runs historical replay backtest."""
    print_banner()
    days = args.days or 60
    print(f"[*] Initializing historical replay backtest across {days} days...")
    try:
        from mone.backtest import run_backtest, export_backtest_report, print_terminal_summary
        results = run_backtest(days=days)
        export_backtest_report(results, output_json="backtest_results.json", output_md="BACKTEST_AUDIT.md")
        print_terminal_summary(results)
        print("[+] Generated audit artifacts:")
        print("    - backtest_results.json (raw simulation metrics)")
        print("    - BACKTEST_AUDIT.md (comprehensive benchmark report)")
    except Exception as e:
        logger.error(f"Backtest failed: {e}", exc_info=True)


def main():
    parser = argparse.ArgumentParser(
        prog="mone",
        description="mone — Autonomous Weather Prediction Market Trading Agent",
    )
    subparsers = parser.add_subparsers(dest="command")

    # Command: run
    p_run = subparsers.add_parser("run", help="Run agent trading cycle(s)")
    p_run.add_argument("--date", type=str, help="Target date YYYY-MM-DD (defaults to today/tomorrow)")
    p_run.add_argument("--mode", choices=["autonomous", "copilot"], help="Execution autonomy mode")
    p_run.add_argument("--venue", choices=["paper", "kalshi_demo", "kalshi_live", "polymarket"], help="Trading venue")
    p_run.add_argument("--provider", choices=["auto", "openmeteo", "weathernext3"], help="Weather provider")
    p_run.add_argument("--loop", action="store_true", help="Run continuously in a loop")
    p_run.add_argument("--interval", type=int, help="Loop interval in seconds (default 3600)")

    # Command: status
    subparsers.add_parser("status", help="View account equity, active positions, and copilot signals")

    # Command: approve
    p_app = subparsers.add_parser("approve", help="Approve a staged Copilot signal")
    p_app.add_argument("signal_id", type=int, help="ID of the staged signal to approve")

    # Command: doctor
    subparsers.add_parser("doctor", help="Check system connections and configuration")

    # Command: backtest
    p_bt = subparsers.add_parser("backtest", help="Run historical replay backtesting")
    p_bt.add_argument("--days", type=int, default=60, help="Number of historical days to simulate")

    args = parser.parse_args()

    if args.command == "run":
        cmd_run(args)
    elif args.command == "status":
        cmd_status(args)
    elif args.command == "approve":
        cmd_approve(args)
    elif args.command == "doctor":
        cmd_doctor(args)
    elif args.command == "backtest":
        cmd_backtest(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
