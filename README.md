# mone — Autonomous Weather Prediction Market Trading Agent

<p align="center">
  <strong>Autonomous Quantitative Trading Agent bridging Google DeepMind's WeatherNext ensemble models with prediction markets (Kalshi & Polymarket) under a non-custodial Bring-Your-Own-Key (BYOK) architecture.</strong>
</p>

<p align="center">
  <a href="https://neatlogs.com/hackathon"><img src="https://img.shields.io/badge/%23neatHack-AI%20Agent%20Hackathon-blueviolet?style=flat-square" alt="neatHack Hackathon" /></a>
  <a href="#neatlogs-observability"><img src="https://img.shields.io/badge/Telemetry-neatlogs-success?style=flat-square" alt="neatlogs Telemetry" /></a>
  <a href="#entireio-integrity"><img src="https://img.shields.io/badge/Integrity-entire.io-blue?style=flat-square" alt="entire.io Checkpoints" /></a>
  <a href="#cfoai-financial-model"><img src="https://img.shields.io/badge/Financial%20Model-cfo.ai-orange?style=flat-square" alt="cfo.ai Model" /></a>
  <a href="#dodo-payments"><img src="https://img.shields.io/badge/Billing-Dodo%20Payments-green?style=flat-square" alt="Dodo Payments" /></a>
  <img src="https://img.shields.io/badge/Python-3.10%2B-blue?style=flat-square" alt="Python 3.10+" />
  <img src="https://img.shields.io/badge/License-MIT-lightgrey?style=flat-square" alt="MIT License" />
</p>

---

## Overview

Prediction markets on daily weather contracts (such as Kalshi `KXRAIN` and Polymarket Rain) suffer from acute crowd mispricing: retail market participants price contracts using consumer apps or intuitive guesses that fail to compute ensemble spread or model uncertainty.

**mone** solves this by bridging Google DeepMind's WeatherNext forecasting engine with prediction market order books:
1. **Dual Weather Ingestion Engine:** Primary Google WeatherNext 3 (Google BigQuery & GCS Zarr v3) with instant, zero-auth auto-fallback to Open-Meteo's WeatherNext 2 63-member ensemble REST API.
2. **Deterministic Quant Edge Evaluator:** Computes statistical mispricings strictly at the official 0.01-inch ($0.25$ mm) precipitation threshold across 22 NWS airport stations.
3. **Dual Autonomy Modes:**
   - **Copilot Mode (Default):** Flags high-probability mispricings in a local SQLite review feed for 1-click manual execution.
   - **Autonomous Mode:** Executes orders automatically within hard daily drawdown circuit breakers ($50 stop-loss ceiling).
4. **Strict Non-Custodial Architecture (BYOK):** The agent never takes custody of exchange capital. Trading orders are submitted directly to Kalshi or Polymarket via user API keys. Software compute fees and Pro subscriptions are powered by **Dodo Payments**.
5. **Observability via neatlogs:** Fully instrumented across all workflow roots, agent decision loops, and external tool calls, with automated failure recovery proof traces.

---

## Empirical Validation: 60-Day Audited Backtest Replay

Replayed against historical WeatherNext ensemble members, Kalshi order book prices, and official NWS ground-truth resolutions across all 22 airport stations:

| Metric | **mone Agent** (WeatherNext + Rules) | **Market Consensus Baseline** | **Random Walk Baseline** |
| :--- | :---: | :---: | :---: |
| **Win Rate (%)** | **76.0%** | 91.5% | 18.4% |
| **Cumulative Realized PnL** | **+$291.88** | +$1,307.43 | -$811.56 |
| **Return on Capital (ROI)** | **+29.2%** | +130.7% | -81.2% |
| **Annualized Sharpe Ratio** | **5.41** | 20.21 | -10.30 |
| **Maximum Drawdown** | **4.5%** | 1.4% | 81.4% |
| **Brier Calibration Score** | **0.0762** *(Superior)* | 0.0884 | 0.2500 *(Uncalibrated)* |
| **Executed Trades Count** | **362** | 1,320 | 125 |

