"""
mone.cli — Command-Line Interface for the mone trading agent.
Provides CLI controls for running agent cycles, trading signals, inspecting portfolio balance,
configuring risk boundaries, viewing weather forecasts, and running backtests.
"""

import argparse
import json
import logging
import os
import sys
import time
from datetime import datetime, timezone, timedelta
from typing import Optional

from mone.agent import MoneAgent
from mone.billing.crypto import DESTINATION_WALLETS
from mone.config import AutonomyMode, MarketVenueType, WeatherProviderType, get_config
from mone.entitlements import EntitlementRequiredError, get_entitlement_manager
from mone.markets import NWS_STATIONS, resolve_station
from mone.state import Database
from mone.telemetry import flush_telemetry

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
        print(f"      To execute run: mone trade {s.id}")
    print("=" * 65 + "\n")


def cmd_balance(args):
    """Inspects account cash balance, available margin, equity, and circuit breaker status."""
    print_banner()
    config = get_config()
    db = Database(db_path=config.database_url.replace("sqlite:///", ""))
    eq = db.get_equity_summary()

    daily_drawdown_limit = config.max_daily_drawdown
    cum_loss = abs(min(0.0, eq.cumulative_realized_pnl))
    remaining_drawdown = max(0.0, daily_drawdown_limit - cum_loss)

    print("=" * 65)
    print("  ACCOUNT BALANCE & MARGIN SUMMARY")
    print("=" * 65)
    print(f"  Active Venue           : {config.default_venue.value.upper()}")
    print(f"  Cash Balance           : ${eq.cash_balance:.2f}")
    print(f"  Invested Collateral    : ${eq.invested_capital:.2f}")
    print(f"  Total Account Equity   : ${eq.total_equity:.2f}")
    print(f"  Cumulative Realized PnL: ${eq.cumulative_realized_pnl:+.2f}")
    print(f"  Open Trades Count      : {eq.open_positions_count}")
    print(f"  Settled Trades Count   : {eq.settled_trades_count} (Win Rate: {eq.win_rate_pct:.1f}%)")
    print("-" * 65)
    print("  RISK & CIRCUIT BREAKER STATUS:")
    print(f"  Daily Drawdown Cap     : ${daily_drawdown_limit:.2f}")
    print(f"  Drawdown Buffer Left   : ${remaining_drawdown:.2f} (Status: {'HEALTHY' if remaining_drawdown > 0 else 'CIRCUIT BREAKER HALTED'})")
    print(f"  Capital Per Trade      : ${config.capital_per_trade:.2f}")
    print(f"  Min Edge Required      : {config.min_edge_threshold * 100:.1f}%")
    print("=" * 65 + "\n")


def cmd_trade(args):
    """Executes a trade on a staged signal or directly on a weather market."""
    print_banner()
    config = get_config(
        default_venue=args.venue or None,
    )
    agent = MoneAgent(config=config)
    print(f"[*] Placing trade for '{args.identifier}' on {agent.market.venue_id}...")
    if args.side:
        print(f"    Side Override    : {args.side.upper()}")
    if args.capital:
        print(f"    Capital Override : ${args.capital:.2f}")
    if args.contracts:
        print(f"    Contracts Override: {args.contracts}")

    pos = agent.execute_custom_trade(
        identifier=args.identifier,
        side=args.side,
        capital=args.capital,
        contracts=args.contracts,
    )

    if pos:
        print("\n" + "=" * 65)
        print("  TRADE EXECUTED SUCCESSFULLY")
        print("=" * 65)
        print(f"  Position ID      : #{pos.id}")
        print(f"  Market Ticker    : {pos.market_id}")
        print(f"  Station / City   : {pos.station_code} ({pos.city})")
        print(f"  Side             : {pos.side}")
        print(f"  Filled Contracts : {pos.contracts}")
        print(f"  Fill Price       : ${pos.entry_price:.2f}")
        print(f"  Total Invested   : ${pos.total_invested:.2f}")
        print(f"  Potential Payout : ${pos.potential_payout:.2f}")
        print(f"  Status           : {pos.status}")

        eq = agent.db.get_equity_summary()
        print("-" * 65)
        print(f"  Remaining Cash   : ${eq.cash_balance:.2f}")
        print(f"  Total Equity     : ${eq.total_equity:.2f}")
        print("=" * 65 + "\n")
    else:
        print(f"\n[-] Trade execution could not be completed for '{args.identifier}'.")
        print("    Check 'mone doctor', risk limits, or 'mone signals' to see available opportunities.\n")


