# mone — Agent Build Plan

## 1. Architectural Vision & Core Philosophy

**mone** is an autonomous quantitative trading agent engineered specifically for weather prediction markets. It combines state-of-the-art meteorological AI models (Google DeepMind's WeatherNext 3 and WeatherNext 2 ensembles) with algorithmic execution across **Kalshi**, **Kalshi Demo**, and **Polymarket**.

### Core Guarantees:
1. **Non-Custodial BYOK (Bring Your Own Key):** Users retain 100% control of their exchange balances and API keys. The agent never takes custody of funds.
2. **Dual-Provider Weather Resilience:** Primary high-resolution WeatherNext 3 (Google Cloud BigQuery/GCS) with seamless automatic fallback to free, zero-auth Open-Meteo WeatherNext 2.
3. **Deterministic Mathematical Edge:** Trades are executed only when statistical ensemble probability diverges significantly from market-implied odds within strict price boundaries.
4. **Dual Autonomy Levels:**
   * **Autonomous Mode ("Full Auto"):** Complete end-to-end hands-off execution within user-defined daily drawdown caps ("run without you watching").
   * **Copilot Mode ("Human-in-the-Loop"):** Continuously monitors markets, flags high-conviction mispricings, and stages trades for 1-click user review and approval.
5. **Full Observability with neatlogs:** Every plan, tool execution, state mutation, and error-recovery event is traced and visualized.

---

## 2. System Architecture Diagram

```
                              ┌──────────────────────────────────────────────┐
                              │            mone Unified CLI / Web            │
                              └──────────────────────┬───────────────────────┘
                                                     │
                                                     ▼
                                      ┌──────────────────────────────┐
                                      │   mone Agent Orchestrator    │
                                      │  (@neatlogs.span WORKFLOW)   │
                                      └──────────────┬───────────────┘
                                                     │
                ┌────────────────────────────────────┼────────────────────────────────────┐
                ▼                                    ▼                                    ▼
   ┌─────────────────────────┐          ┌─────────────────────────┐          ┌─────────────────────────┐
   │ Weather Provider Engine │          │  Market Scanner Engine  │          │    Risk & State Engine  │
   │ (@neatlogs.span TOOL)   │          │ (@neatlogs.span TOOL)   │          │ (@neatlogs.span TOOL)   │
   └────────────┬────────────┘          └────────────┬────────────┘          └────────────┬────────────┘
                │                                    │                                    │
       ┌────────┴────────┐                  ┌────────┴────────┐                  ┌────────┴────────┐
       ▼                 ▼                  ▼                 ▼                  ▼                 ▼
[WeatherNext 3]   [Open-Meteo WN2]     [Kalshi Live/Demo] [Polymarket]        [Daily Stop Loss] [SQLite Ledger]
(BigQuery/GCS)    (63-Member REST)     (KXRAIN Markets)   (Rain CLOB)         (Max Drawdown)    (Positions/PnL)
       │                 ▲
       └──── Fallback ───┘
```

---

## 3. Directory Layout

```
mone/
├── hackathon.md                      <-- neatHack build log & evidence
├── AGENT_BUILD_PLAN.md               <-- This technical specification
├── BACKTESTING_PLAN.md               <-- Historical validation plan
├── WEBSITE_BUILD_PLAN.md             <-- Web app specification
├── requirements.txt                  <-- Python dependencies
├── pyproject.toml                    <-- Package build metadata
├── .env.example                      <-- Configuration template
│
├── mone/                             <-- Core Python Agent Package
│   ├── __init__.py
│   ├── config.py                     <-- BYOK settings loader & validator
│   ├── agent.py                      <-- Master orchestrator & cycle runner
│   ├── cli.py                        <-- Command-line interface entry points
│   │
│   ├── providers/                    <-- Weather Model Ingestion
│   │   ├── __init__.py
│   │   ├── base.py                   <-- Base WeatherProvider abstract class
│   │   ├── weathernext3.py           <-- Google Cloud BigQuery & GCS Zarr v3
│   │   ├── openmeteo.py              <-- Open-Meteo WeatherNext 2 REST ensemble
│   │   └── factory.py                <-- Auto-selection & fallback manager
│   │
│   ├── markets/                      <-- Prediction Venues
│   │   ├── __init__.py
│   │   ├── base.py                   <-- Base MarketClient abstract class
│   │   ├── stations.py               <-- 22 Target NWS airport stations & coordinates
│   │   ├── kalshi.py                 <-- Kalshi Live & Kalshi Demo KXRAIN client
│   │   ├── polymarket.py             <-- Polymarket Gamma & CLOB Rain client
│   │   └── paper.py                  <-- Virtual simulated execution engine
│   │
│   ├── strategy/                     <-- Quantitative Intelligence
│   │   ├── __init__.py
│   │   ├── edge.py                   <-- Implied odds vs. true ensemble spread
│   │   ├── rules.py                  <-- Deterministic entry & exit rules
│   │   └── sizing.py                 <-- Fixed capital & Kelly criterion sizing
│   │
│   ├── risk/                         <-- Safety & Capital Preservation
│   │   ├── __init__.py
│   │   ├── guardrails.py             <-- Hard daily loss cap, slippage check
│   │   └── circuit_breaker.py        <-- Rapid-drawdown auto-pause
│   │
│   └── state/                        <-- Persistence & Accounting
│       ├── __init__.py
│       ├── db.py                     <-- SQLite database initialization
│       └── models.py                 <-- Portfolio equity, trade history, signals
│
└── tests/                            <-- Automated Test Suite
    ├── test_providers.py             <-- WeatherNext 3 & Open-Meteo tests
    ├── test_strategy.py              <-- Deterministic edge calculation tests
    ├── test_risk.py                  <-- Circuit breaker & drawdown tests
    └── test_failure_recovery.py      <-- neatlogs trace capture test
```

---

## 4. Module Specifications

### A. Configuration & BYOK (`mone/config.py`)
* Supports `.env`, environment variables, or CLI input.
* Settings:
  * `WEATHER_PROVIDER`: `'weathernext3'` | `'openmeteo'` | `'auto'` (Default: `'auto'`)
  * `GCP_PROJECT_ID`: Optional Google Cloud project for WeatherNext 3.
  * `EXECUTION_VENUE`: `'paper'` | `'kalshi_demo'` | `'kalshi_live'` | `'polymarket'`
  * `AUTONOMY_MODE`: `'autonomous'` | `'copilot'`
  * `KALSHI_API_KEY`, `KALSHI_API_SECRET`, `KALSHI_KEY_ID`: For Kalshi.
  * `POLYMARKET_API_KEY`, `POLYMARKET_SECRET`, `POLYMARKET_PASSPHRASE`: For Polymarket.
  * `NEATLOGS_API_KEY`: For telemetry tracing.
  * `CAPITAL_PER_TRADE`: Default `$10.00`.
  * `MAX_DAILY_DRAWDOWN`: Default `$50.00` (stops trading if daily loss reaches this limit).
  * `MIN_CONFIDENCE_THRESHOLD`: Default `0.75` ($75\%$).
  * `MAX_ENTRY_ASK`: Default `0.80` ($80$¢).

### B. Weather Ingestion Engine (`mone/providers/`)
1. **Station Coordinates Mapping (`mone/markets/stations.py`)**:
   Maintains strict mapping for the 22 NWS airport stations traded on Kalshi KXRAIN:
   * Chicago (`CLIORD`), Denver (`CLIDEN`), LA (`CLILAX`), Las Vegas (`CLILAS`), Miami (`CLIMIA`), NYC (`CLINYC`), Philadelphia (`CLIPHL`), San Francisco (`CLISFO`), Dallas (`CLIDFW`), DC (`CLIDCA`), Houston (`CLIHOU`), Seattle (`CLISEA`), Atlanta (`CLIATL`), Boston (`CLIBOS`), etc.
2. **`WeatherNext3Provider` (`mone/providers/weathernext3.py`)**:
   * Uses `google-cloud-bigquery` to query station tables `weathernext_3_0_0_0p05deg`.
   * Queries precomputed percentiles (`_p10`, `_p50`, `_p90`, `_mean`) and precipitation accumulation.
   * Coordinate transformation: `lon_360 = lon % 360`.
3. **`OpenMeteoProvider` (`mone/providers/openmeteo.py`)**:
   * Queries `https://ensemble-api.open-meteo.com/v1/ensemble` with `models=google_weathernext2_ensemble`.
   * Computes precipitation probability:
     $$\text{Probability} = \frac{\sum_{i=1}^{63} \mathbb{I}(\text{member}_i \ge 0.25\text{mm})}{63}$$
4. **`ProviderFactory` (`mone/providers/factory.py`)**:
   * If `WEATHER_PROVIDER == 'auto'` or `'weathernext3'`: Tries WeatherNext 3 first.
   * If credentials are missing or Google Cloud returns an error, gracefully catches the exception, switches to `OpenMeteoProvider`, and records a **neatlogs recovery span**.

### C. Market Integration Engine (`mone/markets/`)
1. **Kalshi Client (`mone/markets/kalshi.py`)**:
   * Implements Kalshi API v2 RSA key authentication.
   * Scans active markets for ticker prefix `KXRAIN` for the target date.
   * Normalizes YES/NO bids and asks into a unified `MarketQuote` dataclass:
     `ticker`, `city`, `station`, `target_date`, `yes_bid`, `yes_ask`, `no_bid`, `no_ask`, `market_implied_prob`.
   * Supports both Demo (`demo-api.kalshi.co`) and Live (`api.kalshi.co`) toggled via config.
2. **Polymarket Client (`mone/markets/polymarket.py`)**:
   * Ingests active precipitation contracts from the Polymarket Gamma API.
   * Maps token IDs and parses the order book for best ask prices.
3. **Paper Broker (`mone/markets/paper.py`)**:
   * Simulates trade execution against real market bid/ask prices with virtual capital ($100.00 default).
   * Persists pending positions until market resolution, then computes realized PnL.

### D. Deterministic Quantitative Strategy (`mone/strategy/`)
* **Threshold Rules (`mone/strategy/rules.py`)**:
  * **Long Rain (YES):** `model_probability > 0.75` AND `yes_ask < 0.80`.
  * **Short Rain (NO):** `model_probability < 0.25` AND `no_ask < 0.80`.
  * **No Trade Zone:** If $0.25 \le \text{model_probability} \le 0.75$, do not trade (avoid coin-toss markets).
  * **Price Safety Rule:** If `entry_ask >= 0.80`, do not trade (risk-to-reward ratio is insufficient to justify fee drag).
* **Quant Edge Calculation (`mone/strategy/edge.py`)**:
  $$\text{Edge} = \text{Model Probability} - \text{Market Implied Probability}$$
  Only signals with $|\text{Edge}| \ge 15\%$ are approved for trading.

### E. Risk Guardrails & Circuit Breaker (`mone/risk/`)
* **Daily Drawdown Limit:** Tracks daily realized + unrealized losses. If daily loss exceeds `MAX_DAILY_DRAWDOWN` (e.g. $50), the circuit breaker triggers and halts all further executions for the remainder of the 24-hour cycle.
* **Slippage Protection:** Orders are placed strictly as limit orders at or below the evaluated ask.
* **Capital Sizing:** Capped at fixed capital (e.g. $10) or fractional Kelly criterion ($f^* \le 0.10$).

### F. Master Agent Orchestrator (`mone/agent.py`)
Decorated with neatlogs telemetry:
```python
@neatlogs.span(kind="WORKFLOW", name="mone_trading_cycle")
def run_trading_cycle():
    # 1. Check risk guardrails
    # 2. Fetch active markets (Kalshi & Polymarket)
    # 3. Fetch WeatherNext ensemble forecasts
    # 4. Compute quantitative edge & filter opportunities
    # 5. Autonomous mode -> Execute trade; Copilot mode -> Stage signal
    # 6. Update SQLite ledger & flush neatlogs telemetry
```

---

## 5. Distribution Mechanisms

### A. CLI Experience (Terminal Users & Developers)
Installed via pip or git clone:
```bash
# Clone and install
git clone https://github.com/xcjohnmark/mone.git
cd mone
pip install -r requirements.txt

# Run initial interactive configuration wizard
python -m mone configure

# Run on-demand trading cycle (dry-run / paper mode)
python -m mone run --dry-run

# Run autonomous live trader
python -m mone run --mode autonomous --venue kalshi_demo

# Run historical backtest
python -m mone backtest --days 60
```

### B. Web Companion (Non-Terminal Users)
A clean Next.js interface that connects to a local or hosted `mone` FastAPI runner:
* Allows users to enter BYOK credentials in an encrypted browser session.
* Displays live WeatherNext vs. Market probability charts.
* Provides a 1-click `[Approve Trade]` button for Copilot mode.
* Exports a complete `.env` or `docker-compose.yml` file with 1 click.

---

## 6. neatHack Partner Integration Plan

1. **neatlogs:**
   * Trace roots for each 24h trading cycle.
   * Spans for each tool call: forecast fetch, market fetch, pricing evaluation, and order placement.
   * Captures deliberate error-recovery traces (GCS disconnect $\rightarrow$ Open-Meteo recovery).
2. **Entire:**
   * Initialize Entire repository checkpoints before each major implementation milestone.
   * Map dependencies and module interactions using `entire-graph`.
3. **cfo.ai:**
   * Financial model projecting revenue from compute fuel credits + $49/mo Pro SaaS subscriptions.
   * Documents an 88% gross margin enabled by non-custodial BYOK architecture.