> 📌 **Why the Brier Score Matters:** WeatherNext achieved a **0.0762 Brier Score** vs the crowd's **0.0884**. The deterministic 75%/25% filter rejects uncertain contracts in the 25%–75% neutral zone, maintaining high payout asymmetry while strictly capping drawdown to **4.5%**.

---

## Architecture

```
                          ┌──────────────────────────────────────────────┐
                          │         Weather Ingestion Layer              │
                          ├──────────────────────┬───────────────────────┤
                          │  Google WeatherNext 3│  Open-Meteo WeatherNext│
                          │  BigQuery / GCS Zarr │  2 Ensemble (Fallback)│
                          └──────────┬───────────┴───────────┬───────────┘
                                     │                       │
                                     └───────────┬───────────┘
                                                 │
                                                 ▼
┌───────────────────────┐            ┌───────────────────────┐            ┌──────────────────────┐
│  Kalshi KXRAIN API    ├───────────►│ mone Quant Strategy   │◄───────────┤  Risk Guardrails     │
│  Live / Demo v2       │            │                       │            │  $50 Stop-Loss Cap   │
├───────────────────────┤            │ Model >75% -> Buy YES │            │  $10 / Trade Max     │
│  Polymarket Gamma/CLOB│            │ Model <25% -> Buy NO  │            └──────────────────────┘
└───────────────────────┘            │ Ask <$0.80 Safety Cap │
                                     └───────────┬───────────┘
                                                 │
                                                 ▼
                                     ┌───────────────────────┐
                                     │   Execution Engine    │
                                     ├───────────┬───────────┤
                                     │ Autonomous│  Copilot  │
                                     │ Auto-Exec │  1-Click  │
                                     └─────┬─────┴─────┬─────┘
                                           │           │
                                           ▼           ▼
                               ┌───────────────────────────────────┐
                               │     Telemetry & Observability     │
                               │     neatlogs Spans & Entire       │
                               └───────────────────────────────────┘
```

---

## Quickstart Guide

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/xcjohnmark/mone.git
cd mone

# Create virtual environment and install dependencies
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -e .
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your optional keys (defaults to zero-auth Open-Meteo & virtual Paper broker)
```

### 3. Verify Connections (System Doctor)

```bash
mone doctor
```

Output:
```
[*] Running system diagnostics...
[1] Observability (Neatlogs): Local span recorder active
[2] Weather Provider Engine:  [OK] openmeteo_weathernext2
[3] Market Venue Connector:   [OK] paper (Available Bal: $1,000.00)
[4] SQLite State Ledger:      [OK] Database initialized ($100.00 starting equity)
[+] Diagnostics complete.
```

### 4. Run Agent Cycles

```bash
# Run single cycle in Copilot mode (stages trades for review)
mone run --mode copilot

# View portfolio equity and staged signals
mone status

# Approve a staged trade (e.g. signal #9 in San Antonio)
mone approve 9

# Run continuously every hour
mone run --loop --interval 3600
```

### 5. Run Historical Backtest Replay

```bash
mone backtest --days 60
```
Generates `backtest_results.json` and a formatted `BACKTEST_AUDIT.md` report.

---

## 24/7 Cloud Running (Docker & AWS EC2)

Deploy to AWS EC2 in under 60 seconds using your $25 neatHack AWS credits:

```bash
docker compose up -d
```

The container starts the persistent SQLite ledger and exposes the REST companion API on port `8000`.

---

## neatHack Partner Evidence & Verification

### 1. The Agent Improved (neatlogs Benchmarking)
* **Sequential Baseline (Run A):** 12.76s latency (1.72 stations/sec) across 22 NWS hubs.
* **Concurrent Pipeline (Run B):** 1.84s latency (11.96 stations/sec) via thread pooling & vectorized edge evaluation.
* **Improvement:** **-10.92s latency reduction (85.6% faster, 6.93x speedup)**.
* **Artifact:** Verified in [`benchmark_improvement_report.json`](benchmark_improvement_report.json) via `python scripts/benchmark_optimization.py`.

### 2. neatlogs Observability & Failure Recovery
* **Native Span Taxonomy:** Decorated across workflow roots (`@workflow_span`), decision loops (`@agent_span`), and tool calls (`@tool_span`).
* **Active Ingestion:** Streaming to `https://ingest.neatlogs.com`.
* **Exported Telemetry Traces:**
  * Standard Trading Run: [`trace_exports/trading_cycle_trace.json`](trace_exports/trading_cycle_trace.json)
  * Self-Healing Failover Run: [`trace_exports/failure_recovery_trace.json`](trace_exports/failure_recovery_trace.json) (catches Google Cloud GCS 503 error, triggers Open-Meteo WeatherNext 2 fallback, and executes order with zero downtime).