def cmd_signals(args):
    """Lists pending staged trade signals from the Copilot queue."""
    print_banner()
    config = get_config()
    db = Database(db_path=config.database_url.replace("sqlite:///", ""))
    staged = db.get_staged_signals()

    print("=" * 82)
    print("  COPILOT STAGED SIGNALS QUEUE")
    print("=" * 82)
    if not staged:
        print("  No staged signals in queue.")
        print("  Run 'mone run --mode copilot' to ingest weather forecasts and scan markets.")
    else:
        print(f"  {'ID':<5} {'ACTION':<10} {'CITY':<16} {'MODEL %':<10} {'ASK':<8} {'EDGE':<8} {'CAPITAL':<10} {'EXECUTE COMMAND'}")
        print("-" * 82)
        for s in staged:
            edge_str = f"+{s.edge_pct:.1f}%" if s.edge_pct > 0 else f"{s.edge_pct:.1f}%"
            print(f"  #{s.id:<4} {s.action:<10} {s.city:<16} {s.model_prob_pct:<9.1f}% ${s.market_ask:<7.2f} {edge_str:<8} ${s.capital:<9.2f} mone trade {s.id}")
            print(f"        Market: {s.market_id} | Driver: {s.reason}")
    print("=" * 82 + "\n")


def cmd_positions(args):
    """Lists open and historical positions from the SQLite ledger."""
    print_banner()
    config = get_config()
    db = Database(db_path=config.database_url.replace("sqlite:///", ""))

    if args.all:
        positions = db.get_all_positions()
        title = "ALL POSITIONS (OPEN & SETTLED)"
    else:
        positions = db.get_open_positions()
        title = "OPEN ACTIVE POSITIONS"

    print("=" * 86)
    print(f"  {title}")
    print("=" * 86)
    if not positions:
        print("  No positions found.")
        print("  Use 'mone trade <id>' or 'mone run' to execute trades.")
    else:
        print(f"  {'ID':<5} {'STATUS':<9} {'SIDE':<6} {'CITY':<16} {'MARKET ID':<24} {'PRICE':<8} {'QTY':<5} {'INVESTED':<10} {'PNL':<10}")
        print("-" * 86)
        for p in positions:
            pnl_str = f"${p.realized_pnl:+.2f}" if p.realized_pnl is not None else "OPEN"
            print(f"  #{p.id:<4} {p.status:<9} {p.side:<6} {p.city:<16} {p.market_id:<24} ${p.entry_price:<7.2f} {p.contracts:<5} ${p.total_invested:<9.2f} {pnl_str:<10}")
    print("=" * 86 + "\n")


def cmd_markets(args):
    """Lists all 22 official NWS weather prediction market stations."""
    print_banner()
    print("=" * 82)
    print("  OFFICIAL NWS PREDICTION MARKET WEATHER STATIONS (22 HUBS)")
    print("=" * 82)
    print(f"  {'CITY':<18} {'STATION':<10} {'TICKER':<8} {'AIRPORT':<10} {'COORDINATES':<18} {'TIMEZONE'}")
    print("-" * 82)
    for s in NWS_STATIONS:
        coords = f"{s.lat:.2f}, {s.lon:.2f}"
        print(f"  {s.city:<18} {s.station_code:<10} {s.kalshi_suffix:<8} {s.nws_airport_code:<10} {coords:<18} {s.timezone}")
    print("-" * 82)
    print("  Trade any hub directly : 'mone trade <TICKER>' (e.g. mone trade SATX)")
    print("  Forecast any hub       : 'mone forecast <CITY>' (e.g. mone forecast Miami)")
    print("=" * 82 + "\n")


