# mone — Financial Model & Business Plan
**cfo.ai Workspace Session:** [jahsfavour-cfoai-d694156f](https://app.cfo.ai/jahsfavour-cfoai-d694156f/chat/e56aaeb6-0d24-4f9d-8cd4-36c3f1593665)  
**Author:** Jahsfavour (xcjohnmark)  
**Date:** October 2026 (#neatHack Hackathon)  
**Platform Architecture:** Non-Custodial Bring-Your-Own-Key (BYOK) AI Agent  

---

## Executive Summary

**mone** is an autonomous quantitative trading agent bridging Google DeepMind WeatherNext ensemble forecasting with prediction markets (Kalshi KXRAIN daily precipitation contracts and Polymarket).

Unlike traditional hedge funds or custodial trading bots that take custody of user deposits and charge 2/20 management and performance cuts, **mone operates on a 100% Non-Custodial Bring-Your-Own-Key (BYOK) architecture**. Traders retain full custody of their exchange capital and run the agent either locally via the standalone Python CLI (`mone-agent`) or continuously via the cloud companion (`mone-web`).

Revenue is generated purely through software compute capacity and analytical tooling passes:
1. **7-Day Free Trial (50 Runs):** Every new user receives 50 complimentary trading runs on the **Kalshi Demo API v2** sandbox to test the agent with zero financial risk.
2. **$10 Starter Pass (100 Runs):** On-demand execution pass for opportunistic event-driven traders ($0.10/run).
3. **$25 Trader Pass (300 Runs):** Multi-market execution pass for systematic daily traders ($0.083/run, 17% savings).
4. **$49 / Month Pro Subscription:** Unlimited 24/7 autonomous execution, sub-second Kalshi order-book streaming, Telegram/Discord webhooks, and historical backtest audits.

With an average infrastructure cost of **$0.012 per 60-second execution cycle**, mone achieves a **blended gross margin of 84.8%** and requires only **189 Pro subscribers** to achieve 100% fixed operating break-even.

---

## 1. Product Pricing Plans & Technical Architecture Tie-In

Every pricing tier corresponds directly to specific agent features, execution frequencies, and risk configurations:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        mone Product & Pricing Architecture                             │
├──────────────────┬─────────────┬───────────────────────────────┬───────────────────────┤
│ Tier / Plan      │ Price       │ Technical Agent Capabilities  │ Target User Persona   │
├──────────────────┼─────────────┼───────────────────────────────┼───────────────────────┤
│ 7-Day Free Trial │ $0.00       │ 50 runs on Kalshi Demo API v2 │ New signups testing   │
│ (All Signups)    │ (7 Days)    │ Full 22-station WeatherNext   │ ensemble accuracy     │
├──────────────────┼─────────────┼───────────────────────────────┼───────────────────────┤
│ Starter Pass     │ $10.00      │ 100 trade execution cycles    │ Event-driven trader   │
│ (Pay-As-You-Go)  │ one-time    │ CLI & Web Copilot mode        │ (Storms / Rain spikes)│
├──────────────────┼─────────────┼───────────────────────────────┼───────────────────────┤
│ Trader Pass      │ $25.00      │ 300 trade execution cycles    │ Daily active quant    │
│ (Pay-As-You-Go)  │ one-time    │ Multi-station batch scanning  │ (Portfolio manager)   │
├──────────────────┼─────────────┼───────────────────────────────┼───────────────────────┤
│ Pro Subscription │ $49.00 / mo │ Unlimited 24/7 autonomous run │ Algorithmic operator  │
│ (SaaS Recurring) │ recurring   │ Docker/EC2 cloud daemon, webhooks│ (Continuous trader)│
└──────────────────┴─────────────┴───────────────────────────────┴───────────────────────┘
```

### Detailed Feature & System Mapping:

#### A. 7-Day Free Trial (50 Runs — $0.00)
* **Technical Enforcement:** Configured via `web/src/context/AuthContext.tsx` upon Google OAuth signup.
* **Sandbox Environment:** Exclusively restricted to **Kalshi Demo API v2** (`https://demo-api.kalshi.com/trade-api/v2`). Internal synthetic paper mocks are disabled to ensure users experience realistic market depth, slippage, and API order latency.
* **Risk & Capacity Guardrail:** Compute usage is strictly capped at 50 execution runs ($0.60 subsidized compute cost per trial), protecting platform infrastructure from unmetered automated scraping.

#### B. $10 Starter Pass (100 Trade Runs)
* **Technical Enforcement:** Credited to user SQLite ledger (`account_ledger`) and authenticated via user API bearer token.
* **Workflow Tie-In:** Ideal for traders executing targeted single-market commands from the terminal:
  ```bash
  mone forecast Miami
  mone trade MIA --capital 15 --side YES
  ```
* **Longevity:** 100 runs provides ~3 months of active event-driven trading for users targeting high-conviction weather anomalies (e.g. hurricanes in Houston, atmospheric rivers in Seattle).

#### C. $25 Trader Pass (300 Trade Runs)
* **Technical Enforcement:** Unlocks automated batch station scanning across all 22 official NWS airport terminals:
  ```bash
  mone scan
  mone signals
  mone trade 14
  ```
* **Workflow Tie-In:** Enables Copilot traders to monitor all 22 airport weather markets daily and cherry-pick the top 3–5 mispriced contracts.
* **Value Metric:** Reduces per-run execution cost from $0.10 to $0.083 (17% savings).

#### D. $49 / Month Pro Subscription
* **Technical Enforcement:** Unlocks 24/7 autonomous loop mode (`mone run --mode autonomous --loop --interval 3600`) and the companion cloud Docker container (`docker-compose.yml`).
* **Advanced Features:**
  * Sub-second Kalshi WebSocket order book streaming.
  * Real-time trade notifications to Telegram and Discord webhooks.
  * Replay backtesting engine across 90 historical days (`mone backtest --days 90`).
  * Automated settlement resolution against NOAA/NWS official climate reports.

---

## 2. Unit Economics & Traceable Cost of Goods Sold (COGS)

Because mone uses a non-custodial BYOK model, **mone carries zero exchange capital risk and zero market risk**. 

| Product Tier | Retail Price | AWS Execution Compute ($0.012/run) | Payment Gateway Fee (2.9% + 30¢) | Total Unit COGS | Gross Profit | Gross Margin (%) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **100 Runs Pass** | $10.00 | $1.20 (100 runs) | $0.59 | $1.79 | $8.21 | **82.1%** |
| **300 Runs Pass** | $25.00 | $3.60 (300 runs) | $1.03 | $4.63 | $20.37 | **81.5%** |
| **Pro Subscription** | $49.00 / mo | $4.80 (~400 runs avg) | $1.72 | $6.52 | $42.48 | **86.7%** |

### Breakdown of Cost Drivers:
1. **Weather Ingestion Invariant ($0.00 Cost to Platform):**
   * Open-Meteo WeatherNext 2 is a publicly available, zero-auth 63-member ensemble REST API.
   * Google WeatherNext 3 BigQuery and GCS Zarr queries are billed directly to the user’s personal Google Cloud project via their BYOK service account credentials.
2. **Execution Runner Compute ($0.012 per 60s Run):**
   * Benchmarked on AWS Lambda / t4g.small ARM64 container instances running Python 3.12 with vectorized NumPy edge evaluations.
   * A single full 22-station scan and risk validation cycle completes in **1.84 seconds** (verified via `benchmark_improvement_report.json`).
3. **Payment Processing:**
   * Handled via **Dodo Payments** (hackathon partner) and native multi-chain USDC (Polygon, Base, Solana). Blended payment processing rate is modeled conservatively at 2.9% + $0.30.
4. **Blended Paid Gross Margin:** **84.8%**.

---

## 3. 12-Month Projections & Financial Milestones

Every figure reconciles deterministically against customer cohort acquisition rates:

$$\text{Monthly Revenue} = (N_{100} \times \$10) + (N_{300} \times \$25) + (N_{\text{Pro}} \times \$49)$$

| Financial Metric | Q1 (Launch) | Q2 (Expansion) | Q3 (Multi-Asset) | Q4 (Scale) |
| :--- | :---: | :---: | :---: | :---: |
| **Monthly Active Traders (MAU)** | 250 | 1,200 | 4,500 | 12,000 |
| **New 7-Day Free Trials / mo** | 1,500 | 7,200 | 25,000 | 65,000 |
| **Trial-to-Paid Conversion Rate** | 20.0% | 22.2% | 23.2% | 24.8% |
| **Pro Subscribers ($49/mo)** | 40 | 250 | 1,100 | 3,200 |
| **$10 Passes Sold / mo** | 200 | 1,050 | 3,500 | 9,600 |
| **$25 Passes Sold / mo** | 60 | 300 | 1,200 | 3,360 |
| **Total Paid Transactions / mo** | 300 | 1,600 | 5,800 | 16,160 |
| **Pro Subscription Revenue** | $1,960 | $12,250 | $53,900 | $156,800 |
| **Pass Revenue ($10 + $25)** | $3,500 | $18,000 | $65,000 | $180,000 |
| **Total Monthly Gross Billings** | **$5,460** | **$30,250** | **$118,900** | **$336,800** |
| **Annualized Run Rate (ARR)** | **$65,520** | **$363,000** | **$1,426,800** | **$4,041,600** |
| **Direct Paid Product COGS** | $897 | $4,896 | $18,294 | $51,878 |
| **Free Trial Subsidized Compute** | $900 | $4,320 | $15,000 | $39,000 |
| **Total Monthly COGS** | **$1,797** | **$9,216** | **$33,294** | **$90,878** |
| **Gross Margin (% incl. Trial Subsidy)**| **67.1%** | **69.5%** | **72.0%** | **73.0%** |
| **Fixed Monthly Operating Expense** | $8,330 | $14,500 | $28,000 | $52,000 |
| **Monthly Net Operating Income** | **-$4,667** | **+$6,534** | **+$57,606** | **+$193,922** |

---

## 4. 7-Day Free Trial Funnel & Customer Acquisition Economics

To eliminate buyer hesitation, every new signup receives a **7-Day Free Trial**:

### A. Trial Allowance & Unit Economics
* Each trial trader receives **50 free runs** on the Kalshi Demo environment.
* 50 runs $\times$ $0.012 = **$0.60 trial compute cost per signup**.

### B. Conversion Funnel (Q1 Initial Cohort)
* **Monthly New Signups:** 1,500 traders.
* **Trial Compute Subsidy:** 1,500 $\times$ $0.60 = **$900.00 / month**.
* **Cohort Conversion Breakdown:**
  * 40 users convert to **Pro ($49/mo)** $\to$ 2.67%
  * 200 users purchase **$10 Pass** $\to$ 13.33%
  * 60 users purchase **$25 Pass** $\to$ 4.00%
  * **Total Converting to Paid:** 300 users (**20.0% overall conversion rate**).

### C. Customer Acquisition Cost (CAC) vs. Lifetime Value (LTV)
* **Blended CAC Target:**
  $$\text{Blended CAC} = \frac{\text{Content \& Dev Advocacy (\$3,450)} + \text{Trial Compute Subsidy (\$900)}}{300 \text{ converted customers}} = \mathbf{\$14.50}$$
* **Customer Lifetime Value (LTV):**
  * Average Pass User LTV: 3.2 passes over 6 months = $48.00 gross $\times$ 82% margin = **$39.36**.
  * Average Pro Subscriber LTV: 5.8 months retention $\times$ $49/mo = $284.20 gross $\times$ 86.7% margin = **$246.40**.
  * **Blended Cohort LTV:** **$74.50**.
  * **LTV / CAC Ratio:** $\frac{\$74.50}{\$14.50} = \mathbf{5.14\times}$ (Healthy venture-scale unit economics).

---

## 5. Cash Runway & Stress-Test Scenarios

Initial pre-seed capital reserve: **$150,000**.

$$\text{Net Monthly Burn} = (\text{Fixed OpEx} + \text{COGS}) - \text{Gross Billings}$$

| Scenario | Monthly Fixed OpEx | Revenue Realization | Peak Monthly Net Burn | Break-Even Month | Effective Cash Runway |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Base Case (Target)** | $8,330 / mo | 100% of plan | -$4,667 / mo (Month 1) | **Month 5** | **Self-Sustaining** (Cash trough: $129.8k) |
| **Downside Stress Case** | $7,500 / mo | 40% of plan (delayed) | -$6,780 / mo | **Month 14** | **22.1 Months** ($150k / $6.78k net burn) |

### Key Resilience Factors:
1. **Zero Collateral Liability:** Because mone is non-custodial, the platform never holds customer funds, eliminating regulatory capital reserves, FDIC insurance, or custody risk.
2. **Elastic Variable Compute:** If user signups drop, cloud runner compute expense scales down simultaneously.
3. **Low Break-Even Threshold:** Only **189 Pro subscribers** or **920 Pass sales** are required to cover 100% of monthly fixed OpEx ($8,330).

---

## 6. Strategic Pricing & Product Architecture Decisions

### Decision 1: Kalshi Demo as the Exclusive Testing Environment
* **Choice:** Deprecated internal synthetic paper mocks in favor of **Kalshi Demo API v2**.
* **Rationale:** Synthetic paper execution fails to model real-world market depth, order queue priority, or API latency. Kalshi Demo executes against simulated order books using real market tickers (KXRAIN), giving users an exact preview of live performance.

### Decision 2: No Permanent Free Tier — 7-Day Free Trial Funnel
* **Choice:** mone does **not** offer an uncapped permanent free tier.
* **Rationale:** Providing an uncapped free tier creates an open-ended compute liability ($0.012/run). The 7-day trial provides ample time for traders to observe WeatherNext ensemble predictions across an entire weekly weather cycle, validating mone's audited 76% win rate before converting.

### Decision 3: Rejection of Conditional "Pay-per-Correct-Signal" Performance Fees
* **Choice:** Explicitly rejected taking a percentage cut of winning trades in favor of transparent software passes.
* **Rationale:**
  1. **Regulatory Classification (CFTC/SEC):** Charging a cut of profitable trades classifies the platform as a Commodity Trading Advisor (CTA) or investment manager subject to fiduciary registration, audits, and performance fee restrictions. Charging for compute, signals, and execution software maintains clean 100% Non-Custodial SaaS status.
  2. **Asynchronous NOAA Settlement Lag:** Weather contracts settle 24–48 hours after close when NOAA/NWS posts official daily climate data. Debiting user balances days after execution creates negative balance risks, customer confusion, and elevated Dodo Payments chargeback exposure.
  3. **Simplicity & Conversion:** Traders strongly prefer transparent, upfront pricing ($10 / $25 / $49) over variable retrospective escrow deductions.

---

## 7. Interactive cfo.ai (Ari) Prompt Specification

To verify and populate this model in Ari's calculation engine at [cfo.ai Chat](https://app.cfo.ai/jahsfavour-cfoai-d694156f/chat/e56aaeb6-0d24-4f9d-8cd4-36c3f1593665), paste the following structured prompt:

```text
Ari, please build the verified financial model for mone using the following exact parameters:

1. Business Model & Platform:
   - Product: Autonomous AI trading agent bridging Google WeatherNext 3 with Kalshi/Polymarket
   - Architecture: 100% Non-Custodial Bring-Your-Own-Key (BYOK) SaaS and Compute Passes

2. Products & Pricing:
   - Starter Pass (100 Runs): $10.00 (COGS: $1.79 = $1.20 compute + $0.59 payment fee)
   - Trader Pass (300 Runs): $25.00 (COGS: $4.63 = $3.60 compute + $1.03 payment fee)
   - Pro Subscription: $49.00 / month (COGS: $6.52 = $4.80 compute + $1.72 payment fee)

3. 7-Day Free Trial Funnel:
   - 7-day free trial granting 50 runs on Kalshi Demo (Trial compute cost = $0.60 per signup)
   - 1,500 new trials/month in Q1, converting at 20% (40 Pro, 200 $10 passes, 60 $25 passes)

4. Quarterly Milestones (Monthly run rates):
   - Q1: 40 Pro ($1,960) + 200 $10 passes ($2,000) + 60 $25 passes ($1,500) = $5,460 gross revenue
   - Q2: 250 Pro ($12,250) + 1,050 $10 passes ($10,500) + 300 $25 passes ($7,500) = $30,250 gross revenue
   - Q3: 1,100 Pro ($53,900) + 3,500 $10 passes ($35,000) + 1,200 $25 passes ($30,000) = $118,900 gross revenue
   - Q4: 3,200 Pro ($156,800) + 9,600 $10 passes ($96,000) + 3,360 $25 passes ($84,000) = $336,800 gross revenue

5. Fixed OpEx & Cash:
   - Starting Cash: $150,000
   - Monthly Fixed OpEx: $8,330 base ($7,500 in downside)
   - Compute cost per run: $0.012

Please calculate and verify the exact deterministic gross margins, break-even month, and cash runway across the Base Case and Downside Stress Case.
```
