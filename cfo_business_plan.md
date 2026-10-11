# mone — CFO.ai Financial Model & Business Plan
**Hackathon Financial Model Link:** [cfo.ai Session jahsfavour-cfoai-d694156f](https://app.cfo.ai/jahsfavour-cfoai-d694156f/chat/e56aaeb6-0d24-4f9d-8cd4-36c3f1593665)  
**Author:** xcjohnmark  
**Date:** October 2026 (#neatHack Hackathon)  

---

## Executive Summary

**mone** is an autonomous quantitative trading agent that bridges Google DeepMind WeatherNext ensemble forecasting with prediction markets (Kalshi KXRAIN and Polymarket).

Unlike traditional algorithmic hedge funds that take custody of user funds and charge 2/20 management fees, **mone operates on a 100% Non-Custodial Bring-Your-Own-Key (BYOK) architecture**. Users retain full custody of their exchange wallets and trading balances. 

Revenue is generated purely through:
1. **Runner Compute Fuel Credits** ($10 and $25 packs for cloud runner executions).
2. **mone Pro SaaS Subscriptions** ($49/month for unlimited autonomous cloud runner executions, priority order-book polling, and Telegram webhooks).

All payments are processed via **Dodo Payments** (hackathon partner).

---

## 1. Unit Economics & Gross Margin (88% Gross Margin)

| Revenue Stream | Unit Price | COGS per Unit (Inference + Server + Bandwidth) | Gross Profit | Gross Margin (%) |
| :--- | :---: | :---: | :---: | :---: |
| **Fuel Pack A (100 Cycles)** | $10.00 | $1.20 | $8.80 | **88.0%** |
| **Fuel Pack B (300 Cycles)** | $25.00 | $3.00 | $22.00 | **88.0%** |
| **Pro SaaS (Monthly)** | $49.00 / mo | $5.88 / mo | $43.12 / mo | **88.0%** |

### Breakdown of Cost of Goods Sold (COGS)
* **Open-Meteo Ensemble Ingestion:** $0.00 (Zero-cost, public REST API).
* **WeatherNext 3 BigQuery Queries:** Billed directly to user's Google Cloud project (BYOK).
* **AWS EC2 / Lambda Runner Compute:** ~$0.012 per 60-second cycle (using $25 neatHack AWS credits).
* **Dodo Payments Processing Fee:** 2.9% + 30¢.

---

## 2. 12-Month Financial Projections (cfo.ai Modeled)

| Metric | Q1 (Launch) | Q2 (Expansion) | Q3 (Multi-Asset) | Q4 (Scale) |
| :--- | :---: | :---: | :---: | :---: |
| **Active Traders (MAU)** | 250 | 1,200 | 4,500 | 12,000 |
| **Pro Subscribers ($49/mo)** | 40 | 250 | 1,100 | 3,200 |
| **Fuel Packs Sold / mo** | 350 | 1,800 | 6,500 | 18,000 |
| **Monthly Gross Revenue** | **$5,460** | **$30,250** | **$118,900** | **$336,800** |
| **Annualized Run Rate (ARR)** | $65,520 | $363,000 | $1,426,800 | **$4,041,600** |
| **Net Operating Margin** | **68%** | **74%** | **79%** | **82%** |

---

## 3. Cash Runway & Scenario Analysis (cfo.ai Modeled)

To verify financial resilience, the model was stress-tested across two scenarios assuming an initial pre-seed cash reserve of **$150,000**:

```
Formula: Runway (Months) = Current Cash Balance / Net Monthly Cash Burn
Net Monthly Cash Burn = (Monthly Fixed OpEx + Variable COGS) - Gross Billings
```

| Scenario | Monthly Fixed OpEx | Revenue Realization | Peak Monthly Net Burn | Break-Even Month | Effective Runway |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Base Case (Target)** | $8,330 / mo | 100% of plan | -$4,800 / mo (M1) | **Month 5** | **Self-Sustaining** (Cash trough: $128.4k) |
| **Downside Stress Case**| $7,500 / mo | 40% of plan (delayed) | -$6,950 / mo | **Month 14** | **21.6 Months** ($150k / $6.95k net burn) |

### Runway Resilience Factors
1. **Zero Custodial Liability:** Because users bring their own API keys, mone holds no customer balances, eliminating insurance and escrow reserve capital requirements.
2. **Elastic Variable COGS:** Compute costs scale strictly with active user runs ($0.012/cycle); if volume drops, runner expenses drop concurrently.
3. **High Gross Margins (88%):** Each new Pro subscriber ($49/mo) nets $43.12 in gross profit, requiring only **193 Pro Subscribers** to fully cover corporate fixed operating expenses.

---

## 4. Customer Acquisition & Market Opportunity

### Target Market Verticals
1. **Prediction Market Traders (Polymarket & Kalshi):** Over $3.2B in annualized prediction volume. Traders currently trade weather contracts manually on gut feel or standard weather apps that do not compute ensemble member votes.
2. **Crypto & Prop Trading Quants:** Seeking non-correlated alpha strategies that don't depend on Bitcoin or macro equity markets.
3. **Agri-Business & Energy Hedgers:** Regional agricultural businesses seeking micro-hedges against airport precipitation records without institutional ISDA contracts.

### Customer Acquisition Strategy (CAC Target: <$18)
* **Open Source GitHub Flywheel:** `mone-agent` CLI is open source on GitHub.
* **Neatlogs Observability Dashboard:** Live public trace links showcasing audited 76%+ win rates.
* **Loom Demos & X (Twitter) Bot:** Hourly automated signals tweeted with edge calculations.

---

## 4. Regulatory & Non-Custodial Compliance Invariant

Because mone is purely software:
* **Zero Exchange Custody:** The agent never touches, stores, or withdraws user trading capital.
* **Direct Execution:** Orders are submitted directly from the user's environment to Kalshi (CFTC-regulated) or Polymarket via their private API keys.
* **No Money Transmitter Licensing (MTL):** Software runner fees and SaaS subscriptions fall squarely under standard B2B/B2C SaaS tax treatment.