def cmd_forecast(args):
    """Fetches live ensemble weather forecast for a city, station, or all hubs."""
    print_banner()
    config = get_config(
        weather_provider=args.provider or None,
    )
    agent = MoneAgent(config=config)

    now = datetime.now(timezone.utc)
    target_date = args.date or ((now + timedelta(days=1)).strftime("%Y-%m-%d") if now.hour >= 18 else now.strftime("%Y-%m-%d"))

    if args.target:
        st = resolve_station(args.target)
        if not st:
            print(f"[-] Could not find station for query '{args.target}'. Run 'mone markets' for list.")
            return
        stations_to_query = [st]
    else:
        stations_to_query = NWS_STATIONS

    print(f"[*] Fetching forecast for {target_date} from {agent.weather.provider_id}...")
    forecasts = agent.weather.batch_get_forecasts([s.model_dump() for s in stations_to_query], target_date)

    print("\n" + "=" * 80)
    print(f"  WEATHER ENSEMBLE FORECAST — Target Date: {target_date}")
    print("=" * 80)
    print(f"  {'CITY':<18} {'STATION':<10} {'RAIN PROB':<12} {'EXP PRECIP':<14} {'MEMBERS':<10} {'SIGNAL'}")
    print("-" * 80)
    for st in stations_to_query:
        f = forecasts.get(st.station_code)
        if f:
            precip_in = f.mean_precipitation_inches
            precip_str = f"{f.mean_precipitation_mm:.2f}mm ({precip_in:.2f}\")"
            signal_side = "BUY YES" if f.rain_probability_pct >= 75.0 else ("BUY NO" if f.rain_probability_pct <= 25.0 else "NEUTRAL")
            print(f"  {st.city:<18} {st.station_code:<10} {f.rain_probability_pct:<11.1f}% {precip_str:<14} {f.ensemble_total_members:<10} {signal_side}")
    print("=" * 80 + "\n")


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


def cmd_scan(args):
    """Pre-defined query: Scans all 22 airport stations and displays live edge comparison."""
    print_banner()
    config = get_config()
    agent = MoneAgent(config=config)
    print(f"[*] Scanning 22 NWS stations via {agent.weather.provider_id} against {agent.market.venue_id}...")
    res = agent.step(target_date=args.date)
    signals = res.get("signals", [])
    print("\n" + "=" * 78)
    print(f"  {'CITY':<20} {'STATION':<10} {'PROB':<10} {'ASK':<10} {'EDGE':<10} {'ACTION':<10}")
    print("=" * 78)
    for s in signals:
        edge_str = f"+{s['edge_pct']:.1f}%" if s['edge_pct'] > 0 else f"{s['edge_pct']:.1f}%"
        print(f"  {s['city']:<20} {s['station_code']:<10} {s['model_prob_pct']:<9.1f}% ${s['market_ask']:<9.2f} {edge_str:<10} {s['action']:<10}")
    print("=" * 78)
    print(f"  Total Actionable Opportunities: {res['actionable_signals_count']}")
    print(f"  Run 'mone signals' or 'mone trade <id>' to execute trades.\n")


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

    # 5. Entitlement & License check
    print(f"\n[5] License & Paywall Entitlement:")
    try:
        mgr = get_entitlement_manager()
        status = mgr.get_status()
        if status.allowed:
            print(f"    [OK] Plan '{status.plan}' active ({status.runs_remaining} runs remaining, {status.trial_days_remaining} trial days left)")
        else:
            print(f"    [UPGRADE REQUIRED] {status.message}")
            print(f"    Run 'mone pay' or visit https://mono-agent.vercel.app/#pricing to upgrade.")
    except Exception as e:
        print(f"    [ERROR] Entitlement check failed: {e}")

    print("\n[+] Diagnostics complete.\n")


