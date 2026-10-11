# mone — Backtesting Plan & Historical Validation

## 1. Executive Summary & Purpose

Before risking real capital or asking users to trust **mone** with autonomous execution, the agent must be rigorously backtested. 

This backtesting plan defines the methodology to:
1. Replay the agent's deterministic quant strategy across **30 to 90 days** of historical weather and market data.
2. Verify statistical edge and model calibration across the 22 target NWS airport weather stations.
3. Quantify expected returns, win rates, maximum drawdown, and risk-adjusted metrics (Sharpe ratio and Brier calibration score).
4. Package the backtest results as interactive proof on the website to inspire user trust and satisfy hackathon judging standards.

---

## 2. Historical Datasets & Sources

The backtest relies on two synchronized historical data feeds:

### A. Meteorological Ground Truth & Forecast Replays
1. **Model Forecast Archive (WeatherNext Ensembles):**
   * Sourced from the Open-Meteo Historical Ensemble Archive and Google Cloud Storage historical Zarr partitions (`2024/` and `2025/`).
   * Fetches the 63/64-member precipitation forecasts generated at 00:00 UTC for each target date across the 22 NWS station coordinates.
2. **Official NWS Station Resolutions (Ground Truth):**
   * Sourced from NOAA National Weather Service (NWS) Daily Climate Reports (`CLI` products, e.g. `CLIORD` for O'Hare, `CLINYC` for Central Park).
   * Exact binary resolution rule: Did official station precipitation reach $\ge 0.01$ inches ($0.25$ mm) during the local calendar day?

### B. Prediction Market Historical Pricing
1. **Kalshi Settled Weather Markets (`KXRAIN`):**
   * Ingested via Kalshi API historical endpoints (`GET /events/{event_ticker}` and `/markets?status=settled`).
   * Extracts historical closing ask/bid prices, volume, and final settlement payout ($1.00 for YES, $0.00 for NO).
2. **Polymarket Settled Weather Events:**
   * Ingested via the Polymarket Gamma API for resolved precipitation markets.
   * Extracts token resolution prices ($1.00 vs $0.00) and closing order-book asks.

---

## 3. Backtesting Methodology & Strategy Rules

For each historical date $t$ and each city station $s \in \{1 \dots 22\}$:

1. **Step 1: Compute Model Probability**
   $$\hat{P}_{\text{rain}} = \frac{1}{N} \sum_{i=1}^{N} \mathbb{I}(\text{Member}_i \ge 0.25\text{ mm})$$
2. **Step 2: Compare Against Historical Market Price**
   * Identify market implied probability: $P_{\text{market}} = \text{Ask}_{\text{YES}}$
   * Compute quantitative edge: $\text{Edge} = \hat{P}_{\text{rain}} - P_{\text{market}}$
3. **Step 3: Apply Deterministic Entry Filters**
   * **Long YES:** $\hat{P}_{\text{rain}} > 0.75$ AND $\text{Ask}_{\text{YES}} < 0.80$
   * **Long NO:** $\hat{P}_{\text{rain}} < 0.25$ AND $\text{Ask}_{\text{NO}} < 0.80$
   * **Filter:** If $0.25 \le \hat{P}_{\text{rain}} \le 0.75$ OR $\text{Ask} \ge 0.80$, **NO TRADE**.
4. **Step 4: Position Sizing & Capital Allocation**
   * Fixed allocation: $\$10.00$ per qualified opportunity.
   * Slippage assumption: Realistic execution at market ask $+ 1$¢.
5. **Step 5: Settlement & PnL Accounting**
   * If contract resolves YES:
     $$\text{Payout} = \text{Contracts} \times \$1.00$$
     $$\text{PnL} = \text{Payout} - \text{Invested Capital} - \text{Fees}$$
   * If contract resolves NO:
     $$\text{PnL} = -\text{Invested Capital}$$

---

## 4. Key Performance Indicators (KPIs)

The backtest outputs a comprehensive report evaluating:

| Metric | Target Benchmark | Formula / Definition |
| :--- | :---: | :--- |
| **Win Rate** | **$\ge 80\%$** | $\frac{\text{Winning Trades}}{\text{Total Executed Trades}}$ |
| **Brier Score** | **$< 0.12$** | $\frac{1}{N}\sum (\hat{P}_i - O_i)^2$ (Measures probability calibration; lower is better) |
| **Profit Factor** | **$\ge 2.50$** | $\frac{\text{Gross Realized Profits}}{\text{Gross Realized Losses}}$ |
| **Sharpe Ratio** | **$\ge 1.80$** | Risk-adjusted return annualized over the backtest duration |
| **Max Drawdown (MDD)** | **$\le 15\%$** | Maximum peak-to-trough decline in portfolio equity |
| **Return on Capital (ROC)** | **$\ge 35\%$** | $\frac{\text{Net Realized PnL}}{\text{Starting Bankroll}}$ |

---

## 5. Benchmark Comparisons

To demonstrate authentic quantitative edge, the report benchmarks mone against three standard baselines:

1. **Baseline A: Naive Climatology**
   * Betting based purely on the 30-year historical average rainfall rate for each city on that date.
2. **Baseline B: Market Consensus Following**
   * Always betting with the crowd (buying whatever has implied probability $> 50\%$).
3. **Baseline C: Random Allocation (Monte Carlo 50/50)**
   * Randomly selecting YES/NO with equivalent fixed capital across all active markets.

---

## 6. Implementation Architecture

### File Layout
```
mone/
└── mone/
    └── backtest/
        ├── __init__.py
        ├── data_loader.py    <-- Ingests historical weather & market data
        ├── engine.py         <-- Simulation runner & event loop
        ├── metrics.py        <-- Win rate, Sharpe, Brier score, drawdown calculators
        └── report.py         <-- Generates Markdown, JSON, and Web chart outputs
```

### CLI Command
```bash
# Run a 60-day backtest across all 22 Kalshi stations
python -m mone backtest --days 60 --venue kalshi

# Output sample:
# ====================================================================
#                      mone Backtest Summary Report
# ====================================================================
# Period: 2026-08-12 to 2026-10-10 (60 Days)
# Stations Evaluated: 22 NWS Airport Stations
# Total Available Weather Markets: 1,320
# Total Filtered Opportunities: 142 (10.8% selective trade rate)
#
# Trade Performance:
# • Winning Trades: 121
# • Losing Trades: 21
# • Win Rate: 85.2%
# • Starting Capital: $1,000.00
# • Ending Equity: $1,482.40 (+48.24% Net Return)
# • Max Drawdown: 7.4%
# • Sharpe Ratio: 2.34
# • Brier Score: 0.089 (High Calibration)
# ====================================================================
```

---

## 7. Website Integration

The backtest results will be serialized to `backtest_results.json` and rendered directly on the public website:
* **Interactive Equity Curve:** Day-by-day cumulative PnL progression.
* **Win Rate Gauge:** Visual 85%+ win rate indicator with station-by-station breakdowns.
* **Calibration Scatter Plot:** Predicted WeatherNext probability vs. actual observed frequency.
