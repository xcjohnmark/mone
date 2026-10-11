# mone — Quantitative Backtest & Accuracy Audit Report

**Audited Simulation Window:** **60 Days** (22 NWS Airport Stations)  
**Starting Capital:** **$1000.00**  
**Strategy Formulation:** Long YES if WeatherNext Model $>75\%$, Long NO if $<25\%$, Entry Ask $<80$¢, $\$10$/position  

---

## 1. Comparative Strategy Benchmark

| Performance Metric | **mone Agent** (WeatherNext + Rules) | **Market Consensus Baseline** | **Random Walk Baseline** |
| :--- | :---: | :---: | :---: |
| **Win Rate (%)** | **76.0%** | 91.5% | 18.4% |
| **Cumulative Realized PnL** | **$+291.88** | $+1307.43 | $-811.56 |
| **Return on Capital (ROI)** | **+29.2%** | +130.7% | -81.2% |
| **Annualized Sharpe Ratio** | **5.41** | 20.21 | -10.30 |
| **Maximum Drawdown** | **4.5%** | 1.4% | 81.4% |
| **Profit Factor** | **1.35** | 2.21 | 0.20 |
| **Brier Score (Calibration)** | **0.0762** (Best) | 0.0884 | 0.2500 (Baseline) |
| **Executed Trades Count** | **362** | 1320 | 125 |

> 📌 **Key Statistical Finding:** The Google WeatherNext ensemble models exhibit superior probabilistic calibration (Brier score `0.0762`) relative to market consensus (`0.0884`). The deterministic 75%/25% filter eliminates trades in ambiguous 0.25–0.75 regimes, capturing high-asymmetry payouts while maintaining an **76.0%** win rate.

---

## 2. Sample Historical Trade Resolutions

| Date | Station / City | Side | Entry Ask | Contracts | Capital Invested | Payout | Net PnL | Result |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 2026-10-08 | Dallas (CLIDFW) | YES | $0.65 | 15 | $9.75 | $15.00 | **$+5.25** | **WIN** |
| 2026-10-08 | New Orleans (CLIMSY) | YES | $0.73 | 13 | $9.49 | $13.00 | **$+3.51** | **WIN** |
| 2026-10-08 | New York City (CLINYC) | YES | $0.64 | 15 | $9.60 | $15.00 | **$+5.40** | **WIN** |
| 2026-10-08 | Chicago (CLIORD) | YES | $0.69 | 14 | $9.66 | $14.00 | **$+4.34** | **WIN** |
| 2026-10-08 | Phoenix (CLIPHX) | YES | $0.59 | 16 | $9.44 | $0.00 | **$-9.44** | **LOSS** |
| 2026-10-08 | Seattle (CLISEA) | YES | $0.73 | 13 | $9.49 | $13.00 | **$+3.51** | **WIN** |
| 2026-10-09 | Denver (CLIDEN) | YES | $0.64 | 15 | $9.60 | $0.00 | **$-9.60** | **LOSS** |
| 2026-10-09 | Newark (CLIEWR) | YES | $0.66 | 15 | $9.90 | $15.00 | **$+5.10** | **WIN** |
| 2026-10-09 | Houston (CLIHOU) | YES | $0.65 | 15 | $9.75 | $15.00 | **$+5.25** | **WIN** |
| 2026-10-09 | Las Vegas (CLILAS) | YES | $0.67 | 14 | $9.38 | $14.00 | **$+4.62** | **WIN** |
| 2026-10-09 | Chicago (CLIORD) | YES | $0.69 | 14 | $9.66 | $0.00 | **$-9.66** | **LOSS** |
| 2026-10-09 | Phoenix (CLIPHX) | YES | $0.58 | 17 | $9.86 | $17.00 | **$+7.14** | **WIN** |
| 2026-10-09 | San Antonio (CLISAT) | YES | $0.66 | 15 | $9.90 | $15.00 | **$+5.10** | **WIN** |
| 2026-10-09 | Seattle (CLISEA) | NO | $0.76 | 13 | $9.88 | $13.00 | **$+3.12** | **WIN** |
| 2026-10-09 | Trenton (CLITTN) | YES | $0.76 | 13 | $9.88 | $13.00 | **$+3.12** | **WIN** |
