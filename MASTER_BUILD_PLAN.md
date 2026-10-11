# mone — Master Build Plan & Execution Prompts

This document is the actionable master execution plan for **mone**. It breaks down the 5 Core Builds into sequential phases with explicit **self-prompts** for each task to ensure rigorous execution and verifiable results.

---

## The 5 Core Builds

| # | Core Build | Scope | Key Deliverables |
| :-: | :--- | :--- | :--- |
| **1** | **Core Agent Engine (`mone-agent`)** | Data ingestion, quant logic, risk, execution, telemetry | Dual weather providers (WeatherNext 3 + Open-Meteo fallback), Kalshi & Polymarket clients, deterministic strategy, SQLite ledger, neatlogs spans |
| **2** | **Backtesting & Accuracy Engine** | Historical validation across 30–90 days | Historical replay engine, NWS ground truth, Kalshi settlement pricing, Sharpe/Brier/MDD metrics, report generator |
| **3** | **Minimalist Website & Distribution** | Public landing, user onboarding, app dashboard, packaging | Next.js 15 app (in-hero setup, backtest charts, `/agent` dashboard), pip package (`pip install mone-agent`), Dockerfile |
| **4** | **Dodo Payments Integration** | Non-custodial runner credits & Pro subscriptions | Checkout session generator, webhook receiver, credit wallet balance, non-custodial custody guarantees |
| **5** | **neatHack Partner Evidence & Submission** | Observability, repo context, economics, submission | neatlogs run & recovery traces, Entire checkpoints & graph, cfo.ai business plan artifact, 3-min Loom demo video |

---

## Sequential Implementation Prompts (Self-Prompt Sequence)

### Phase 1: Core Agent Engine

#### Prompt 1.1 — Project Foundation & BYOK Configuration
> **Self-Prompt:**  
> Initialize the Python package structure for `mone`. Create `requirements.txt` (with `neatlogs`, `google-cloud-bigquery`, `xarray`, `zarr`, `requests`, `pydantic`, `cryptography`), `pyproject.toml` for the `mone-agent` CLI, `.env.example`, and implement `mone/config.py`. Ensure `config.py` loads from `.env`, environment variables, and CLI overrides, with validation for weather providers, market venues, and risk parameters (`MAX_DAILY_DRAWDOWN`, `CAPITAL_PER_TRADE`). Write unit tests in `tests/test_config.py`.

#### Prompt 1.2 — Dual-Provider Weather Engine
> **Self-Prompt:**  
> Implement `mone/providers/base.py` defining the abstract `WeatherProvider` interface. Implement `mone/providers/openmeteo.py` querying Open-Meteo's WeatherNext 2 63-member ensemble REST API, computing rain probability at $\ge 0.25$ mm ($0.01"$). Implement `mone/providers/weathernext3.py` querying Google Cloud BigQuery station tables `weathernext_3_0_0_0p05deg` with longitude normalization (`lon % 360`). Implement `mone/providers/factory.py` to auto-select WeatherNext 3 and gracefully fall back to Open-Meteo on auth/network failure. Test both providers and fallback in `tests/test_providers.py`.

#### Prompt 1.3 — Prediction Market Connectors (Kalshi & Polymarket)
> **Self-Prompt:**  
> Implement `mone/markets/stations.py` with the 22 Kalshi NWS airport station coordinates and station codes. Implement `mone/markets/kalshi.py` supporting both Kalshi Live and Kalshi Demo API v2 for `KXRAIN` daily contracts. Implement `mone/markets/polymarket.py` for Polymarket rain contracts. Implement `mone/markets/paper.py` as a virtual broker. Normalize all outputs into a unified `MarketQuote` dataclass. Test all market clients in `tests/test_markets.py`.

#### Prompt 1.4 — Deterministic Quant Strategy & Risk Guardrails
> **Self-Prompt:**  
> Implement `mone/strategy/edge.py` calculating quantitative edge ($\text{Model Prob} - \text{Market Implied Prob}$). Implement `mone/strategy/rules.py` applying the deterministic trading filters: Long YES if Model $> 75\%$ and Ask $< 80$¢; Long NO if Model $< 25\%$ and Ask $< 80$¢; No Trade if $25\% \le \text{Model} \le 75\%$ or Ask $\ge 80$¢. Implement `mone/risk/guardrails.py` enforcing daily drawdown stop-loss and circuit breakers. Write tests in `tests/test_strategy.py` and `tests/test_risk.py`.

