# mone — Website Build Plan

## 1. Vision & Design Philosophy

The **mone** website is designed to be functional, fast, and minimalist. Rather than marketing fluff, it delivers immediate utility:
1. **Zero-Friction In-Hero Onboarding:** Users can configure their agent or grab the CLI snippet directly in the hero section without navigating away.
2. **Audited Transparency:** Highlights backtested quantitative performance (win rates, equity curves, Brier calibration) upfront to establish trust.
3. **Live Market Pulse:** Displays real-time WeatherNext ensemble probabilities against live prediction market odds with actionable edge indicators.
4. **Dedicated Non-Custodial Control Center (`/agent`):** Provides a clean, real-time dashboard for web users to monitor predictions, approve staged trades (in Copilot mode), and track agent portfolio PnL.

---

## 2. Tech Stack & Architecture

* **Framework:** Next.js 15 (App Router, Server Components + Client Islands).
* **Styling & Design System:** Tailwind CSS with a clean, high-density dark aesthetic (slate/zinc neutrals, subtle border accents, tabular numerals for financial figures).
* **Icons:** `lucide-react`.
* **State & Data Layer:** React Server Actions + API route handlers (`/api/agent`, `/api/markets`, `/api/backtest`) connecting to local SQLite and Python agent endpoints.

---

## 3. Page Structure & Component Breakdown

```
src/
├── app/
│   ├── page.tsx                      <-- Public Single-Page Landing & Quick Setup
│   ├── agent/
│   │   └── page.tsx                  <-- Authenticated Control Dashboard & Portfolio
│   ├── layout.tsx                    <-- Root layout (fonts, metadata, dark theme)
│   └── api/
│       ├── markets/route.ts          <-- Live market quotes proxy
│       ├── agent/route.ts            <-- Agent status & cycle triggers
│       └── backtest/route.ts         <-- Historical backtest data endpoint
│
├── components/
│   ├── landing/
│   │   ├── HeroSetup.tsx             <-- In-hero CLI snippet & web configurator
│   │   ├── BacktestShowcase.tsx      <-- Audited accuracy metrics & equity chart
│   │   ├── LiveMarketSignal.tsx      <-- Real-time WeatherNext vs Market ticker
│   │   ├── MultiAgentRoadmap.tsx     <-- High Temperature Agent teaser
│   │   └── FAQSection.tsx            <-- Frequently asked questions
│   │
│   ├── agent/
│   │   ├── AgentControlStrip.tsx     <-- Run status, Autonomy vs Copilot switch
│   │   ├── SignalsFeed.tsx           <-- Active predictions & 1-click trade approval
│   │   ├── TradePortfolio.tsx        <-- Agent trade history & realized PnL ledger
│   │   ├── SettingsModal.tsx         <-- BYOK key management & risk customization
│   │   └── NeatlogsStatus.tsx        <-- Execution latency & trace viewer badge
│   │
│   └── ui/                           <-- Minimalist primitives (cards, badges, modals)
```

---

## 4. Screen-by-Screen Specifications

### Screen A: Public Single-Page Landing (`/`)

#### 1. In-Hero Agent Setup Section
* **Header & Tagline:**
  ```
  mone — Quantitative Weather Intelligence for Prediction Markets
  Autonomous agents powered by Google WeatherNext ensembles.
  ```
* **Interactive Setup Box (Embedded in Hero):**
  * Two-tab toggle:
    * **Tab 1: Terminal / CLI Users:** Copyable installation snippet:
      ```bash
      pip install -U mone-agent && python -m mone run --venue kalshi_demo
      ```
    * **Tab 2: Web Runner (No Terminal Needed):**
      * Weather Model Dropdown: `WeatherNext 3 (Google Cloud)` or `WeatherNext 2 (Free Open-Meteo)`.
      * Venue Selector: `Kalshi Demo (Free)`, `Kalshi Live`, or `Polymarket`.
      * Autonomy Selector: `Autonomous (Hands-Off)` or `Copilot (Review First)`.
      * Action Button: `[Launch Agent Dashboard →]`.