### 3. Entire.io Architecture & Session Context
* **Checkpoints:** 9 synced checkpoints recorded on branch `main` using Entire CLI 0.11.4 with Antigravity and Claude Code hooks (`.entire/settings.json`, `.agents/hooks.json`).
* **Session ID:** `319545d9-be64-4fd6-a881-897f7eabc8ad`.
* **Architecture Graph:** Vector system diagram generated at [`docs/entire-graph.svg`](docs/entire-graph.svg).

### 4. cfo.ai Financial Business Model
* **Interactive cfo.ai Session:** [cfo.ai Workspace jahsfavour-cfoai-d694156f](https://app.cfo.ai/jahsfavour-cfoai-d694156f/chat/e56aaeb6-0d24-4f9d-8cd4-36c3f1593665).
* **Unit Economics:** Cost per user ~$4.80/mo (Cloud Zarr storage + BigQuery + serverless compute).
* **Gross Margin:** **89.8%** enabled by non-custodial BYOK architecture.
* **Runway:** **18 months** at $8,333/mo net burn rate on $150k pre-seed capital.
* **Document:** Comprehensive breakdown in [`cfo_business_plan.md`](cfo_business_plan.md).

### 5. 3-Minute Video Storyboard
* Complete screen-by-screen cues and word-for-word transcript timed to 2m45s in [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md).

---

## 22 Official NWS Airport Stations

mone evaluates the following official National Weather Service airport stations corresponding to Kalshi `KXRAIN`:
* **Atlanta (ATL):** `CLIATL` / `KATL`
* **Austin (AUS):** `CLIAUS` / `KAUS`
* **Boston (BOS):** `CLIBOS` / `KBOS`
* **Chicago (CHI):** `CLIORD` / `KORD`
* **Dallas (DAL):** `CLIDFW` / `KDFW`
* **Denver (DEN):** `CLIDEN` / `KDEN`
* **Houston (HOU):** `CLIHOU` / `KHOU`
* **Las Vegas (LV):** `CLILAS` / `KLAS`
* **Los Angeles (LAX):** `CLILAX` / `KLAX`
* **Miami (MIA):** `CLIMIA` / `KMIA`
* **Minneapolis (MIN):** `CLIMSP` / `KMSP`
* **Newark (EWR):** `CLIEWR` / `KEWR`
* **New Orleans (NOLA):** `CLIMSY` / `KMSY`
* **New York City (NYC):** `CLINYC` / `KNYC`
* **Oklahoma City (OKC):** `CLIOKC` / `KOKC`
* **Philadelphia (PHIL):** `CLIPHL` / `KPHL`
* **Phoenix (PHX):** `CLIPHX` / `KPHX`
* **San Antonio (SATX):** `CLISAT` / `KSAT`
* **San Francisco (SFO):** `CLISFO` / `KSFO`
* **Seattle (SEA):** `CLISEA` / `KSEA`
* **Trenton (TTN):** `CLITTN` / `KTTN`
* **Washington DC (DC):** `CLIDCA` / `KDCA`

---

## Roadmap: High Temperature Contracts

Following the hackathon, mone will expand beyond daily precipitation contracts to **Daily Maximum Temperature brackets** on Kalshi and Polymarket across Phoenix, Las Vegas, Dallas, and Miami using Gaussian temperature regression on WeatherNext 3 temperature ensembles.

---

## License

MIT License. Designed and built for the **#neatHack AI Agent Hackathon** (October 2026).
