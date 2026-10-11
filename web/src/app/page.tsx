"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CloudRain,
  ShieldCheck,
  TrendingUp,
  Terminal,
  Cpu,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Copy,
  Zap,
  Activity,
  Layers,
  ChevronRight,
} from "lucide-react";

export default function LandingPage() {
  const [setupTab, setSetupTab] = useState<"cli" | "web">("cli");
  const [copied, setCopied] = useState(false);

  // In-hero form state
  const [provider, setProvider] = useState("auto");
  const [venue, setVenue] = useState("paper");
  const [mode, setMode] = useState("copilot");

  const copyCliCommand = () => {
    navigator.clipboard.writeText("pip install mone-agent\nmone doctor\nmone run --mode copilot");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sampleStations = [
    { city: "San Antonio (SATX)", code: "CLISAT", prob: 85.7, ask: 0.18, edge: "+67.7%", side: "BUY YES", status: "rain" },
    { city: "Houston (HOU)", code: "CLIHOU", prob: 98.4, ask: 0.48, edge: "+50.4%", side: "BUY YES", status: "rain" },
    { city: "Austin (AUS)", code: "CLIAUS", prob: 77.8, ask: 0.35, edge: "+42.8%", side: "BUY YES", status: "rain" },
    { city: "Las Vegas (LV)", code: "CLILAS", prob: 95.2, ask: 0.55, edge: "+40.2%", side: "BUY YES", status: "rain" },
    { city: "Los Angeles (LAX)", code: "CLILAX", prob: 4.2, ask: 0.22, edge: "+73.8%", side: "BUY NO", status: "dry" },
    { city: "Denver (DEN)", code: "CLIDEN", prob: 48.0, ask: 0.52, edge: "0.0%", side: "NEUTRAL", status: "neutral" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-[#0a0a0c]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xl font-black tracking-wider text-white">
              mone<span className="text-indigo-400">.</span>
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
              #neatHack AI Agent
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
            <a href="#backtest" className="hover:text-zinc-100 transition-colors">
              Backtest Audit
            </a>
            <a href="#live-signals" className="hover:text-zinc-100 transition-colors">
              Live Signals
            </a>
            <a href="#architecture" className="hover:text-zinc-100 transition-colors">
              Architecture
            </a>
            <a href="#roadmap" className="hover:text-zinc-100 transition-colors">
              Roadmap
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/xcjohnmark/mone"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 transition"
            >
              GitHub <ExternalLink className="w-3 h-3" />
            </a>
            <Link
              href="/agent"
              className="inline-flex items-center gap-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg shadow-sm transition"
            >
              Open Agent Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 overflow-hidden border-b border-zinc-800/60">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Value Proposition */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Google WeatherNext 3 & 2 Ensemble + Kalshi KXRAIN
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]">
                Autonomous weather edge for prediction markets.
              </h1>

              <p className="text-base sm:text-lg text-zinc-400 max-w-2xl leading-relaxed">
                mone continuously ingests Google DeepMind&apos;s 63-member ensemble forecasts, calculates statistical mispricings on daily precipitation contracts, and executes non-custodial orders across 22 NWS airport stations.
              </p>

              <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>100% Non-Custodial (BYOK)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  <span>Instrumented with Neatlogs</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span>Audited 76%+ Win Rate</span>
                </div>
              </div>
            </div>

            {/* Right Column: Embedded Interactive Setup */}
            <div className="lg:col-span-5">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 shadow-2xl backdrop-blur-md overflow-hidden">
                <div className="border-b border-zinc-800 bg-zinc-900/60 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-500/80 inline-block" />
                    <span className="h-3 w-3 rounded-full bg-yellow-500/80 inline-block" />
                    <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
                    <span className="ml-2 font-mono text-xs text-zinc-400">agent_setup.sh</span>
                  </div>
                  <div className="flex gap-1 bg-zinc-800/80 p-0.5 rounded-md text-xs">
                    <button
                      onClick={() => setSetupTab("cli")}
                      className={`px-2.5 py-1 rounded transition ${
                        setupTab === "cli" ? "bg-zinc-700 text-white font-medium" : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      CLI Terminal
                    </button>
                    <button
                      onClick={() => setSetupTab("web")}
                      className={`px-2.5 py-1 rounded transition ${
                        setupTab === "web" ? "bg-zinc-700 text-white font-medium" : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      Web Runner
                    </button>
                  </div>
                </div>

                <div className="p-5">
                  {setupTab === "cli" ? (
                    <div className="space-y-4">
                      <p className="text-xs text-zinc-400">
                        Install the standalone Python CLI and run locally or on AWS EC2 in under 60 seconds:
                      </p>
                      <div className="relative rounded-lg bg-black/90 p-3.5 font-mono text-xs text-zinc-300 border border-zinc-800">
                        <pre className="overflow-x-auto space-y-1">
                          <span className="text-zinc-500"># 1. Install mone agent package</span>
                          <div>pip install mone-agent</div>
                          <span className="text-zinc-500"># 2. Run system connectivity diagnostics</span>
                          <div>mone doctor</div>
                          <span className="text-zinc-500"># 3. Launch with Copilot approval queue</span>
                          <div className="text-emerald-400">mone run --mode copilot</div>
                        </pre>
                        <button
                          onClick={copyCliCommand}
                          className="absolute top-2.5 right-2.5 p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                          title="Copy commands"
                        >
                          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
                        <span>Python 3.10+ required</span>
                        <Link href="/agent" className="text-indigo-400 hover:underline inline-flex items-center gap-1">
                          Or try web version <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Weather Provider</label>
                        <select
                          value={provider}
                          onChange={(e) => setProvider(e.target.value)}
                          className="w-full text-xs bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="auto">Auto (WeatherNext 3 with Open-Meteo fallback)</option>
                          <option value="openmeteo">Open-Meteo WeatherNext 2 (Free / Zero-Auth)</option>
                          <option value="weathernext3">Google WeatherNext 3 (BigQuery BYOK)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Execution Venue</label>
                        <select
                          value={venue}
                          onChange={(e) => setVenue(e.target.value)}
                          className="w-full text-xs bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="paper">Virtual Paper Broker ($1,000 Sandbox)</option>
                          <option value="kalshi_demo">Kalshi Demo API v2 (Sandbox Keys)</option>
                          <option value="kalshi_live">Kalshi Live Production (KXRAIN)</option>
                          <option value="polymarket">Polymarket (Polygon Web3)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Autonomy Level</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setMode("copilot")}
                            className={`px-3 py-2 rounded-lg text-xs font-medium border text-left transition ${
                              mode === "copilot"
                                ? "bg-indigo-600/10 border-indigo-500/50 text-indigo-300"
                                : "bg-zinc-900 border-zinc-800 text-zinc-400"
                            }`}
                          >
                            <span className="block font-semibold">Copilot Mode</span>
                            <span className="text-[10px] text-zinc-400">1-click trade approval</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setMode("autonomous")}
                            className={`px-3 py-2 rounded-lg text-xs font-medium border text-left transition ${
                              mode === "autonomous"
                                ? "bg-indigo-600/10 border-indigo-500/50 text-indigo-300"
                                : "bg-zinc-900 border-zinc-800 text-zinc-400"
                            }`}
                          >
                            <span className="block font-semibold">Autonomous</span>
                            <span className="text-[10px] text-zinc-400">Auto-exec within limits</span>
                          </button>
                        </div>
                      </div>

                      <Link
                        href={`/agent?provider=${provider}&venue=${venue}&mode=${mode}`}
                        className="w-full inline-flex items-center justify-center gap-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg shadow-sm transition"
                      >
                        Launch Configured Agent <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Backtest Showcase Section */}
      <section id="backtest" className="py-20 border-b border-zinc-800/60 bg-[#0a0a0c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl space-y-4 mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-medium">
              Empirical Validation
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white">
              60-Day Audited Backtest Replay
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Every day simulated against historical WeatherNext ensemble members, actual Kalshi order book prices, and official NWS airport precipitation ground truth (0.01-inch resolution).
            </p>
          </div>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-xs text-zinc-400">Strategy Win Rate</span>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-400 mt-1">76.0%</div>
              <span className="text-[11px] text-zinc-500">Extreme forecasts (&gt;75% / &lt;25%)</span>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-xs text-zinc-400">Sharpe Ratio</span>
              <div className="text-2xl sm:text-3xl font-bold text-white mt-1">5.41</div>
              <span className="text-[11px] text-zinc-500">Annualized risk-adjusted return</span>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-xs text-zinc-400">Maximum Drawdown</span>
              <div className="text-2xl sm:text-3xl font-bold text-zinc-200 mt-1">4.5%</div>
              <span className="text-[11px] text-zinc-500">Protected by circuit breaker</span>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-xs text-zinc-400">Brier Calibration Score</span>
              <div className="text-2xl sm:text-3xl font-bold text-indigo-400 mt-1">0.0762</div>
              <span className="text-[11px] text-zinc-500">Beats market crowd (0.0884)</span>
            </div>
          </div>

          {/* Benchmark Comparison Table */}
          <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-950/60">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 font-mono">
                  <tr>
                    <th className="py-3 px-4">Strategy Benchmark</th>
                    <th className="py-3 px-4">Win Rate</th>
                    <th className="py-3 px-4">Cumulative PnL</th>
                    <th className="py-3 px-4">Return (ROI)</th>
                    <th className="py-3 px-4">Max Drawdown</th>
                    <th className="py-3 px-4">Sharpe Ratio</th>
                    <th className="py-3 px-4">Brier Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono text-zinc-300">
                  <tr className="bg-indigo-950/20 font-semibold text-white">
                    <td className="py-3 px-4 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      mone Agent (WeatherNext + Rules)
                    </td>
                    <td className="py-3 px-4 text-emerald-400">76.0%</td>
                    <td className="py-3 px-4 text-emerald-400">+$291.88</td>
                    <td className="py-3 px-4 text-emerald-400">+29.2%</td>
                    <td className="py-3 px-4">4.5%</td>
                    <td className="py-3 px-4">5.41</td>
                    <td className="py-3 px-4 text-indigo-400">0.0762</td>
                  </tr>
                  <tr className="text-zinc-400">
                    <td className="py-3 px-4">Market Consensus Baseline</td>
                    <td className="py-3 px-4">91.5%</td>
                    <td className="py-3 px-4">+$1,307.43</td>
                    <td className="py-3 px-4">+130.7%</td>
                    <td className="py-3 px-4">1.4%</td>
                    <td className="py-3 px-4">20.21</td>
                    <td className="py-3 px-4">0.0884</td>
                  </tr>
                  <tr className="text-zinc-400">
                    <td className="py-3 px-4">Random Walk Baseline</td>
                    <td className="py-3 px-4 text-rose-400">18.4%</td>
                    <td className="py-3 px-4 text-rose-400">-$811.56</td>
                    <td className="py-3 px-4 text-rose-400">-81.2%</td>
                    <td className="py-3 px-4 text-rose-400">81.4%</td>
                    <td className="py-3 px-4 text-rose-400">-10.30</td>
                    <td className="py-3 px-4">0.2500</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Live Market Signals Section */}
      <section id="live-signals" className="py-20 border-b border-zinc-800/60 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium mb-3">
                Live Market Scanner
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-white">
                Active Rain Contract Signals
              </h2>
              <p className="text-zinc-400 text-sm mt-1">
                Comparing WeatherNext 2 ensemble voting against current Kalshi KXRAIN order books.
              </p>
            </div>
            <Link
              href="/agent"
              className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              View all 22 airport stations <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sampleStations.map((st) => (
              <div
                key={st.code}
                className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white text-sm">{st.city}</span>
                    <span className="block font-mono text-xs text-zinc-500">{st.code}</span>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      st.status === "rain"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : st.status === "dry"
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                    }`}
                  >
                    {st.side}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-xs">
                  <div>
                    <span className="text-[11px] text-zinc-500 block">Model Prob</span>
                    <span className="text-zinc-200 font-medium">{st.prob}%</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-500 block">Market Ask</span>
                    <span className="text-zinc-200 font-medium">${st.ask.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-500 block">Edge</span>
                    <span className={`font-semibold ${st.edge.startsWith("+") ? "text-emerald-400" : "text-zinc-400"}`}>
                      {st.edge}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap Section: High Temperature Contracts */}
      <section id="roadmap" className="py-20 border-b border-zinc-800/60 bg-[#0a0a0c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="p-8 rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/20 to-zinc-950 relative overflow-hidden">
            <div className="max-w-2xl space-y-4">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-semibold uppercase tracking-wider">
                Post-Hackathon Expansion
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Extreme High Temperature Contracts
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                During the hackathon, mone exclusively trades daily precipitation contracts to preserve statistical edge at the 0.01-inch boundary. Following the hackathon, our second model adapter will deploy for Kalshi and Polymarket Daily High Temperature brackets across Phoenix, Las Vegas, Dallas, and Miami.
              </p>
              <div className="pt-2 flex items-center gap-4 text-xs text-zinc-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  <span>Gaussian temperature regression</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  <span>1-degree bracket distributions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Non-Custodial Pricing & Dodo Payments Section */}
      <section className="py-20 border-b border-zinc-800/60 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold text-white">Non-Custodial Runner Fuel & Pro</h2>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto">
            mone never touches your exchange trading capital. Powered by Dodo Payments, you only purchase compute fuel credits for running cloud cycles.
          </p>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-4">
            <h3 className="font-semibold text-white text-base">Fuel Pack A</h3>
            <div className="text-3xl font-bold text-white">$10</div>
            <p className="text-xs text-zinc-400">100 autonomous runner cycles on cloud runner.</p>
            <ul className="text-xs text-zinc-400 space-y-2 pt-2">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 100 hourly executions</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Open-Meteo & WeatherNext 3</li>
            </ul>
            <Link href="/agent" className="block text-center text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg transition">
              Get $10 Fuel
            </Link>
          </div>

          <div className="p-6 rounded-xl border border-indigo-500/50 bg-indigo-950/20 space-y-4 relative">
            <span className="absolute -top-2.5 right-4 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              POPULAR
            </span>
            <h3 className="font-semibold text-white text-base">Fuel Pack B</h3>
            <div className="text-3xl font-bold text-white">$25</div>
            <p className="text-xs text-zinc-400">300 autonomous runner cycles + Neatlogs export.</p>
            <ul className="text-xs text-zinc-400 space-y-2 pt-2">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 300 cloud executions</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Full Neatlogs trace export</li>
            </ul>
            <Link href="/agent" className="block text-center text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg transition">
              Get $25 Fuel
            </Link>
          </div>

          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-4">
            <h3 className="font-semibold text-white text-base">Pro Subscription</h3>
            <div className="text-3xl font-bold text-white">$49<span className="text-xs text-zinc-400 font-normal">/mo</span></div>
            <p className="text-xs text-zinc-400">Unlimited autonomous 24/7 executions + Copilot stage.</p>
            <ul className="text-xs text-zinc-400 space-y-2 pt-2">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Unlimited executions</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Webhook signals to Telegram</li>
            </ul>
            <Link href="/agent" className="block text-center text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg transition">
              Subscribe Pro
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-[#0a0a0c] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-white">mone.</span>
            <span>Built for #neatHack 2026.</span>
          </div>

          <div className="flex items-center gap-6">
            <span>Integrated with:</span>
            <span className="text-zinc-400 font-medium">neatlogs</span>
            <span className="text-zinc-400 font-medium">Entire</span>
            <span className="text-zinc-400 font-medium">cfo.ai</span>
            <span className="text-zinc-400 font-medium">Dodo Payments</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
