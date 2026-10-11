# neatHack Judging Criteria & Execution Playbook (`mone`)

This document is your tactical roadmap to score 100/100 across all 5 judging categories and satisfy all 7 evidence verification checks for **neatHack** (October 10–12, 2026).

---

## Master Overview: Categories, Weights & Scoring Formula

```
┌────────────────────────────────────────────────────────────────────────┐
│                      neatHack Final Score (100%)                       │
├───────────────────┬─────────┬──────────────────────┬───────────────────┤
│ Category          │ Weight  │ Primary Deliverable  │ Verification Type │
├───────────────────┼─────────┼──────────────────────┼───────────────────┤
│ The Agent         │ 30%     │ Autonomous Pipeline  │ Live Run & Code   │
│ Partner Tools     │ 25%     │ neatlogs, Entire, CFO│ Traces, Graph, Doc│
│ Demo Video        │ 20%     │ <= 3 min walkthrough │ Loom / YouTube    │
│ Building in Public│ 15%     │ Social progress logs │ Posts (#neatHack) │
│ Originality & Use │ 10%     │ WeatherNext + Kalshi │ Architecture Spec │
└───────────────────┴─────────┴──────────────────────┴───────────────────┘
```

---

## 1. Category: The Agent (30% Weight)

### What the Judge Considers a Success
* The agent executes a non-trivial, multi-stage task from start to finish without human intervention.
* It exhibits sound decision-making: ingests data, evaluates statistical edge, applies risk limits, and executes.
* It does not crash on edge cases or API errors; instead, it catches issues, explains its rationale, and either recovers or gracefully safe-halts.

### What the Agent (Coding Assistant) Will Ensure First
* **End-to-End Execution Pipeline (`mone/agent.py`):**
  * Automated cycle: pulls WeatherNext forecasts $\rightarrow$ scans Kalshi and Polymarket order books $\rightarrow$ computes statistical mispricing edge $\rightarrow$ validates against risk guardrails $\rightarrow$ executes paper/live order.
* **Dual Operation Modes:**
  * `--mode autonomous`: Full hands-off algorithmic execution.
  * `--mode copilot`: Stages flagged opportunities for 1-click human review.
* **Capital & Risk Guardrails (`mone/risk/`):**
  * Hard daily drawdown cap ($50 max loss default).
  * Maximum entry ask ceiling ($0.80 max) to prevent negative risk-reward entries.
* **Self-Contained Verification Command:**
  * A single command `python -m mone run --dry-run` that runs cleanly out of the box with zero setup hurdles.

### Your Step-by-Step Guide (What You Do)
* [ ] **Verify Local Environment:**
  * Run `python -m mone run --dry-run` in your terminal.
  * Verify that the terminal logs show all stages completing: Weather $\rightarrow$ Market $\rightarrow$ Edge $\rightarrow$ Risk $\rightarrow$ Order.