def cmd_pay(args):
    """Inspects license status, views USDC payment plans & addresses, or submits a transaction hash."""
    print_banner()
    mgr = get_entitlement_manager()
    status = mgr.get_status()

    # If --tx is provided: submit payment verification
    if getattr(args, "tx", None):
        plan_key = getattr(args, "plan", None) or "pass_10"
        network = getattr(args, "network", None) or "polygon"
        print(f"[*] Verifying transaction {args.tx} on {network.upper()} for plan '{plan_key}'...")
        try:
            new_status = mgr.credit_payment(plan_key=plan_key, tx_hash=args.tx, network=network)
            print("\n" + "=" * 68)
            print("  [+] PAYMENT VERIFIED SUCCESSFULLY ON-CHAIN!")
            print("=" * 68)
            print(f"  Plan Activated     : {new_status.plan}")
            print(f"  Runs Remaining     : {new_status.runs_remaining}")
            print(f"  Entitlement Status : {'ACTIVE' if new_status.allowed else 'EXPIRED'}")
            print(f"  Network            : {network.upper()}")
            print(f"  Transaction Hash   : {args.tx}")
            print("-" * 68)
            print("  You can now run 'mone run' or 'mone scan' without restrictions.\n")
            return
        except Exception as e:
            print("\n" + "=" * 68)
            print(f"  [-] PAYMENT VERIFICATION FAILED: {e}")
            print("=" * 68 + "\n")
            sys.exit(1)

    # Otherwise: display status and payment instructions
    print("=" * 74)
    print("  MONE AGENT ENTITLEMENT & NATIVE USDC BILLING")
    print("=" * 74)
    print(f"  Current Plan       : {status.plan}")
    print(f"  Runs Remaining     : {status.runs_remaining}")
    print(f"  Trial Days Left    : {status.trial_days_remaining} days")
    print(f"  Execution Status   : {'UNLOCKED' if status.allowed else 'LOCKED (UPGRADE REQUIRED)'}")
    print(f"  CLI API Token      : {status.cli_api_token or 'None'}")
    print("-" * 74)
    print("  AVAILABLE PRICING TIERS (Native USDC):")
    print("    1. 100 Runs Pass  : 10 USDC  (--plan pass_10)          - 100 Automated Cycles")
    print("    2. 300 Runs Pass  : 25 USDC  (--plan pass_25)          - 300 Cycles + Priority Queue")
    print("    3. Pro Trader     : 49 USDC  (--plan pro_subscription) - 30 Days Unlimited Cycles")
    print("-" * 74)
    print("  OFFICIAL NON-CUSTODIAL USDC DEPOSIT ADDRESSES:")
    print(f"    • Polygon (Native USDC) : {DESTINATION_WALLETS['evm']}")
    print(f"    • Base (Native USDC)    : {DESTINATION_WALLETS['evm']}")
    print(f"    • Solana (Native USDC)  : {DESTINATION_WALLETS['solana']}")
    print("-" * 74)
    print("  HOW TO ACTIVATE AFTER SENDING:")
    print("    mone pay --plan pass_10 --network polygon --tx <tx_hash>")
    print("    Or verify via Web3 wallet at: https://mono-agent.vercel.app/#pricing")
    print("=" * 74 + "\n")


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


def cmd_configure(args):
    """Configuration & Bring-Your-Own-Key (BYOK) wizard and parameter updater."""
    print_banner()
    updates = {}
    if getattr(args, "capital", None) is not None:
        updates["CAPITAL_PER_TRADE"] = str(args.capital)
    if getattr(args, "max_drawdown", None) is not None:
        updates["MAX_DAILY_DRAWDOWN"] = str(args.max_drawdown)
    if getattr(args, "min_edge", None) is not None:
        updates["MIN_EDGE_THRESHOLD"] = str(args.min_edge)
    if getattr(args, "mode", None) is not None:
        updates["AGENT_AUTONOMY_MODE"] = str(args.mode)
    if getattr(args, "venue", None) is not None:
        updates["DEFAULT_VENUE"] = str(args.venue)
    if getattr(args, "provider", None) is not None:
        updates["WEATHER_PROVIDER"] = str(args.provider)

    if updates:
        env_path = ".env"
        lines = []
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                lines = f.readlines()

        updated_keys = set()
        new_lines = []
        for line in lines:
            matched = False
            for k, v in updates.items():
                if line.startswith(f"{k}=") or line.startswith(f"#{k}="):
                    new_lines.append(f"{k}={v}\n")
                    updated_keys.add(k)
                    matched = True
                    break
            if not matched:
                new_lines.append(line)

        for k, v in updates.items():
            if k not in updated_keys:
                new_lines.append(f"{k}={v}\n")

        with open(env_path, "w", encoding="utf-8") as f:
            f.writelines(new_lines)

        print("[+] Configuration successfully updated in .env:")
        for k, v in updates.items():
            print(f"    - {k} = {v}")
        print("")

    config = get_config(reload=True)
    print("=" * 68)
    print("  mone CONFIGURATION & BRING-YOUR-OWN-KEY (BYOK) WIZARD")
    print("=" * 68)
    print(f"  Weather Provider     : {config.weather_provider.value} (Options: auto, openmeteo, weathernext3)")
    print(f"  Execution Venue      : {config.default_venue.value} (Options: kalshi_demo, kalshi_live, polymarket)")
    print(f"  Autonomy Mode        : {config.agent_autonomy_mode.value} (Options: autonomous, copilot)")
    print(f"  Capital Per Trade    : ${config.capital_per_trade:.2f}")
    print(f"  Max Daily Drawdown   : ${config.max_daily_drawdown:.2f}")
    print(f"  Min Edge Threshold   : {config.min_edge_threshold * 100:.1f}%")
    print(f"  Max Entry Ask Price  : ${config.max_entry_ask_price:.2f}")
    print(f"  Neatlogs API Key     : {'[CONFIGURED]' if config.has_neatlogs() else '[NOT SET]'}")
    print(f"  Kalshi Credentials   : {'[CONFIGURED]' if config.kalshi_api_key_id else '[DEMO / SIMULATED]'}")
    print(f"  Polymarket Key       : {'[CONFIGURED]' if config.polymarket_api_key else '[MOCK / SIMULATED]'}")
    print(f"  Database URL         : {config.database_url}")
    print("-" * 68)
    print("  To adjust parameters: mone config --capital 25.0 --mode copilot")
    print("=" * 68 + "\n")


