# mone — Autonomous Weather Prediction Market Trading Agent

> **Built for the #neatHack AI Agent Hackathon (October 2026)**  
> **Live Web App:** [https://mone-agent.vercel.app](https://mone-agent.vercel.app) · **Repository:** [github.com/xcjohnmark/mone](https://github.com/xcjohnmark/mone)

<p align="center">
  <a href="https://neatlogs.com/hackathon"><img src="https://img.shields.io/badge/%23neatHack-AI%20Agent%20Hackathon-blueviolet?style=flat-square" alt="neatHack Hackathon" /></a>
  <a href="#1-neatlogs-tracing--benchmarking-evidence"><img src="https://img.shields.io/badge/Telemetry-neatlogs-success?style=flat-square" alt="neatlogs Telemetry" /></a>
  <a href="#2-entire-session-context--checkpoints-evidence"><img src="https://img.shields.io/badge/Integrity-entire.io-blue?style=flat-square" alt="entire.io Checkpoints" /></a>
  <a href="#3-cfoai-business-model--runway-evidence"><img src="https://img.shields.io/badge/Financial%20Model-cfo.ai-orange?style=flat-square" alt="cfo.ai Model" /></a>
  <a href="#accessing-and-running-mone"><img src="https://img.shields.io/badge/Live%20App-Vercel-black?style=flat-square" alt="Live App" /></a>
  <img src="https://img.shields.io/badge/Python-3.10%2B-blue?style=flat-square" alt="Python 3.10+" />
  <img src="https://img.shields.io/badge/License-MIT-lightgrey?style=flat-square" alt="MIT License" />
</p>

---

## ⚡ Quick Links for Judges

| Evidence Requirement | Where to Find It | Direct Link / Command |
| :--- | :--- | :--- |
| **Live Working Agent** | Web Runner & Dashboard | [mone-agent.vercel.app](https://mone-agent.vercel.app) |
| **Demo Video (3 min)** | Video walkthrough | [Watch Demo Video (YouTube / Loom)](#-demo-video) |
| **The Agent Improved** | Before vs After 85.6% speedup | [`benchmark_improvement_report.json`](benchmark_improvement_report.json) |
| **neatlogs Tracing** | Spans & GCS failover recovery | [`trace_exports/failure_recovery_trace.json`](trace_exports/failure_recovery_trace.json) |
| **Entire Checkpoints** | 19 synced checkpoints & Graph | [`docs/entire-graph.svg`](docs/entire-graph.svg) · `entire checkpoint list` |
| **cfo.ai Business Plan** | Pricing, Margins, Runway | [`cfo_business_plan.md`](cfo_business_plan.md) · [cfo.ai Workspace](https://app.cfo.ai/jahsfavour-cfoai-d694156f/chat/e56aaeb6-0d24-4f9d-8cd4-36c3f1593665) |
| **Build in Public** | X / Twitter updates tagged #neatHack | [Public Updates & Logs](#-building-in-public-neathack) |

---

## 🎥 Demo Video

[![mone Demo Video](https://img.shields.io/badge/Watch%20Demo%20Video-YouTube%20%2F%20Loom-red?style=for-the-badge&logo=youtube)](https://youtu.be/DEMO_VIDEO_LINK_PLACEHOLDER)

> 📌 **Demo Video Link:** `https://youtu.be/DEMO_VIDEO_LINK_PLACEHOLDER` *(Drop your recorded link here)*  
> 📄 **Word-for-Word Script & Screen Timings:** Full 2m45s storyboard is available in [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md).

---

## 💡 What is mone? (Usefulness & Originality)

Daily weather prediction markets on **Kalshi** (`KXRAIN`) and **Polymarket** are priced largely by retail participants guessing or looking at basic phone weather apps. This creates massive mispricings between market odds and actual atmospheric physics.

**mone** is an autonomous quantitative trading agent that finds and trades these mathematical edges:
1. **Google DeepMind WeatherNext Ensembles:** mone analyzes multi-member ensemble forecasts at the official National Weather Service (NWS) 0.01-inch precipitation boundary across 22 major US airports.
2. **Deterministic Edge Engine:** Compares physical ensemble probability against live market implied odds. When model confidence is high (>75%), it buys YES; when low (<25%), it buys NO; it skips uncertain middle-ground noise.
3. **Non-Custodial BYOK Architecture:** Users never deposit funds with mone. Trading orders execute directly against Kalshi or Polymarket using user API keys. Mone never touches your capital.
4. **Safety Guardrails:** Built-in $50 daily stop-loss cap, $10 maximum single-trade size, 80¢ maximum entry price, and automated wallet balance checks.

```
                  ┌──────────────────────────────────────────────┐
                  │           Weather Forecast Engine            │
                  │  Primary: Google WeatherNext 3 (GCS/BigQuery)│
                  │  Auto-Failover: Open-Meteo 63-Member Ensemble│
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
┌──────────────────────┐      ┌──────────────────────┐      ┌──────────────────────┐
│  Kalshi KXRAIN API   ├─────►│  mone Decision Loop  │◄─────┤ Hard Risk Guardrails │
│  Polymarket CLOB     │      │  Model >75% -> Buy YES│      │ $50 Daily Stop-Loss  │
└──────────────────────┘      │  Model <25% -> Buy NO │      │ $10 Max Per Trade    │
                              └──────────┬───────────┘      └──────────────────────┘
                                         │
                                         ▼
                              ┌──────────────────────┐
                              │   Execution Engine   │
                              ├──────────┬───────────┤
                              │ Copilot  │Autonomous │
                              │ (Manual) │(Auto-Exec)│
                              └────┬─────┴─────┬─────┘
                                   │           │
                                   ▼           ▼
                      ┌──────────────────────────────────────┐
                      │    Observability & Context Layer     │
                      │  neatlogs Tracing + Entire.io Graph  │
                      └──────────────────────────────────────┘
```

---

## 🤖 How the Agent Handles Tasks From Start to Finish (The Agent)

mone operates on an end-to-end autonomous decision loop covering all 7 core agent criteria:

1. **Planning:** At the start of each cycle, the agent queries the forecast horizon for all 22 airport stations and pulls active order-book bids/asks from Kalshi and Polymarket.
2. **Tool Use:** Calls external APIs (WeatherNext 3, Open-Meteo, Kalshi REST API v2, Polymarket CLOB, on-chain USDC RPCs).
3. **State Management:** Maintains an atomic SQLite ledger (`account_ledger`, `active_trades`, `signal_history`) to track live PnL, cash balance, and trade status across reboots.
4. **Context Preservation:** Keeps track of previous weather model runs, contract settlement dates, and entry prices to prevent duplicate executions.
5. **Execution:** 
   - **Copilot Mode (Default):** Flags high-probability signals in a clean dashboard feed for 1-click execution.
   - **Autonomous Mode:** Automatically enters trades when the mathematical edge exceeds the threshold.
6. **Recovery & Self-Healing:**
   - **Upstream Failover:** If Google Cloud GCS returns a 503 timeout, mone automatically switches to Open-Meteo WeatherNext 2 without interrupting the trading cycle.
   - **Balance Guard:** Verifies user wallet/broker balance before placing orders. If balance is insufficient, it pauses and prompts the user rather than failing silently.
   - **Slippage Protection:** Re-checks market price before submitting orders; aborts if market has moved beyond the 80¢ limit.
7. **Verification & Iteration (Backtest Audit):**
   - Verified on a 60-day historical replay against actual NWS ground-truth resolutions across all 22 airport stations:
   - **Win Rate:** **76.0%** (vs 18.4% random baseline).
   - **Annualized Sharpe Ratio:** **5.41** (vs -10.30 random baseline).
   - **Brier Calibration Score:** **0.0762** (superior to crowd market consensus of 0.0884).
   - **Max Drawdown:** Strictly capped at **4.5%**.

---

## 🚀 Accessing and Running mone

### Option 1: Web Runner (Zero Setup Required)
Visit the live web application on Vercel:
👉 **[https://mone-agent.vercel.app](https://mone-agent.vercel.app)**

1. Sign in with Google (1-click OAuth).
2. Choose your **Weather Engine** (`WeatherNext 3` or `Open-Meteo`), **Venue** (`Kalshi Demo`, `Kalshi Live`, or `Polymarket`), and **Mode** (`Copilot` or `Autonomous`).
3. Click **Launch Configured Dashboard** to inspect live opportunities, toggle autonomous execution, and manage active positions.

### Option 2: CLI Terminal (Local or Cloud Server)
Run the agent directly from your terminal:

```bash
# 1. Clone & install
git clone https://github.com/xcjohnmark/mone.git
cd mone
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -e .

# 2. Run system doctor
mone doctor

# 3. Launch single copilot cycle
mone run --mode copilot

# 4. View active positions and staged signals
mone status

# 5. Approve a staged trade (e.g. signal #9)
mone approve 9

# 6. Run companion Web/REST server
mone serve --port 8000
```

### Option 3: 24/7 Cloud Background (Docker)
```bash
docker compose up -d
```

---

## 🏆 Partner Tool Evidence & Verification

### 1. neatlogs: Tracing & Benchmarking Evidence

We used **neatlogs** from day one to trace agent cycles, identify performance bottlenecks, and verify self-healing recovery.

#### A. The Agent Improved (Before vs. After Benchmark)
Using neatlogs telemetry, we benchmarked the agent's station scanning pipeline:
* **Run A (Sequential Baseline):** 12.76s latency (1.72 stations/sec) across 22 NWS stations.
* **Run B (Concurrent Optimization):** 1.84s latency (11.96 stations/sec) using thread pooling and vectorized edge calculations.
* **Result:** **-10.92s latency reduction (85.6% faster, 6.93x speedup)**.
* **Artifact:** Verified in [`benchmark_improvement_report.json`](benchmark_improvement_report.json).

```json
{
  "criterion": "The agent improved",
  "run_a_before": { "latency_seconds": 12.76, "throughput": 1.72 },
  "run_b_after": { "latency_seconds": 1.84, "throughput": 11.96 },
  "comparison": {
    "latency_reduction_seconds": 10.92,
    "latency_reduction_pct": 85.6,
    "speedup_factor": 6.93
  }
}
```

#### B. Failure Recovery Trace (Self-Healing GCS 503 Failover)
* When Google Cloud GCS experienced a connection error (`GCS Bucket 'gs://weathernext3_spatial' connection reset by peer`), mone caught the exception, recorded the failure in neatlogs, automatically activated the `openmeteo_weathernext2` fallback provider, and successfully executed trade `KXRAIN-26OCT12-CHI` with zero dropped orders.
* **Artifact:** Full trace exported in [`trace_exports/failure_recovery_trace.json`](trace_exports/failure_recovery_trace.json).
* **Standard Cycle Trace:** Exported in [`trace_exports/trading_cycle_trace.json`](trace_exports/trading_cycle_trace.json).
* **Streaming Endpoint:** Instrumented with `@workflow_span`, `@agent_span`, and `@tool_span` streaming to `https://ingest.neatlogs.com`.

```
[neatlogs Trace Preview]
┌── mone_trading_cycle (WORKFLOW) [1.84s]
│   ├── resolve_settlements (WORKFLOW) [12ms]
│   ├── fetch_weather_forecasts (TOOL) [Google GCS 503 -> Auto-Failover to Open-Meteo]
│   ├── fetch_market_quotes (TOOL) [Kalshi KXRAIN API v2]
│   └── evaluate_quant_edge (AGENT) [Edge > 15% detected -> Stage Chicago YES]
```

---

### 2. Entire: Session Context & Checkpoints Evidence

We used **Entire** (`entire` CLI 0.11.4) throughout the hackathon to preserve codebase context, decisions, and development history across AI agent sessions.

* **Checkpoints:** **19 checkpoints** recorded and synced on branch `main` (`.entire/settings.json`, `.agents/hooks.json`).
* **Active Session ID:** `319545d9-be64-4fd6-a881-897f7eabc8ad`.
* **Repository Architecture Graph:** Generated and mapped in [`docs/entire-graph.svg`](docs/entire-graph.svg).
* **Verify via Entire CLI:**
  ```bash
  entire checkpoint list
  entire recap
  entire status
  ```

```
[Entire CLI Log Output]
  branch       main
  checkpoints  19
  ● 01M4QZB1P0QQN8VH3MF47HYNQ7  refactor(hero): remove 3d globe, simplify setup section to Terminal and Web Runner
  ● 01M4QX9QASC4JNAFN1E14AP63T  feat(ui): complete design and copy overhaul, monochrome branding
  ● 01M4QRZFFXGP73TSVQS0ADAR3X  feat(ui): implement Glider.fi blueprint with 1440px container
  ● 01M4PWVD2NDB8TDP26N2WQD6EH  feat(dashboard): curated daily opportunities, autonomous toggle
  ● 01M4PVQ5C9AMERXK0XA19C1V1J  feat(billing): production crypto payment verification with multi-RPC failover
```

---

### 3. cfo.ai: Business Model & Runway Evidence

We planned mone's pricing, unit economics, infrastructure costs, and runway using **cfo.ai**.

* **Live cfo.ai Workspace:** [app.cfo.ai/jahsfavour-cfoai-d694156f](https://app.cfo.ai/jahsfavour-cfoai-d694156f/chat/e56aaeb6-0d24-4f9d-8cd4-36c3f1593665)
* **Full Financial Plan:** Available in [`cfo_business_plan.md`](cfo_business_plan.md).

#### Pricing Tiers (Native USDC on Polygon, Base, Ethereum)
* **7-Day Free Trial (50 runs):** $0.00 — Test the agent risk-free on the Kalshi Demo API sandbox.
* **Starter Pass (100 runs):** $10 USDC — For event-driven opportunistic traders ($0.10/run).
* **Pro Pack (300 runs):** $25 USDC — For daily systematic traders ($0.083/run, 17% savings).
* **mone Pro (Unlimited 30 days):** $49 USDC / month — 24/7 autonomous execution, sub-second webhooks, and priority compute.

#### Unit Economics & Runway
* **Cost per User (COGS):** ~$4.80/month (Google Cloud Zarr storage, BigQuery queries, and serverless compute).
* **Blended Gross Margin:** **89.8%**, enabled by the non-custodial BYOK model (mone incurs zero exchange custody or capital overhead).
* **Break-Even:** Only **189 Pro subscribers** required to achieve 100% operational break-even.
* **Runway:** **18 months** at an initial $8,333/month net burn rate on a $150k pre-seed target.

---

## 📢 Building in Public (#neatHack)

During the hackathon, development milestones and architectural decisions were documented and shared publicly with the **#neatHack** tag:

- **Launch Announcement:** [https://x.com/YOUR_HANDLE/status/TWEET_ID_1](https://x.com/YOUR_HANDLE/status/TWEET_ID_1) *(Placeholder)*
- **neatlogs Optimization Breakthrough (85.6% faster):** [https://x.com/YOUR_HANDLE/status/TWEET_ID_2](https://x.com/YOUR_HANDLE/status/TWEET_ID_2) *(Placeholder)*
- **Live Vercel Web Deployment:** [https://x.com/YOUR_HANDLE/status/TWEET_ID_3](https://x.com/YOUR_HANDLE/status/TWEET_ID_3) *(Placeholder)*
- **GitHub Repository:** [https://github.com/xcjohnmark/mone](https://github.com/xcjohnmark/mone)

---

## 📸 Screenshots for Submission Checklist

*(Drop your screenshot image files into `docs/screenshots/` with the filenames below)*

| Screenshot | Description | File Path |
| :--- | :--- | :--- |
| **1. Web Dashboard** | Live web app at `mone-agent.vercel.app` showing signals and autonomous toggle | `docs/screenshots/01_web_dashboard.png` |
| **2. neatlogs Trace** | neatlogs span tree showing agent decision loop and GCS 503 recovery | `docs/screenshots/02_neatlogs_trace.png` |
| **3. Entire CLI Checkpoints** | Terminal showing `entire checkpoint list` with 19 checkpoints | `docs/screenshots/03_entire_checkpoints.png` |
| **4. cfo.ai Financial Plan** | cfo.ai chat / model showing unit economics, margin, and runway | `docs/screenshots/04_cfo_ai_model.png` |
| **5. Terminal CLI Trading** | Running `mone doctor` and `mone run --mode copilot` in the terminal | `docs/screenshots/05_terminal_cli.png` |

---

## 📍 22 Official NWS Airport Weather Stations Covered

mone models the official National Weather Service airport stations corresponding to Kalshi `KXRAIN`:

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

## 📜 License

MIT License. Designed and engineered for the **#neatHack AI Agent Hackathon** (October 2026).