#### 2. Backtest & Accuracy Showcase
* **Performance Summary Grid:**
  * **85.2%** Historical Win Rate (60-day audited backtest).
  * **+48.2%** Cumulative Realized Return on Capital.
  * **2.34** Sharpe Ratio.
  * **0.089** Brier Calibration Score.
* **Benchmark Comparison:**
  * Visual bar comparing **mone Strategy** (+48.2%) vs. **Market Consensus Following** (-4.1%) vs. **Random Guessing** (-18.6%).

#### 3. Live Market & Real-Time Signal Preview
* High-density table featuring live prediction contracts:
  * **Columns:** City, Station Code, Kalshi YES Ask, WeatherNext 63-Member Prob, Computed Edge, Agent Signal.
  * **Sample Row:**
    * `Denver (CLIDEN)` | Ask: 66¢ | Model: 98.4% | Edge: +32.4% | Badge: `BUY YES (HIGH CONVICTION)`
    * `New York (CLINYC)` | Ask: 1¢ | Model: 0.0% | Edge: -1.0% | Badge: `NO TRADE (LOW ROI)`

#### 4. Multi-Agent Roadmap Teaser
* Clean minimalist card:
  * **High Temperature Market Agent (Coming Soon):** Expanding from precipitation to extreme heat records and daily temperature brackets (`KXHIGH` on Kalshi and Polymarket heat events).

#### 5. FAQ Section & Footer CTA
* Explains BYOK non-custodial architecture, why funds are never held by mone, and how neatlogs ensures full trace accountability.

---

### Screen B: Authenticated User Dashboard (`/agent`)

#### 1. Agent Control Strip
* **Status Pill:** `RUNNING (CYCLE ACTIVE)` with live heartbeat indicator.
* **Autonomy Mode Switcher:**
  * `[Autonomous Mode]`: Agent executes immediately when edge criteria are met.
  * `[Copilot Mode]`: Agent sends desktop/email notification and stages trade for 1-click user confirmation.
* **Cycle Trigger Button:** `[Scan Markets Now]`.

#### 2. Signals & Live Predictions Feed
* Displays all active weather contracts evaluated in the current 24-hour cycle.
* Each card includes:
  * City name and official NWS station code.
  * WeatherNext ensemble member distribution chart (e.g. 61 of 63 members forecasting rain $\ge 0.01"$).
  * Market implied odds vs. calculated quant edge.
  * **Copilot Action:** `[Approve Trade ($10.00)]` button (disabled if already executed).

#### 3. Agent Trade Portfolio Ledger
* Strictly tracks trades executed by the agent (not personal wallet holdings):
  * **Summary Strip:** Total Capital Deployed, Active Positions, Realized PnL, Win Rate.
  * **Historical Table:** Date, City, Direction (YES/NO), Contracts, Entry Price, Payout, Gain/Loss, Resolution.

#### 4. Customization & Settings Panel
* **BYOK Credentials Vault:**
  * Google Cloud Project / Service Account (for WeatherNext 3).
  * Kalshi Live / Demo API credentials.
  * Polymarket CLOB keys.
* **Risk Parameters:**
  * Fixed position size ($10.00 default).
  * Daily stop-loss cap ($50.00 default).
  * Confidence threshold cutoff (75% default).

#### 5. neatlogs System Observability Badge
* Direct link to recent execution trace in neatlogs.
* Shows cycle execution latency (e.g., `Cycle completed in 1.42s · 4 spans · $0.002 compute cost`).

---

## 5. Design System & Minimalist UI Guidelines

* **Color Palette:**
  * Background: `#09090b` (Deep Obsidian / Zinc 950).
  * Surface Cards: `#18181b` (Zinc 900) with subtle borders `#27272a` (Zinc 800).
  * Accents: Emerald `#10b981` (Profitable Edge / Win), Rose `#f43f5e` (Loss / Circuit Breaker), Sky `#0284c7` (WeatherNext predictions).
* **Typography:** Clean sans-serif with monospace accents (`font-mono`) and `tabular-nums` for all odds, timestamps, and dollar amounts.
* **Interaction Polish:** Fast, optimistic UI updates with sub-150ms feedback on all toggles.