def main():
    parser = argparse.ArgumentParser(
        prog="mone",
        description="mone — Autonomous Weather Prediction Market Trading Agent",
    )
    subparsers = parser.add_subparsers(dest="command")

    # Command: trade
    p_trade = subparsers.add_parser("trade", help="Execute a trade by Signal ID, Market Ticker, Station, or City")
    p_trade.add_argument("identifier", type=str, help="Signal ID (e.g. 1), Market ID (e.g. KXRAIN-26OCT12-SATX), Station (e.g. SATX), or City (e.g. 'Miami')")
    p_trade.add_argument("--side", choices=["YES", "NO", "yes", "no"], help="Side override (YES or NO)")
    p_trade.add_argument("--capital", type=float, help="Capital to allocate in USD (e.g. 25.0)")
    p_trade.add_argument("--contracts", type=int, help="Contract quantity override")
    p_trade.add_argument("--venue", choices=["kalshi_demo", "kalshi_live", "polymarket"], help="Venue override")

    # Command: balance
    subparsers.add_parser("balance", help="Inspect account cash, open positions collateral, equity, and circuit breaker")

    # Command: signals
    subparsers.add_parser("signals", help="List staged Copilot signals with ready-to-execute trade commands")

    # Command: positions
    p_pos = subparsers.add_parser("positions", help="List active open positions and settled trade ledger")
    p_pos.add_argument("--all", action="store_true", help="Display all open and settled historical positions")

    # Command: markets
    subparsers.add_parser("markets", help="List all 22 official NWS weather prediction market stations")

    # Command: forecast
    p_fc = subparsers.add_parser("forecast", help="Inspect live weather ensemble forecast for a city, station, or all hubs")
    p_fc.add_argument("target", nargs="?", type=str, help="City or station ticker (e.g. 'Miami', 'SATX'). Omit for all 22 stations.")
    p_fc.add_argument("--date", type=str, help="Target date YYYY-MM-DD")
    p_fc.add_argument("--provider", choices=["auto", "openmeteo", "weathernext3"], help="Weather provider override")

    # Command: config / configure
    p_cfg = subparsers.add_parser("config", help="View or adjust runtime configuration (capital per trade, mode, venue)")
    p_cfg.add_argument("--capital", type=float, help="Set capital per trade in USD (e.g. 25.0)")
    p_cfg.add_argument("--max-drawdown", type=float, help="Set max daily drawdown in USD (e.g. 50.0)")
    p_cfg.add_argument("--min-edge", type=float, help="Set minimum edge threshold (e.g. 0.05 for 5%)")
    p_cfg.add_argument("--mode", choices=["autonomous", "copilot"], help="Set autonomy mode")
    p_cfg.add_argument("--venue", choices=["kalshi_demo", "kalshi_live", "polymarket"], help="Set default venue")
    p_cfg.add_argument("--provider", choices=["auto", "openmeteo", "weathernext3"], help="Set weather provider")

    p_cfg2 = subparsers.add_parser("configure", help="Alias for 'config'")
    p_cfg2.add_argument("--capital", type=float, help="Set capital per trade in USD (e.g. 25.0)")
    p_cfg2.add_argument("--max-drawdown", type=float, help="Set max daily drawdown in USD (e.g. 50.0)")
    p_cfg2.add_argument("--min-edge", type=float, help="Set minimum edge threshold (e.g. 0.05 for 5%)")
    p_cfg2.add_argument("--mode", choices=["autonomous", "copilot"], help="Set autonomy mode")
    p_cfg2.add_argument("--venue", choices=["kalshi_demo", "kalshi_live", "polymarket"], help="Set default venue")
    p_cfg2.add_argument("--provider", choices=["auto", "openmeteo", "weathernext3"], help="Set weather provider")

    # Command: run
    p_run = subparsers.add_parser("run", help="Run agent trading cycle(s)")
    p_run.add_argument("--date", type=str, help="Target date YYYY-MM-DD (defaults to today/tomorrow)")
    p_run.add_argument("--mode", choices=["autonomous", "copilot"], help="Execution autonomy mode")
    p_run.add_argument("--venue", choices=["kalshi_demo", "kalshi_live", "polymarket"], help="Trading venue")
    p_run.add_argument("--provider", choices=["auto", "openmeteo", "weathernext3"], help="Weather provider")
    p_run.add_argument("--loop", action="store_true", help="Run continuously in a loop")
    p_run.add_argument("--interval", type=int, help="Loop interval in seconds (default 3600)")

    # Command: status
    subparsers.add_parser("status", help="View account equity, active positions, and copilot signals")

    # Command: approve
    p_app = subparsers.add_parser("approve", help="Approve a staged Copilot signal")
    p_app.add_argument("signal_id", type=int, help="ID of the staged signal to approve")

    # Command: scan
    p_scan = subparsers.add_parser("scan", help="Pre-defined query: scan all 22 stations and compare live model edge")
    p_scan.add_argument("--date", type=str, help="Target date YYYY-MM-DD")

    # Command: doctor
    subparsers.add_parser("doctor", help="Check system connections and configuration")

    # Command: backtest
    p_bt = subparsers.add_parser("backtest", help="Run historical replay backtesting")
    p_bt.add_argument("--days", type=int, default=60, help="Number of historical days to simulate")

    # Command: pay (aliases: license, entitlement)
    p_pay = subparsers.add_parser("pay", aliases=["license", "entitlement"], help="Inspect license entitlement, plans, or verify a USDC crypto transaction")
    p_pay.add_argument("--plan", choices=["pass_10", "pass_25", "pro_subscription"], help="Plan key (e.g. pass_10, pass_25, pro_subscription)")
    p_pay.add_argument("--network", choices=["polygon", "base", "solana"], help="Payment network (polygon, base, solana)")
    p_pay.add_argument("--tx", type=str, help="Transaction hash or signature to verify")

    # Command: serve
    p_srv = subparsers.add_parser("serve", help="Start the mone companion API server for web runner")
    p_srv.add_argument("--host", type=str, default="127.0.0.1", help="Host interface to bind (default 127.0.0.1)")
    p_srv.add_argument("--port", type=int, default=8000, help="Port to bind (default 8000)")

    args = parser.parse_args()

    try:
        if args.command in ("config", "configure"):
            cmd_configure(args)
        elif args.command == "trade":
            cmd_trade(args)
        elif args.command == "balance":
            cmd_balance(args)
        elif args.command == "signals":
            cmd_signals(args)
        elif args.command == "positions":
            cmd_positions(args)
        elif args.command == "markets":
            cmd_markets(args)
        elif args.command == "forecast":
            cmd_forecast(args)
        elif args.command == "run":
            cmd_run(args)
        elif args.command == "status":
            cmd_status(args)
        elif args.command == "scan":
            cmd_scan(args)
        elif args.command == "approve":
            cmd_approve(args)
        elif args.command == "doctor":
            cmd_doctor(args)
        elif args.command == "backtest":
            cmd_backtest(args)
        elif args.command in ("pay", "license", "entitlement"):
            cmd_pay(args)
        elif args.command == "serve":
            from mone.server import start_server
            print_banner()
            print(f"[*] Launching mone API companion server at http://{args.host}:{args.port}")
            start_server(host=args.host, port=args.port)
        else:
            parser.print_help()
    except EntitlementRequiredError as e:
        e.print_upgrade_banner()
        sys.exit(402)
    finally:
        flush_telemetry()


if __name__ == "__main__":
    main()
