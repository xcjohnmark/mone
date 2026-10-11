"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  ShieldCheck,
  Check,
  X,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  Settings,
  Activity,
  Layers,
  Clock,
  Sparkles,
} from "lucide-react";

interface Signal {
  id: number;
  station_code: string;
  city: string;
  target_date: string;
  market_id: string;
  venue: string;
  action: string;
  side: string;
  model_prob_pct: number;
  market_ask: number;
  edge_pct: number;
  contracts: number;
  capital: number;
  reason: string;
  status: string;
}

interface Position {
  id: number;
  market_id: string;
  station_code: string;
  city: string;
  side: string;
  entry_price: number;
  contracts: number;
  total_invested: number;
  potential_payout: number;
  status: string;
  created_at: string;
}

export default function AgentDashboard() {
  const [autonomyMode, setAutonomyMode] = useState<"copilot" | "autonomous">("copilot");
  const [isRunning, setIsRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTraceModal, setShowTraceModal] = useState(false);

  // Live state
  const [cashBalance, setCashBalance] = useState(90.10);
  const [investedCapital, setInvestedCapital] = useState(9.90);
  const [cumulativePnl, setCumulativePnl] = useState(0.00);

  // Positions
  const [positions, setPositions] = useState<Position[]>([
    {
      id: 1,
      market_id: "KXRAIN-26OCT12-SATX",
      station_code: "CLISAT",
      city: "San Antonio",
      side: "YES",
      entry_price: 0.18,
      contracts: 55,
      total_invested: 9.90,
      potential_payout: 55.00,
      status: "OPEN",
      created_at: new Date().toLocaleTimeString(),
    },
  ]);

  // Copilot Staged Signals
  const [stagedSignals, setStagedSignals] = useState<Signal[]>([
    {
      id: 8,
      station_code: "CLIPHX",
      city: "Phoenix",
      target_date: "2026-10-12",
      market_id: "KXRAIN-26OCT12-PHX",
      venue: "paper",
      action: "BUY_YES",
      side: "YES",
      model_prob_pct: 96.8,
      market_ask: 0.74,
      edge_pct: 22.8,
      contracts: 13,
      capital: 9.62,
      reason: "Strong Rain Signal: Model 96.8% > 75%, Ask $0.74 < $0.80, Edge +22.8%",
      status: "STAGED",
    },
    {
      id: 7,
      station_code: "CLIHOU",
      city: "Houston",
      target_date: "2026-10-12",
      market_id: "KXRAIN-26OCT12-HOU",
      venue: "paper",
      action: "BUY_YES",
      side: "YES",
      model_prob_pct: 98.4,
      market_ask: 0.48,
      edge_pct: 50.4,
      contracts: 20,
      capital: 9.60,
      reason: "Strong Rain Signal: Model 98.4% > 75%, Ask $0.48 < $0.80, Edge +50.4%",
      status: "STAGED",
    },
    {
      id: 6,
      station_code: "CLIEWR",
      city: "Newark",
      target_date: "2026-10-12",
      market_id: "KXRAIN-26OCT12-EWR",
      venue: "paper",
      action: "BUY_YES",
      side: "YES",
      model_prob_pct: 100.0,
      market_ask: 0.62,
      edge_pct: 38.0,
      contracts: 16,
      capital: 9.92,
      reason: "Strong Rain Signal: Model 100% > 75%, Ask $0.62 < $0.80, Edge +38.0%",
      status: "STAGED",
    },
    {
      id: 5,
      station_code: "CLIAUS",
      city: "Austin",
      target_date: "2026-10-12",
      market_id: "KXRAIN-26OCT12-AUS",
      venue: "paper",
      action: "BUY_YES",
      side: "YES",
      model_prob_pct: 77.8,
      market_ask: 0.35,
      edge_pct: 42.8,
      contracts: 28,
      capital: 9.80,
      reason: "Strong Rain Signal: Model 77.8% > 75%, Ask $0.35 < $0.80, Edge +42.8%",
      status: "STAGED",
    },
  ]);

  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleApprove = (sig: Signal) => {
    if (cashBalance < sig.capital) {
      showToast("Insufficient available cash balance to execute trade.");
      return;
    }

    const newPosition: Position = {
      id: Date.now(),
      market_id: sig.market_id,
      station_code: sig.station_code,
      city: sig.city,
      side: sig.side,
      entry_price: sig.market_ask,
      contracts: sig.contracts,
      total_invested: sig.capital,
      potential_payout: sig.contracts * 1.0,
      status: "OPEN",
      created_at: new Date().toLocaleTimeString(),
    };

    setPositions([newPosition, ...positions]);
    setStagedSignals(stagedSignals.filter((s) => s.id !== sig.id));
    setCashBalance((prev) => parseFloat((prev - sig.capital).toFixed(2)));
    setInvestedCapital((prev) => parseFloat((prev + sig.capital).toFixed(2)));
    showToast(`Executed ${sig.side} ${sig.city} (x${sig.contracts} @ $${sig.market_ask.toFixed(2)})!`);
  };

  const handleReject = (id: number) => {
    setStagedSignals(stagedSignals.filter((s) => s.id !== id));
    showToast(`Rejected signal #${id}.`);
  };

  const handleTriggerCycle = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      showToast("Completed cycle: Re-scanned 22 NWS stations via Open-Meteo ensemble.");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 flex flex-col">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white text-xs font-medium px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 border border-indigo-400/30 animate-bounce">
          <Sparkles className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="border-b border-zinc-800 bg-zinc-950/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-zinc-400 hover:text-white p-1 rounded transition">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="font-mono text-lg font-bold text-white">
              mone<span className="text-indigo-400">.</span>runner
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              Active Runner
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTraceModal(true)}
              className="inline-flex items-center gap-1.5 text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3 py-1.5 rounded-lg text-zinc-300 transition"
            >
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              Neatlogs Trace Proof
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition"
              title="BYOK Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Settings Drawer */}
      {showSettings && (
        <div className="border-b border-zinc-800 bg-zinc-900/90 backdrop-blur-md p-6">
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                BYOK (Bring-Your-Own-Key) & Risk Guardrail Settings
              </h3>
              <button onClick={() => setShowSettings(false)} className="text-zinc-400 hover:text-white text-xs">
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Weather Provider</label>
                <input
                  type="text"
                  disabled
                  value="Auto (WeatherNext 3 -> Open-Meteo Fallback)"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-300"
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Default Market Venue</label>
                <input
                  type="text"
                  disabled
                  value="Paper Broker (Virtual $1,000 Sandbox)"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-300"
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Daily Stop-Loss Drawdown Cap</label>
                <input
                  type="text"
                  disabled
                  value="$50.00 USD (Circuit Breaker)"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-300"
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Capital per Trade Cap</label>
                <input
                  type="text"
                  disabled
                  value="$10.00 USD"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-300"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 flex-1 w-full">
        {/* Control Strip & Balance Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Runner Controls */}
          <div className="lg:col-span-5 p-5 rounded-xl border border-zinc-800 bg-zinc-950 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Agent Controls</span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Standing by
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleTriggerCycle}
                disabled={isRunning}
                className="flex-1 inline-flex items-center justify-center gap-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-lg transition shadow-sm"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Scanning 22 Stations...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" /> Run Scan Cycle Now
                  </>
                )}
              </button>

              <div className="flex bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg text-xs font-medium">
                <button
                  onClick={() => setAutonomyMode("copilot")}
                  className={`px-3 py-2 rounded-md transition ${
                    autonomyMode === "copilot" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Copilot
                </button>
                <button
                  onClick={() => setAutonomyMode("autonomous")}
                  className={`px-3 py-2 rounded-md transition ${
                    autonomyMode === "autonomous" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Autonomous
                </button>
              </div>
            </div>

            <p className="text-[11px] text-zinc-500">
              {autonomyMode === "copilot"
                ? "Copilot Mode active: All edge mispricings are staged in queue below for 1-click confirmation."
                : "Autonomous Mode active: Automatically executes valid edges within $50 daily loss ceiling."}
            </p>
          </div>

          {/* Portfolio Equity Strip */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 rounded-xl border border-zinc-800 bg-zinc-950">
            <div>
              <span className="text-[11px] text-zinc-500 block">Available Cash</span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">${cashBalance.toFixed(2)}</div>
              <span className="text-[10px] text-zinc-500">Virtual balance</span>
            </div>
            <div>
              <span className="text-[11px] text-zinc-500 block">In Active Trades</span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-zinc-300 mt-1">${investedCapital.toFixed(2)}</div>
              <span className="text-[10px] text-zinc-500">{positions.length} position</span>
            </div>
            <div>
              <span className="text-[11px] text-zinc-500 block">Total Account Eq</span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-indigo-400 mt-1">
                ${(cashBalance + investedCapital).toFixed(2)}
              </div>
              <span className="text-[10px] text-zinc-500">Cash + Invested</span>
            </div>
            <div>
              <span className="text-[11px] text-zinc-500 block">Realized PnL</span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-1">+${cumulativePnl.toFixed(2)}</div>
              <span className="text-[10px] text-zinc-500">Audited ledger</span>
            </div>
          </div>
        </div>

        {/* Copilot Staged Review Queue */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                Copilot Review Feed ({stagedSignals.length} Staged Signals)
              </h2>
              <p className="text-xs text-zinc-400">
                WeatherNext ensemble detected statistical mispricings. Click approve to execute individual trades.
              </p>
            </div>
          </div>

          {stagedSignals.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-8 text-center text-xs text-zinc-500">
              No pending signals in review feed. Click &quot;Run Scan Cycle Now&quot; to re-scan 22 stations.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stagedSignals.map((sig) => (
                <div
                  key={sig.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3 hover:border-zinc-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white text-sm">{sig.city}</span>
                      <span className="block font-mono text-xs text-zinc-500">{sig.station_code} &bull; {sig.market_id}</span>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      BUY {sig.side}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 font-mono text-xs bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/80">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">WeatherNext</span>
                      <span className="font-semibold text-zinc-200">{sig.model_prob_pct}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Entry Ask</span>
                      <span className="font-semibold text-zinc-200">${sig.market_ask.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Edge</span>
                      <span className="font-bold text-emerald-400">+{sig.edge_pct}%</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-normal">{sig.reason}</p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleApprove(sig)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg transition"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve Trade (${sig.capital.toFixed(2)})
                    </button>
                    <button
                      onClick={() => handleReject(sig.id)}
                      className="px-3 py-2 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition border border-zinc-800"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Portfolio Positions Ledger */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            Active Portfolio Positions ({positions.length})
          </h2>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">Market / Station</th>
                    <th className="py-3 px-4">Side</th>
                    <th className="py-3 px-4">Entry Ask</th>
                    <th className="py-3 px-4">Contracts</th>
                    <th className="py-3 px-4">Invested</th>
                    <th className="py-3 px-4">Potential Win</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {positions.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3 px-4 font-semibold text-white">
                        {p.city} ({p.station_code})
                        <span className="block text-[10px] text-zinc-500 font-normal">{p.market_id}</span>
                      </td>
                      <td className="py-3 px-4 text-emerald-400 font-semibold">{p.side}</td>
                      <td className="py-3 px-4">${p.entry_price.toFixed(2)}</td>
                      <td className="py-3 px-4">{p.contracts}x</td>
                      <td className="py-3 px-4">${p.total_invested.toFixed(2)}</td>
                      <td className="py-3 px-4 text-emerald-400">+${p.potential_payout.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px]">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      {/* Neatlogs Trace Proof Modal */}
      {showTraceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                Neatlogs Failure Recovery Proof Trace
              </h3>
              <button onClick={() => setShowTraceModal(false)} className="text-zinc-400 hover:text-white text-xs">
                Close
              </button>
            </div>
            <p className="text-xs text-zinc-400">
              Demonstrates Google Cloud GCS disconnect, instant automatic recovery to Open-Meteo WeatherNext 2 ensemble, and trade completion.
            </p>
            <div className="bg-black/90 p-3 rounded-lg border border-zinc-800 font-mono text-[11px] text-zinc-300 max-h-72 overflow-y-auto space-y-2">
              <div className="text-emerald-400">Scenario: GCS_BIGQUERY_DISCONNECT_RECOVERY</div>
              <div className="text-amber-400">Primary Error: GCS Bucket &apos;gs://weathernext3_spatial&apos; connection reset by peer</div>
              <div className="text-indigo-400">Recovery Provider: openmeteo_weathernext2 (SUCCESS)</div>
              <div className="text-zinc-500">--- Spans Hierarchy ---</div>
              <div>[WORKFLOW] mone_trading_cycle (SUCCESS)</div>
              <div>&nbsp;&nbsp;&boxur; [TOOL] fetch_weather_forecasts (FALLBACK_ACTIVE)</div>
              <div>&nbsp;&nbsp;&boxur; [TOOL] fetch_market_quotes (SUCCESS)</div>
              <div>&nbsp;&nbsp;&boxur; [AGENT] evaluate_market_signals (SUCCESS)</div>
              <div>&nbsp;&nbsp;&boxur; [TOOL] execute_order (FILLED: CLIORD YES 23x @ $0.42)</div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowTraceModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-medium transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
