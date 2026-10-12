"""
mone.agent — Autonomous Quantitative Trading Agent Orchestrator.
Coordinates dual weather ingestion, prediction market order books, deterministic quant edge evaluation,
risk guardrails, and Neatlogs span telemetry.
"""

from datetime import datetime, timezone, timedelta
import logging
from typing import Dict, List, Optional

from mone.config import AutonomyMode, MoneConfig, get_config
from mone.markets import (
    NWS_STATIONS,
    MarketClient,
    MarketQuote,
    OrderRequest,
    get_market_client,
    resolve_station,
)
from mone.providers import WeatherForecast, WeatherProvider, get_weather_provider
from mone.risk import RiskManager
from mone.state import Database, EquitySummary, PositionRecord, SignalRecord
from mone.strategy import TradeSignal, evaluate_market_signal
from mone.telemetry import agent_span, init_telemetry, tool_span, workflow_span
from mone.entitlements import get_entitlement_manager, EntitlementManager

logger = logging.getLogger("mone.agent")


class MoneAgent:
    """
    Main autonomous trading agent for Google WeatherNext & Prediction Markets.
    """

    def __init__(
        self,
        config: Optional[MoneConfig] = None,
        weather_provider: Optional[WeatherProvider] = None,
        market_client: Optional[MarketClient] = None,
        db: Optional[Database] = None,
        risk_manager: Optional[RiskManager] = None,
        entitlement_manager: Optional[EntitlementManager] = None,
    ):
        self.config = config or get_config()
        self.db = db or Database(
            db_path=self.config.database_url.replace("sqlite:///", "")
        )
        self.weather = weather_provider or get_weather_provider(self.config)
        self.market = market_client or get_market_client(self.config)
        self.risk = risk_manager or RiskManager(self.config)
        self.entitlements = entitlement_manager or get_entitlement_manager()

        # Initialize Neatlogs observability
        init_telemetry(
            api_key=self.config.neatlogs_api_key,
            workflow_name=self.config.neatlogs_workflow_name,
        )

    @tool_span(name="fetch_weather_forecasts")
    def fetch_weather_forecasts(self, target_date: str) -> Dict[str, WeatherForecast]:
        """Tool call: fetches ensemble forecasts across all 22 NWS airport stations."""
        logger.info(f"Fetching weather forecasts from {self.weather.provider_id} for {target_date}")
        stations_data = [s.model_dump() for s in NWS_STATIONS]
        return self.weather.batch_get_forecasts(stations_data, target_date)

    @tool_span(name="fetch_market_quotes")
    def fetch_market_quotes(self, target_date: str) -> Dict[str, MarketQuote]:
        """Tool call: fetches live or paper market quotes for target date."""
        logger.info(f"Fetching market quotes from {self.market.venue_id} for {target_date}")
        return self.market.get_quotes_for_date(target_date)

    @agent_span(name="evaluate_market_signals")
    def generate_signals(
        self,
        forecasts: Dict[str, WeatherForecast],
        quotes: Dict[str, MarketQuote],
        target_date: str,
    ) -> List[TradeSignal]:
        """Agent decision loop: computes edge and applies deterministic trading rules."""
        signals: List[TradeSignal] = []

        for st in NWS_STATIONS:
            code = st.station_code
            forecast = forecasts.get(code)
            quote = quotes.get(code)

            if not forecast or not quote:
                continue

            sig = evaluate_market_signal(forecast, quote, self.config)
            signals.append(sig)

        return signals

    @tool_span(name="execute_order")
    def execute_order(self, signal: TradeSignal) -> Optional[PositionRecord]:
        """Tool call: executes order on broker/exchange and updates local SQLite ledger."""
        if not signal.is_actionable or signal.contracts_suggested <= 0:
            return None

        # Production Guardrail: Ensure venue has sufficient real collateral
        venue_balance = self.market.get_balance()
        est_cost = signal.contracts_suggested * signal.market_ask
        if venue_balance < est_cost:
            logger.error(
                f"INSUFFICIENT COLLATERAL on {self.market.venue_id}: "
                f"${venue_balance:.2f} available < ${est_cost:.2f} required for {signal.market_id}. "
                f"Halting order execution. Deposit funds on {self.market.venue_id} to resume."
            )
            return None

        order = OrderRequest(
            market_id=signal.market_id,
            station_code=signal.station_code,
            side="YES" if signal.side == "YES" else "NO",
            action="BUY",
            contracts=signal.contracts_suggested,
            max_price=signal.market_ask,
        )

        result = self.market.place_order(order)
        if result.status == "FILLED":
            pos = PositionRecord(
                market_id=signal.market_id,
                station_code=signal.station_code,
                city=signal.city,
                target_date=signal.target_date,
                side=signal.side,  # type: ignore
                entry_price=result.fill_price,
                contracts=result.contracts,
                total_invested=result.total_cost,
                potential_payout=float(result.contracts * 1.00),
                status="OPEN",
            )
            pos_id = self.db.record_position(pos)
            pos.id = pos_id
            logger.info(
                f"Executed trade: {signal.action} {result.contracts}x {signal.market_id} @ ${result.fill_price:.2f} (Total: ${result.total_cost:.2f})"
            )
            return pos
        else:
            logger.warning(f"Order rejected on {signal.market_id}: {result.error}")
            return None

    @workflow_span(name="resolve_settlements")
    def resolve_settlements(self) -> int:
        """
        Reconciles open positions against settled markets from the exchange.
        """
        open_positions = self.db.get_open_positions()
        if not open_positions:
            return 0

        settled_markets = self.market.get_settled_markets(limit=100)
        resolved_count = 0

        for pos in open_positions:
            actual_res = settled_markets.get(pos.market_id)
            if actual_res in ("YES", "NO"):
                won = (pos.side == actual_res)
                if won:
                    payout = pos.potential_payout
                    net_pnl = payout - pos.total_invested
                else:
                    payout = 0.0
                    net_pnl = -pos.total_invested
                    self.risk.record_loss(abs(net_pnl))

                self.db.resolve_position(pos.id, actual_res, payout, net_pnl)
                resolved_count += 1
                logger.info(
                    f"Settled {pos.market_id}: Actual={actual_res}, Picked={pos.side} -> PnL: ${net_pnl:+.2f}"
                )

        return resolved_count

    @workflow_span(name="mone_trading_cycle")
    def step(self, target_date: Optional[str] = None) -> Dict:
        """
        Executes a single end-to-end trading agent cycle:
        1. Settlement check
        2. Weather ingest
        3. Market ingest
        4. Quant evaluation
        5. Execution / Copilot Staging
        """
        # Enforce paywall / trial entitlement
        self.entitlements.require_entitlement("Agent trading cycle")

        # Resolve existing settlements
        resolved = self.resolve_settlements()

        # Discard stale staged signals from previous days (laptop sleep / wakeup safety)
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        pruned_count = self.db.expire_stale_signals(today_str)
        if pruned_count > 0:
            logger.info(f"Cleaned up {pruned_count} expired staged signals from prior dates upon agent run.")

        if not target_date:
            now = datetime.now(timezone.utc)
            # WeatherNext forecasts target tomorrow if late in the day
            if now.hour >= 18:
                target_date = (now + timedelta(days=1)).strftime("%Y-%m-%d")
            else:
                target_date = now.strftime("%Y-%m-%d")

        # 1. Tool Call: Fetch Forecasts
        forecasts = self.fetch_weather_forecasts(target_date)

        # 2. Tool Call: Fetch Market Quotes
        quotes = self.fetch_market_quotes(target_date)

        # 3. Agent Span: Generate deterministic signals
        signals = self.generate_signals(forecasts, quotes, target_date)

        actionable_signals = [s for s in signals if s.is_actionable]
        executed_positions = []
        staged_signals = []

        equity = self.db.get_equity_summary()

        for sig in actionable_signals:
            # Check Risk Guardrails
            risk_check = self.risk.validate_signal_risk(
                sig,
                current_cash_balance=equity.cash_balance,
                open_positions_count=equity.open_positions_count,
            )

            if not risk_check.allowed:
                logger.info(f"Signal for {sig.station_code} skipped due to risk guardrail: {risk_check.reason}")
                continue

            if self.config.agent_autonomy_mode == AutonomyMode.AUTONOMOUS:
                pos = self.execute_order(sig)
                if pos:
                    executed_positions.append(pos)
                    # Refresh equity for next position in cycle
                    equity = self.db.get_equity_summary()
            else:
                # Copilot Mode: stage signal in SQLite for manual approval
                sig_id = self.db.record_signal(sig, status="STAGED")
                staged_signals.append({"id": sig_id, "signal": sig.model_dump()})

        equity_final = self.db.get_equity_summary()
        updated_entitlement = self.entitlements.consume_run()

        return {
            "target_date": target_date,
            "resolved_count": resolved,
            "total_stations_evaluated": len(signals),
            "actionable_signals_count": len(actionable_signals),
            "mode": self.config.agent_autonomy_mode.value,
            "executed_count": len(executed_positions),
            "staged_count": len(staged_signals),
            "executed_positions": [p.model_dump() for p in executed_positions],
            "staged_signals": staged_signals,
            "equity": equity_final.model_dump(),
            "entitlement": updated_entitlement.model_dump(),
        }

    def approve_copilot_signal(self, signal_id: int) -> Optional[PositionRecord]:
        """Approves and executes a staged signal from the Copilot queue."""
        self.entitlements.require_entitlement("Copilot signal approval")
        staged = self.db.get_staged_signals()
        target = next((s for s in staged if s.id == signal_id), None)
        if not target:
            logger.warning(f"Staged signal id {signal_id} not found")
            return None

        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        if target.target_date < today_str:
            logger.warning(
                f"Cannot approve signal {signal_id}: market target date {target.target_date} has expired."
            )
            self.db.update_signal_status(signal_id, "EXPIRED")
            return None

        # Reconstruct TradeSignal
        sig = TradeSignal(
            station_code=target.station_code,
            city=target.city,
            target_date=target.target_date,
            market_id=target.market_id,
            venue=target.venue,
            action=target.action,  # type: ignore
            side=target.side,  # type: ignore
            model_prob_pct=target.model_prob_pct,
            market_ask=target.market_ask,
            market_implied_prob_pct=round(target.market_ask * 100.0, 1),
            edge_pct=target.edge_pct,
            expected_roi_pct=round(((1.0 - target.market_ask) / target.market_ask) * 100.0, 1),
            contracts_suggested=target.contracts,
            capital_allocated=target.capital,
            reason=target.reason,
            is_actionable=True,
        )

        pos = self.execute_order(sig)
        if pos:
            self.db.update_signal_status(signal_id, "EXECUTED")
            self.entitlements.consume_run()
        else:
            self.db.update_signal_status(signal_id, "REJECTED")
        return pos

    def execute_custom_trade(
        self,
        identifier: str,
        side: Optional[str] = None,
        capital: Optional[float] = None,
        contracts: Optional[int] = None,
    ) -> Optional[PositionRecord]:
        """
        Executes a trade on a market or staged signal triggered by CLI query or trader intent.

        Identifier can be:
        1. Staged signal ID (e.g. '1', '#1')
        2. Weather market ID (e.g. 'KXRAIN-26OCT12-SATX')
        3. Station ticker / code (e.g. 'SATX', 'CLIORD')
        4. City name (e.g. 'San Antonio', 'Miami', 'Chicago')
        """
        self.entitlements.require_entitlement("Direct trade execution")
        clean_id = identifier.strip()
        num_part = clean_id.lstrip("#")

        # 1. Numeric signal ID execution
        if num_part.isdigit():
            sig_id = int(num_part)
            if side is None and capital is None and contracts is None:
                return self.approve_copilot_signal(sig_id)

            staged = self.db.get_staged_signals()
            target = next((s for s in staged if s.id == sig_id), None)
            if target:
                trade_side = side.upper() if side else target.side
                ask_p = target.market_ask
                cap = capital if capital is not None else target.capital
                cnts = contracts if contracts is not None else max(1, int(cap / max(ask_p, 0.01)))
                sig = TradeSignal(
                    station_code=target.station_code,
                    city=target.city,
                    target_date=target.target_date,
                    market_id=target.market_id,
                    venue=target.venue,
                    action=f"BUY_{trade_side}",
                    side=trade_side,  # type: ignore
                    model_prob_pct=target.model_prob_pct,
                    market_ask=ask_p,
                    market_implied_prob_pct=round(ask_p * 100.0, 1),
                    edge_pct=target.edge_pct,
                    expected_roi_pct=round(((1.0 - ask_p) / ask_p) * 100.0, 1),
                    contracts_suggested=cnts,
                    capital_allocated=round(cnts * ask_p, 2),
                    reason=f"CLI manual approval on signal #{sig_id}",
                    is_actionable=True,
                )
                pos = self.execute_order(sig)
                if pos:
                    self.db.update_signal_status(sig_id, "EXECUTED")
                return pos

        # 2. Match existing staged signal by market_id, station_code, or city
        staged = self.db.get_staged_signals()
        matched_staged = None
        for s in staged:
            if s.market_id.upper() == clean_id.upper() or s.station_code.upper() == clean_id.upper() or s.city.lower() == clean_id.lower():
                matched_staged = s
                break

        station = resolve_station(clean_id)
        if not matched_staged and station:
            for s in staged:
                if s.station_code == station.station_code:
                    matched_staged = s
                    break

        if matched_staged and side is None and capital is None and contracts is None:
            return self.approve_copilot_signal(matched_staged.id)

        # 3. Direct market trade execution
        now = datetime.now(timezone.utc)
        target_date = (now + timedelta(days=1)).strftime("%Y-%m-%d") if now.hour >= 18 else now.strftime("%Y-%m-%d")

        quotes = self.fetch_market_quotes(target_date)
        quote = None
        target_station_code = None
        target_city = None

        if station:
            target_station_code = station.station_code
            target_city = station.city
            quote = quotes.get(station.station_code)
        else:
            for q in quotes.values():
                if q.market_id.upper() == clean_id.upper():
                    quote = q
                    target_station_code = q.station_code
                    target_city = q.city
                    break

        if not quote:
            if station:
                dt = datetime.strptime(target_date, "%Y-%m-%d")
                date_code = dt.strftime("%y%b%d").upper()
                quote = MarketQuote(
                    market_id=f"KXRAIN-{date_code}-{station.kalshi_suffix}",
                    venue=self.market.venue_id,
                    station_code=station.station_code,
                    city=station.city,
                    target_date=target_date,
                    yes_ask=0.50,
                    yes_bid=0.48,
                    no_ask=0.52,
                    no_bid=0.50,
                )
                target_station_code = station.station_code
                target_city = station.city
            else:
                logger.error(f"Cannot resolve station or market from identifier: {clean_id}")
                return None

        # Determine side (YES/NO)
        if side:
            trade_side = side.upper()
        else:
            forecasts = self.weather.batch_get_forecasts([station.model_dump()], target_date) if station else {}
            forecast = forecasts.get(target_station_code or "")
            trade_side = "YES" if (forecast and forecast.rain_probability_pct >= 50.0) else "NO"

        ask_price = quote.yes_ask if trade_side == "YES" else quote.no_ask
        if ask_price <= 0.0:
            ask_price = 0.50

        cap = capital if capital is not None else self.config.capital_per_trade_usd
        cnts = contracts if contracts is not None else max(1, int(cap / max(ask_price, 0.01)))

        sig = TradeSignal(
            station_code=target_station_code or "UNKNOWN",
            city=target_city or "Unknown",
            target_date=target_date,
            market_id=quote.market_id,
            venue=self.market.venue_id,
            action=f"BUY_{trade_side}",
            side=trade_side,  # type: ignore
            model_prob_pct=50.0,
            market_ask=ask_price,
            market_implied_prob_pct=round(ask_price * 100.0, 1),
            edge_pct=0.0,
            expected_roi_pct=round(((1.0 - ask_price) / ask_price) * 100.0, 1),
            contracts_suggested=cnts,
            capital_allocated=round(cnts * ask_price, 2),
            reason=f"Manual CLI trader execution for {clean_id}",
            is_actionable=True,
        )

        equity = self.db.get_equity_summary()
        risk_check = self.risk.validate_signal_risk(
            sig,
            current_cash_balance=equity.cash_balance,
            open_positions_count=equity.open_positions_count,
        )
        if not risk_check.allowed:
            logger.warning(f"Risk guardrail rejected trade: {risk_check.reason}")
            return None

        pos = self.execute_order(sig)
        if pos and matched_staged:
            self.db.update_signal_status(matched_staged.id, "EXECUTED")
        return pos

    def close_position_early(self, position_id: int) -> Optional[dict]:
        """
        Takes profit early or liquidates position before market settlement by selling contracts back to the order book.
        """
        open_positions = self.db.get_open_positions()
        pos = next((p for p in open_positions if p.id == position_id), None)
        if not pos:
            logger.warning(f"Position #{position_id} not found or already settled.")
            return None

        quotes = self.market.get_quotes_for_date(pos.target_date)
        quote = quotes.get(pos.station_code)

        current_bid = 0.50
        if quote:
            current_bid = quote.yes_bid if pos.side == "YES" else quote.no_bid

        if current_bid <= 0.01:
            current_bid = max(0.05, pos.entry_price * 0.9)

        sell_order = OrderRequest(
            market_id=pos.market_id,
            station_code=pos.station_code,
            side=pos.side,
            action="SELL",
            contracts=pos.contracts,
            max_price=current_bid,
        )

        res = self.market.place_order(sell_order)
        fill_price = res.fill_price if res.status == "FILLED" else current_bid
        proceeds = round(fill_price * pos.contracts, 2)
        realized_pnl = round(proceeds - pos.total_invested, 2)

        self.db.resolve_position(
            pos_id=pos.id,
            actual_result=f"CLOSED_EARLY_{pos.side}",
            payout_dollars=proceeds,
            net_pnl=realized_pnl,
        )

        logger.info(
            f"Closed position #{pos.id} early: {pos.contracts}x @ ${fill_price:.2f} "
            f"(Proceeds: ${proceeds:.2f}, Realized PnL: ${realized_pnl:+.2f})"
        )

        return {
            "position_id": pos.id,
            "city": pos.city,
            "market_id": pos.market_id,
            "side": pos.side,
            "contracts": pos.contracts,
            "entry_price": pos.entry_price,
            "close_price": fill_price,
            "proceeds": proceeds,
            "realized_pnl": realized_pnl,
            "status": "CLOSED_EARLY",
        }


