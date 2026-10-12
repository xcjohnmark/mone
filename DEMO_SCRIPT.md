# neatHack Demo Video Script & Storyboard (`mone`)

**Target Duration:** 2 minutes 45 seconds (Strictly under 3:00 limit)  
**Tools to Display:** neatlogs dashboard, Entire checkpoints, cfo.ai business plan, live terminal agent, and web runner  
**Speaker:** You (Solo Presenter)

---

## Screen Setup Checklist Before Recording

* **Left Screen (50%):** Terminal open at `mone` directory.
* **Right Screen (50% with browser tabs):**
  * **Tab 1:** [mone Web Companion](http://localhost:3000) (Dashboard & CLI reference).
  * **Tab 2:** [neatlogs Web Dashboard](https://neatlogs.com/traces) (Trace waterfall view).
  * **Tab 3:** [cfo.ai Workspace](https://app.cfo.ai/jahsfavour-cfoai-d694156f/chat/e56aaeb6-0d24-4f9d-8cd4-36c3f1593665) (Financial canvas).
  * **Tab 4:** [GitHub Repo](https://github.com/xcjohnmark/mone) (Commit log & Entire checkpoints).

---

## Word-for-Word Video Script & Cues

### [0:00 – 0:30] Hook & Problem (30s)
> **[On Camera / Showing Web Companion Hero]:**  
> *"Hi everyone, I'm presenting **mone** for neatHack — an autonomous quantitative trading agent bridging Google DeepMind's WeatherNext ensemble models with prediction markets like Kalshi and Polymarket under a non-custodial Bring-Your-Own-Key architecture.*  
>  
> *Weather prediction contracts have exploded in volume on Kalshi, but 90% of retail participants trade on gut feeling or lagging consumer forecasts. Institutional models like Google WeatherNext provide extreme predictive power, but are trapped behind complex multidimensional cloud arrays. mone unlocks this edge directly for traders."*

---

### [0:30 – 1:15] Core Agent & Live Trading Execution (45s)
> **[Switch to Terminal on Left Screen]:**  
> *"Let's see mone in action. In the terminal, a trader has full non-custodial control. I can check our balance and margin:*  
>  
> *(Run: `mone balance`)*  
>  
> *Notice our cash balance, invested collateral, and our hard daily stop-loss circuit breaker. Now let's inspect the WeatherNext ensemble forecast for Miami:*  
>  
> *(Run: `mone forecast Miami`)*  
>  
> *WeatherNext evaluates 63 ensemble members, calculating an 85.7% rain probability and recommending 'BUY YES'. Now let's place a trade directly from the CLI:*  
>  
> *(Run: `mone trade SATX --capital 15 --side YES`)*  
>  
> *Instantly, mone verifies risk limits, sizes the contracts, submits the limit order to Kalshi Demo, and updates our SQLite ledger with zero human intervention."*

---

### [1:15 – 1:45] Observability & Failure Recovery with neatlogs (30s)
> **[Switch to neatlogs Browser Tab]:**  
> *"To ensure enterprise-grade reliability, mone is natively instrumented with **neatlogs**. Every trading cycle emits a full waterfall:*  
>  
> *Root workflow $\rightarrow$ settlement check $\rightarrow$ weather ingest $\rightarrow$ quant edge evaluation $\rightarrow$ broker execution.*  
>  
> *(Show failure recovery trace or run `python scripts/demo_failure_recovery.py`):*  
> *Here is our self-healing failure recovery in action. When primary Google Cloud Zarr storage encounters a 503 timeout, mone catches the exception, fires an alert span to neatlogs, automatically fails over to Open-Meteo WeatherNext 2, and completes order execution with zero downtime."*

---

### [1:45 – 2:15] Code Context with Entire & The Agent Improved (30s)
> **[Switch to Entire Terminal / GitHub]:**  
> *"Throughout the hackathon, we used **Entire** for continuous code context and checkpointing:*  
>  
> *(Run: `entire recap` or show GitHub checkpoints)*  
>  
> *Entire recorded our prompts, sessions, and code diffs across every architectural milestone.  
>  
> *To prove **'The agent improved'**, we benchmarked our engine:*  
> *Unoptimized sequential polling took 12.76 seconds. By refactoring to concurrent thread pooling and vectorized math, we slashed latency to 1.84 seconds — an **85.6% latency reduction** and a **6.9x speedup** verified in `benchmark_improvement_report.json`."*

---

### [2:15 – 2:40] Business Model & Unit Economics with cfo.ai (25s)
> **[Switch to cfo.ai Browser Tab]:**  
> *"To turn mone into a sustainable business, we modeled its economics on **cfo.ai**:  
>  
> *Because mone is non-custodial BYOK, we don't take exchange risk. We offer a 7-Day Free Trial, followed by $10 activity passes for 100 runs, $25 passes for 300 runs, and a $49/mo Pro subscription.  
>  
> *Our infrastructure cost per user is under $4.80/month, yielding a massive **89.8% gross margin** and an **18-month runway** on an initial $150,000 budget."*

---

### [2:40 – 2:45] Outro & Wrap Up (5s)
> **[Back to Web Companion or Camera]:**  
> *"mone is open source, thoroughly tested with 34 passing unit tests, and fully production ready. Thank you to neatlogs, Entire, and cfo.ai!"*
