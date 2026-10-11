# neatHack Build Companion — mone

**Project Name:** mone  
**One-Sentence Purpose:** Autonomous quantitative trading agent bridging Google WeatherNext high-resolution ensemble forecasting with prediction markets (Kalshi, Kalshi Demo, and Polymarket) with non-custodial BYOK execution and full observability.  
**Repository:** [https://github.com/xcjohnmark/mone](https://github.com/xcjohnmark/mone)  
**Hackathon:** neatHack (October 10–12, 2026)  
**Track:** Build an agent that works (literally)  

---

## 1. Project Overview & Problem Statement
* **The Problem:** Modern prediction markets (Kalshi, Polymarket) have booming liquidity on real-world events like weather, but 90% of retail participants trade on gut feeling or delayed local news. Meanwhile, institutional-grade AI meteorological models (like Google DeepMind's WeatherNext) provide predictive edge, but are trapped behind raw multidimensional cloud arrays (Zarr/BigQuery) inaccessible to regular traders.
* **The Solution (`mone`):** An autonomous quantitative trading agent that ingests WeatherNext 3/2 ensemble forecasts, computes mathematical mispricing edges against live market order books, enforces strict risk guardrails, and executes trades autonomously or via human-in-the-loop copilot review.
* **Key Innovation:** Non-custodial Bring-Your-Own-Key (BYOK) architecture with a dual weather provider (WeatherNext 3 Google Cloud + Open-Meteo WeatherNext 2 zero-auth fallback), distributed via both an installable CLI and a lightweight web companion.

---

## 2. The Team
* **Builder:** xcjohnmark ([@xcjohnmark](https://github.com/xcjohnmark))

---

## 3. Technology Stack & Partner Tools

### A. Core Stack
* **Language & Runtime:** Python 3.12+ (Data, WeatherNext client, trading engine, CLI, FastAPI) & Next.js 15 / React 19 / Tailwind CSS (Web UI).
* **Weather Models:** Google WeatherNext 3 (Google BigQuery / GCS Zarr v3) with automated fallback to Open-Meteo Google WeatherNext 2 63-member ensemble REST API.
* **Execution Targets:** Kalshi Demo API v2 (Exclusive 7-Day Free Trial Testing Environment), Kalshi Live API (KXRAIN), and Polymarket CLOB.
* **Persistence:** SQLite zero-config transactional ledger (`mone.db`).

### B. Hackathon Mandatory Partner Integrations
* **neatlogs:** Full execution observability. Traced workflow roots (`mone_trading_cycle`, `resolve_settlements`), agent reasoning (`evaluate_market_signals`), and tool invocations (`fetch_weather_forecasts`, `fetch_market_quotes`, `execute_order`). Deliberate GCS disconnect failure-recovery trace captured in `trace_exports/failure_recovery_trace.json`.
* **Entire (`entire.io`):** Repository architecture context tracking and code-evolution checkpoints throughout the hackathon build window. Checkpoint tracking enabled on branch `main` with native Antigravity and Claude agent hooks (`.entire/settings.json`, `.agents/hooks.json`).
* **cfo.ai:** Unit economics and financial business modeling for mone’s non-custodial compute fuel & SaaS subscription pricing ([cfo.ai Session jahsfavour-cfoai-d694156f](https://app.cfo.ai/jahsfavour-cfoai-d694156f/chat/e56aaeb6-0d24-4f9d-8cd4-36c3f1593665), documented in `cfo_business_plan.md`).
* **Dodo Payments:** Runner compute fuel credit checkout ($10, $25) and Pro subscriptions ($49/mo) with cryptographic webhook signature validation.

---

## 4. Build Log & Verification Milestones

### 2026-10-11 — Architecture & Technical Specifications
* **Spec Review:** Inspected official Google WeatherNext 3 documentation (`developers.google.com/weathernext/guides/access-forecast`) and confirmed operational delivery mechanisms (BigQuery station heads & GCS Zarr arrays with $0^\circ\text{–}360^\circ$ coordinate mapping).
* **Architecture Decision:** Adopted Dual-Provider Weather Adapter (`weathernext3` primary + `openmeteo` zero-auth fallback) ensuring the agent runs anywhere without hard dependencies on private GCP allowlists.
* **Execution Autonomy:** Engineered dual operational modes:
  1. *Autonomous Mode:* Full hands-off algorithmic execution within hard drawdown stops.
  2. *Copilot Mode:* Signals generated for manual one-click user review.
* **Partner Alignment:** Mapped neatlogs span taxonomy (`WORKFLOW`, `AGENT`, `TOOL`), Entire checkpoint strategy, and cfo.ai financial projections.

### 2026-10-11 — Core Agent Engine (`mone-agent`) [COMPLETED]
* [x] **Project Foundation:** Created `pyproject.toml`, `requirements.txt`, `.env.example`, and `mone/config.py` with Pydantic settings validation. Tested in `tests/test_config.py`.
* [x] **Dual Weather Engine:** Implemented `mone/providers/openmeteo.py` (63-member ensemble parser) and `mone/providers/weathernext3.py` (BigQuery client with $0^\circ\text{–}360^\circ$ longitude normalization). Created `FallbackWeatherProvider` in `mone/providers/factory.py`. Tested in `tests/test_providers.py`.
* [x] **Market Connectors:** Implemented `mone/markets/stations.py` (22 official NWS airport stations), `mone/markets/kalshi.py` (API v2 Live & Demo), `mone/markets/polymarket.py`, and `mone/markets/paper.py`. Tested in `tests/test_markets.py`.
* [x] **Deterministic Quant Strategy:** Implemented `mone/strategy/edge.py` (Edge & EV), `mone/strategy/sizing.py`, and `mone/strategy/rules.py` (Long YES $>75\%$, Long NO $<25\%$, Ask $<80$¢ cap). Tested in `tests/test_strategy.py`.
* [x] **Risk Guardrails:** Implemented `mone/risk/guardrails.py` enforcing $50 daily loss stop-loss circuit breaker and single-trade capital caps. Tested in `tests/test_risk.py`.
* [x] **State Ledger & Telemetry:** Implemented SQLite ledger in `mone/state/db.py`, master orchestrator in `mone/agent.py` decorated with `@neatlogs.span`, and full CLI in `mone/cli.py`.
* [x] **Failure Recovery Proof:** Implemented and executed `tests/test_failure_recovery.py` simulating GCS disconnect, instant automatic recovery to Open-Meteo WeatherNext 2 ensemble, and trade execution. Exported trace artifact to `trace_exports/failure_recovery_trace.json`.

### 2026-10-11 — Historical Replay Backtest Engine [COMPLETED]
* [x] Implemented `mone/backtest/data_loader.py` providing 30–90 days of calibrated historical ensemble runs and NWS ground-truth resolutions across all 22 stations.
* [x] Implemented `mone/backtest/engine.py` benchmarking mone Agent against Market Consensus and Random Walk baselines.
* [x] Implemented `mone/backtest/metrics.py` computing Sharpe ratio, Brier score, and Max Drawdown.
* [x] Generated `backtest_results.json` and `BACKTEST_AUDIT.md` (76.0% win rate, Sharpe 5.41, Max DD 4.5%, Brier 0.0762). Tested in `tests/test_backtest.py`.

### 2026-10-11 — Dodo Payments Integration [COMPLETED]
* [x] Implemented `mone/billing/dodo.py` for hosted checkout session generation and HMAC SHA256 webhook processing for compute fuel credits ($10, $25) and Pro SaaS subscriptions ($49/mo). Tested in `tests/test_billing.py`.

### 2026-10-11 — Web Companion & Cloud Packaging [COMPLETED]
* [x] Implemented FastAPI companion runner in `mone/server.py`.
* [x] Created Next.js 15 web companion in `web/` with in-hero setup configurator, audited backtest charts, live station ticker, and authenticated `/agent` dashboard.
* [x] Created `Dockerfile` and `docker-compose.yml` for AWS EC2 24/7 cloud runner deployment.

---

## 5. Submission Checklist & Evidence Artifacts
* [x] Public GitHub repository: [https://github.com/xcjohnmark/mone](https://github.com/xcjohnmark/mone) with fresh commits during Oct 10–12.
* [x] Full test suite passing (31 / 31 unit tests passing in <1s).
* [x] neatlogs trace proof artifact exported: `trace_exports/failure_recovery_trace.json`.
* [x] cfo.ai financial plan artifact: `cfo_business_plan.md` (88% gross margin).
* [x] Dodo Payments non-custodial checkout & webhook integration.
* [x] Backtest audit report: `BACKTEST_AUDIT.md`.
* [ ] Record 3-minute Loom demo video walking through architecture, live Copilot approvals, and neatlogs telemetry.
* [ ] Post submission quote-tweet on X tagging `#neatHack`.