* [ ] **Capture Execution Screenshots / Terminal Recordings:**
  * Take a clean screenshot of the terminal summary table showing:
    * Station ID (e.g., `CLIORD` - Chicago O'Hare)
    * WeatherNext ensemble rain probability vs. Kalshi market-implied odds
    * Edge percentage (e.g., `+22.4%`)
    * Final trade status (`SUBMITTED` or `STAGED_COPILOT`).
* [ ] **Save Screenshot to Docs:**
  * Save the screenshot to `docs/screenshots/agent_autonomous_run.png` for inclusion in `README.md`.

---

## 2. Category: Use of Partner Tools — neatlogs, Entire, and cfo.ai (25% Weight)

This category tests your depth of integration across the three hackathon sponsors.

---

### 2A. Integration: neatlogs (Telemetry & Observability)

#### What the Judge Considers a Success
* Clean trace trees showing nested spans (`WORKFLOW` $\rightarrow$ `AGENT` $\rightarrow$ `TOOL`).
* Clear metadata on spans (inputs, outputs, model probabilities, market quotes, execution latency).
* Observable trace links and dashboard screenshots that prove live usage during the hackathon.

#### What the Agent (Coding Assistant) Will Ensure First
* **Native `@neatlogs.span` Instrumentation:**
  * Instrument every module with proper span taxonomy:
    * `mone_trading_cycle` (Kind: `WORKFLOW`)
    * `fetch_weathernext_forecast` (Kind: `TOOL`)
    * `scan_prediction_markets` (Kind: `TOOL`)
    * `calculate_edge_and_sizing` (Kind: `TOOL`)
    * `execute_order_safely` (Kind: `TOOL`)
* **Graceful Telemetry Fallback:**
  * If `NEATLOGS_API_KEY` is not provided, the agent logs telemetry locally to `data/telemetry_trace.json` and prints console traces so execution never breaks.
* **Trace Export Utility:**
  * Provide `scripts/generate_neatlogs_trace.py` to trigger a clean, fully traced cycle on demand.

#### Your Step-by-Step Guide (What You Do)
* [ ] **Get API Key from neatlogs:**
  * Log into [neatlogs.com](https://neatlogs.com) and copy your API key.
  * Add it to `.env`: `NEATLOGS_API_KEY=your_key_here`.
* [ ] **Generate the Live Traces:**
  * Run: `python scripts/generate_neatlogs_trace.py`.
* [ ] **Extract Trace Links & Screenshots:**
  * Open the neatlogs web dashboard.
  * Copy the public or viewable URLs for your run traces.
  * Take 2 clear screenshots:
    1. Full workflow waterfall showing nested spans.
    2. Detailed tool span inspecting inputs (forecast) and outputs (order placement).
  * Save them to `docs/screenshots/neatlogs_trace_overview.png` and `docs/screenshots/neatlogs_span_detail.png`.

---

### 2B. Integration: Entire (Repository Architecture & Graph Context)

#### What the Judge Considers a Success
* Demonstrated usage of Entire CLI checkpoints linking prompts/sessions to commits.
* Repository dependency and architecture visualization generated via `entire-graph`.

#### What the Agent (Coding Assistant) Will Ensure First
* **Architectural Modularity:**
  * Clear package boundaries (`mone/providers`, `mone/markets`, `mone/strategy`, `mone/risk`) that render cleanly in dependency graphs.
* **Entire Configuration & Manifest:**
  * Generate `.entire/config.yaml` or relevant Entire repository manifest tracking agent session context.
* **Pre-rendered Architecture Graph:**
  * Generate `docs/entire-graph.svg` and a matching Mermaid graph in `README.md` and `hackathon.md` so judges can see the graph immediately even if viewing on GitHub.

#### Your Step-by-Step Guide (What You Do)
* [ ] **Install Entire CLI:**
  * Follow installation for your terminal (e.g. `curl -fsSL https://entire.io/install.sh | bash` or PowerShell equivalent from [entire.io](https://entire.io)).
  * Confirm installation: `entire --version`.
* [ ] **Create Checkpoints During Build:**
  * Run checkpoints before major git pushes:
    ```bash
    entire checkpoint -m "feat(agent): dual weather provider with failover"
    entire checkpoint -m "feat(observability): neatlogs span instrumentation"
    ```
* [ ] **Export the Graph:**
  * Run: `entire graph --output docs/entire-graph.png` (or take a screenshot from the entire.io web dashboard if using cloud sync).
  * Check that `docs/entire-graph.png` is committed to the repo.

---

### 2C. Integration: cfo.ai (Financial Modeling & Unit Economics)

#### What the Judge Considers a Success
* A defensible business plan specifically built around the agent:
  * Pricing model (SaaS + volume compute fuel).
  * Infrastructure costs (API costs, cloud compute, storage).
  * Revenue projections and gross margins.
  * Calculated runway (Base Case vs. Downside stress case) covering 18+ months.

#### What the Agent (Coding Assistant) Will Ensure First
* **Complete Business Model Document (`CFO_BUSINESS_PLAN.md`):**
  * Full breakdown with formulas and numbers:
    * **Pricing:** Tier 1 Free Paper ($0), Tier 2 Pro ($49/mo + 0.1% volume compute fee), Tier 3 Fund/API ($299/mo).
    * **Cost Structure:** Google Cloud Zarr storage ($12/mo), BigQuery queries ($28/mo), Open-Meteo fallback ($0), Serverless execution ($15/mo) = Total COGS per user: ~$4.80/mo.
    * **Unit Economics:** 89.8% gross margin (enabled by non-custodial BYOK architecture).
    * **Runway Modeling:** $150,000 pre-seed balance; Base case 18 months runway at $8,333/mo net burn rate; Downside stress test modeled.

#### Your Step-by-Step Guide (What You Do)
* [ ] **Log into cfo.ai:**
  * Navigate to [cfo.ai](https://cfo.ai) and create a project/workspace named `mone`.
* [ ] **Input Financial Parameters from `CFO_BUSINESS_PLAN.md`:**
  * Enter the revenue tiers ($49/mo Pro, $299/mo Fund).
  * Enter monthly expense lines (Cloud/API compute, hosting, team burn).
  * Generate the scenario model (Base vs. Downside runway).
* [ ] **Export & Link:**
  * Export the cfo.ai canvas/summary as a PDF or image (`docs/cfo_ai_financial_plan.pdf` / `.png`).
  * Add the public share link from cfo.ai directly into `hackathon.md` and `README.md`.

---

## 3. Category: Demo Video (20% Weight)

### What the Judge Considers a Success
* Video length strictly **under 3 minutes** (judges have dozens to review; over 3 mins gets penalized).
* High signal-to-noise ratio: shows real working software, not just slide decks.
* Clearly demonstrates the core agent, neatlogs tracing, Entire checkpointing, and cfo.ai business plan.

### What the Agent (Coding Assistant) Will Ensure First
* **Automated Demo Script (`scripts/demo_quickstart.py`):**
  * One single command that runs a visually impressive CLI walkthrough with colorful tables, live progress bars, neatlogs trace links, and instant summary metrics.
* **Exact Video Storyboard & Script (`DEMO_SCRIPT.md`):**
  * Word-for-word transcript and screen-by-screen cues timed to 2 minutes 45 seconds.

### Your Step-by-Step Guide (What You Do)
* [ ] **Prepare Your Screen Setup:**
  * Window 1 (Left half): Terminal ready with `python scripts/demo_quickstart.py`.
  * Window 2 (Right half, tabbed):
    * Tab 1: neatlogs dashboard showing live trace waterfall.
    * Tab 2: Entire.io commit/graph page.
    * Tab 3: cfo.ai financial summary canvas.
* [ ] **Record Using Loom or OBS (Target: 2m30s – 2m50s):**
  * **[0:00 - 0:30] Hook & Problem:** Explain the gap between weather forecasting AI and prediction market liquidity.
  * **[0:30 - 1:15] Live Agent Execution:** Run `demo_quickstart.py`. Show WeatherNext probability vs. Kalshi market price, edge calculation, and automated order execution.
  * **[1:15 - 1:45] Failure Recovery in Action:** Show Google Cloud failover to Open-Meteo with self-healing neatlogs span.
  * **[1:45 - 2:15] Sponsor Verification:** Quick tour of neatlogs trace waterfall + Entire graph.
  * **[2:15 - 2:40] cfo.ai Business Model:** Show the 89.8% gross margin, $49/mo BYOK model, and 18-month runway.
  * **[2:40 - 2:55] Conclusion:** Mention open-source repo, clean commit history, and wrap up.
* [ ] **Upload & Verify Permissions:**
  * Upload to Loom or unlisted YouTube.
  * Verify link plays without login in an Incognito window.
  * Paste link in `README.md` and `hackathon.md`.

---

## 4. Category: Building in Public (15% Weight)

### What the Judge Considers a Success
* Consistent updates posted on public social media (primarily X / Twitter) during the hackathon.
* All posts tagged with `#neatHack` and tagging relevant accounts (`@neatlogs`, `@cfo_ai`, etc.).
* Meaningful progress shown: architecture diagrams, terminal output, trace screenshots, milestones.

### What the Agent (Coding Assistant) Will Ensure First
* **Visual Artifacts Ready for Social Media:**
  * Clean terminal screenshots formatted for social sharing.
  * ASCII / SVG architecture diagrams ready to copy-paste.
  * Pre-written tweet copy for each milestone.

### Your Step-by-Step Guide (What You Do)
* [ ] **Post 1: Project Kickoff & Architecture (Send Day 1 / Mid-Hackathon):**
  * *Text:*
    > "Building mone for #neatHack ⚡
    > 
    > An autonomous quantitative agent bridging @Google's WeatherNext 3 ensemble AI with prediction markets (@Kalshi). 
    > 
    > Full observability instrumented with @neatlogs + session tracking with @entire_io.
    > 
    > [Attach: Architecture diagram or terminal screenshot]"
* [ ] **Post 2: Self-Healing & Telemetry Milestone (Send Day 2):**
  * *Text:*
    > "Zero-downtime AI agent engineering for #neatHack 🛡️
    > 
    > If Google Cloud Zarr arrays timeout, mone catches the exception, switches to Open-Meteo WeatherNext 2, and completes trade execution without human intervention.
    > 
    > Fully visible in @neatlogs trace waterfall!
    > 
    > [Attach: neatlogs recovery trace screenshot]"
* [ ] **Post 3: Business Model & Final Submission (Send at Submission Time):**
  * *Text:*
    > "mone is ready for submission at #neatHack! 🚀
    > 
    > 🌦️ Autonomous WeatherNext 3 -> Kalshi quant trading
    > 📊 Observability via @neatlogs
    > 🗺️ Repo graph by @entire_io
    > 💼 Business model on @cfo_ai: 89.8% gross margin, 18mo runway
    > 
    > 📹 Demo: [Your Video Link]
    > 💻 Repo: https://github.com/xcjohnmark/mone
    > 
    > Quote-tweet neatlogs official hackathon announcement!"
* [ ] **Log Post URLs:**
  * Copy links to all 3 posts and paste them under `## Building in Public Links` in `hackathon.md` and `README.md`.

---

## 5. Category: Usefulness and Originality (10% Weight)

### What the Judge Considers a Success
* Solves an actual problem rather than building a generic toy wrapper.
* Clear market positioning: explains why this agent is uniquely valuable and differentiated.

### What the Agent (Coding Assistant) Will Ensure First
* **High-Conviction Problem Framing:**
  * Documented in `hackathon.md` and `README.md`:
    * *Problem:* Kalshi weather volumes are surging, but 90% of retail participants trade on gut feeling, while institutional AI weather models (WeatherNext) are locked behind complex cloud multidimensional arrays.
    * *Solution:* mone democratizes institutional weather quants via non-custodial BYOK execution.
* **Algorithmic Edge Implementation:**
  * Deterministic Kelly sizing and threshold rules (`edge > 15%`, `entry_ask < 0.80`), mathematically grounded rather than random LLM prompting.

### Your Step-by-Step Guide (What You Do)
* [ ] Highlight this contrast clearly during the first 30 seconds of your demo video and in the first two paragraphs of `README.md`.

---

## 6. The 7 Specific Evidence & Verification Requirements Checklist

Use this table as your final pre-flight checklist before submitting:

| # | Evidence Requirement | What the Agent Delivers in Code | What You Do to Verify | Completed? |
| :- | :--- | :--- | :--- | :---: |
| **1** | **The agent improved** | `scripts/benchmark_optimization.py` comparing unoptimized sequential scanning vs. parallel batching. | Run benchmark, copy neatlogs trace IDs (Run A vs Run B), record the numbers in `README.md` (e.g. 12.4s $\rightarrow$ 1.8s). | [ ] |
| **2** | **You used neatlogs** | `@neatlogs.span` decorators across all tools and agent orchestrators. | Run agent, open neatlogs web dashboard, copy public trace URLs, take screenshots. | [ ] |
| **3** | **You used Entire** | Structured repo modules, `.entire/` configs, pre-rendered `entire-graph.svg`. | Run `entire checkpoint` and `entire graph`, add graph screenshot/file to repo. | [ ] |
| **4** | **You used cfo.ai** | `CFO_BUSINESS_PLAN.md` with full unit economics, SaaS pricing, and 18-month runway. | Input figures into cfo.ai, export canvas PDF/PNG, paste public link into submission. | [ ] |
| **5** | **The agent recovers from failures** | `scripts/demo_failure_recovery.py` simulating GCS API timeout and automated Open-Meteo fallback. | Run failure demo script, capture neatlogs trace showing the `RECOVERED` span, take screenshot. | [ ] |
| **6** | **You built in public** | Social copy templates, screenshot assets, milestone markers. | Publish 2–3 posts on X tagging `#neatHack`, copy URLs into `hackathon.md`. | [ ] |
| **7** | **Code written during hackathon** | Atomic, clean git commits timestamped Oct 10–12, 2026. | Ensure local git date is accurate, push all commits to public GitHub repo. | [ ] |

---

## Summary of Next Steps

1. **Step 1 (Agent):** Implement the core agent package, dual-provider failover, and neatlogs spans.
2. **Step 2 (Agent):** Generate the benchmark comparison script (`benchmark_optimization.py`) and failure recovery demo (`demo_failure_recovery.py`).
3. **Step 3 (Agent):** Write `CFO_BUSINESS_PLAN.md` and the 3-minute video storyboard `DEMO_SCRIPT.md`.
4. **Step 4 (You):** Run the scripts, capture neatlogs trace URLs/screenshots, enter data into cfo.ai, record the 3-min Loom, and publish the `#neatHack` social posts.