#### Prompt 1.5 — SQLite State Ledger, Master Loop & neatlogs Telemetry
> **Self-Prompt:**  
> Implement `mone/state/db.py` and `mone/state/models.py` using SQLite for zero-config persistence of equity, positions, and trade history. Implement `mone/agent.py` orchestrating the complete trading cycle decorated with `@neatlogs.span` for `WORKFLOW`, `AGENT`, and `TOOL` spans. Implement `mone/cli.py` exposing `run`, `configure`, and `status`. Create a deliberate test in `tests/test_failure_recovery.py` demonstrating GCS disconnect and successful fallback to Open-Meteo, capturing the trace for neatHack evidence.

---

### Phase 2: Backtesting & Accuracy Validation

#### Prompt 2.1 — Historical Data Loader & Replay Simulator
> **Self-Prompt:**  
> Implement `mone/backtest/data_loader.py` to load historical weather ensemble runs and resolved Kalshi `KXRAIN` / Polymarket contracts across 30–90 days for the 22 NWS stations. Implement `mone/backtest/engine.py` replaying the agent's strategy day by day against historical order books and NWS station ground-truth resolutions.

#### Prompt 2.2 — Performance Metrics & Reporting
> **Self-Prompt:**  
> Implement `mone/backtest/metrics.py` computing Win Rate %, Cumulative Realized PnL, Max Drawdown %, Sharpe Ratio, and Brier calibration score. Benchmark the strategy against Market Consensus and Random Guessing baselines. Implement `mone/backtest/report.py` serializing results to `backtest_results.json` and a formatted markdown summary. Expose `python -m mone backtest --days 60` in the CLI.

---

### Phase 3: Minimalist Website & Distribution

#### Prompt 3.1 — Next.js 15 Project Setup & Single-Page Landing (`/`)
> **Self-Prompt:**  
> Initialize `web/` as a Next.js 15 App Router project with Tailwind CSS and Lucide icons. Implement the public landing page `web/src/app/page.tsx`:
> 1. Hero Section with embedded interactive agent setup (CLI snippet + web runner configurator).
> 2. Backtest showcase displaying audited 85%+ win rate, Sharpe ratio, and equity curve.
> 3. Live market ticker showing active cities, WeatherNext probabilities, Kalshi asks, and real-time edge signals.
> 4. "High Temperature Market Agent — Coming Soon" roadmap card.
> 5. FAQ section and launch CTA.

#### Prompt 3.2 — Authenticated App Dashboard (`/agent`)
> **Self-Prompt:**  
> Implement `web/src/app/agent/page.tsx`:
> 1. Agent control strip with run status and Autonomous vs. Copilot (Manual Review) mode toggle.
> 2. Active signals feed with 1-click `[Approve Trade ($10)]` button for Copilot mode.
> 3. Agent trade portfolio ledger tracking executed trades, entry prices, and realized PnL.
> 4. Settings modal for BYOK credentials (WeatherNext 3 / Open-Meteo, Kalshi Live/Demo, Polymarket) and risk parameters.
> 5. neatlogs telemetry badge linking to the latest execution trace.

#### Prompt 3.3 — Standalone CLI Packaging & Cloud Dockerfile
> **Self-Prompt:**  
> Ensure `pip install -e .` installs `mone-agent` globally. Create a lightweight `Dockerfile` and `docker-compose.yml` so users can deploy the agent to AWS EC2/Lambda (using their $25 neatHack AWS credits) for 24/7 cloud running without keeping their laptop awake.

---

### Phase 4: Dodo Payments Integration

#### Prompt 4.1 — Dodo Payments Checkout & Webhook Handler
> **Self-Prompt:**  
> Implement `mone/billing/dodo.py` connecting to the Dodo Payments API. Create endpoints for runner compute fuel credit top-ups ($10, $25) and Pro SaaS subscriptions ($49/mo). Implement the webhook receiver validating Dodo Payments signatures and crediting user balances in SQLite. Enforce strict non-custodial boundaries (zero custody of exchange balances).

---

### Phase 5: neatHack Partner Evidence & Final Submission

#### Prompt 5.1 — Observability Traces, Entire Checkpoints & cfo.ai Model
> **Self-Prompt:**  
> 1. Run live agent cycles and export neatlogs traces (lifecycle trace, before/after optimization trace, failure-recovery trace). Link or embed screenshots in `hackathon.md`.
> 2. Run Entire checkpoints and generate `entire-graph` mapping.
> 3. Finalize `cfo_business_plan.md` using the user's cfo.ai model, demonstrating 88% gross margin under the BYOK compute-fuel model.
> 4. Record a 3-minute Loom video walking through the architecture, live traces, and financial plan. Draft the submission quote tweet for X tagging `#neatHack`.
