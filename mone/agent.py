"""
mone.agent — Autonomous Quantitative Trading Agent Orchestrator.
Coordinates dual weather ingestion, prediction market order books, deterministic quant edge evaluation,
risk guardrails, and Neatlogs span telemetry.
"""

from datetime import datetime, timezone, timedelta
import logging
from typing import Dict, List, Optional

from mone.config import AutonomyMode, MoneConfig, get_config
from mone.markets import NWS_STATIONS, MarketClient, MarketQuote, OrderRequest, get_market_client
from mone.providers import WeatherForecast, WeatherProvider, get_weather_provider
from mone.risk import RiskManager
from mone.state import Database, EquitySummary, PositionRecord, SignalRecord
from mone.strategy import TradeSignal, evaluate_market_signal
from mone.telemetry import agent_span, init_telemetry, tool_span, workflow_span

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
    ):
        self.config = config or get_config()
        self.db = db or Database(
            db_path=self.config.database_url.replace("sqlite:///", "")
        )
        self.weather = weather_provider or get_weather_provider(self.config)
        self.market = market_client or get_market_client(self.config)
        self.risk = risk_manager or RiskManager(self.config)

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
        # Resolve existing settlements
        resolved = self.resolve_settlements()

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
        }

    def approve_copilot_signal(self, signal_id: int) -> Optional[PositionRecord]:
        """Approves and executes a staged signal from the Copilot queue."""
        staged = self.db.get_staged_signals()
        target = next((s for s in staged if s.id == signal_id), None)
        if not target:
            logger.warning(f"Staged signal id {signal_id} not found")
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
        else:
            self.db.update_signal_status(signal_id, "REJECTED")
        return pos
