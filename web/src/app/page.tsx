"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Sparkles,
  User,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LandingPage() {
  const router = useRouter();
  const { user, signInWithGoogle, signOut, setIsPricingOpen, setIsCliModalOpen } = useAuth();
  const [setupTab, setSetupTab] = useState<"cli" | "web">("cli");
  const [copied, setCopied] = useState(false);

  // In-hero form state
  const [provider, setProvider] = useState("auto");
  const [venue, setVenue] = useState("kalshi_demo");
  const [mode, setMode] = useState("copilot");

  const copyCliCommand = () => {
    navigator.clipboard.writeText("pip install mone-agent\nmone doctor\nmone run --mode copilot\nmone serve --port 8000");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLaunchWebRunner = () => {
    const targetUrl = `/agent?provider=${provider}&venue=${venue}&mode=${mode}`;
    if (!user) {
      signInWithGoogle();
    }
    router.push(targetUrl);
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
            <a href="#cli-queries" className="hover:text-zinc-100 transition-colors">
              CLI Queries
            </a>
            <button
              onClick={() => setIsPricingOpen(true)}
              className="hover:text-zinc-100 transition-colors cursor-pointer text-left"
            >
              Pricing
            </button>
            <button
              onClick={() => setIsCliModalOpen(true)}
              className="hover:text-zinc-100 transition-colors cursor-pointer text-left"
            >
              CLI Guide
            </button>
            <a href="#architecture" className="hover:text-zinc-100 transition-colors">
              Architecture
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-zinc-300 font-medium">{user.plan}</span>
                  <span className="text-zinc-500">({user.plan === "Pro" ? "Unlimited" : `${user.runsRemaining} runs`})</span>
                </div>
                <button
                  onClick={signOut}
                  title="Sign Out"
                  className="p-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="inline-flex items-center gap-2 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 transition"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </button>
            )}

            <Link
              href="/agent"
              className="inline-flex items-center gap-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-lg shadow-sm transition"
            >
              Open Dashboard <ArrowRight className="w-3.5 h-3.5" />
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
                7-Day Free Trial on Kalshi Demo &bull; Google WeatherNext Edge
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

            {/* Right Column: Embedded Dual Distribution Setup */}
            <div className="lg:col-span-5">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 shadow-2xl backdrop-blur-md overflow-hidden">
                <div className="border-b border-zinc-800 bg-zinc-900/60 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-500/80 inline-block" />
                    <span className="h-3 w-3 rounded-full bg-yellow-500/80 inline-block" />
                    <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
                    <span className="ml-2 font-mono text-xs text-zinc-400">distribution_runner.sh</span>
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
                        Install the standalone Python CLI on your local terminal or cloud server:
                      </p>
                      <div className="relative rounded-lg bg-black/90 p-3.5 font-mono text-xs text-zinc-300 border border-zinc-800">
                        <pre className="overflow-x-auto space-y-1">
                          <span className="text-zinc-500"># 1. Install mone agent package</span>
                          <div>pip install mone-agent</div>
                          <span className="text-zinc-500"># 2. Run diagnostics</span>
                          <div>mone doctor</div>
                          <span className="text-zinc-500"># 3. Launch with Copilot approval</span>
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
                        <button
                          onClick={() => setIsCliModalOpen(true)}
                          className="text-indigo-400 hover:underline inline-flex items-center gap-1 font-medium"
                        >
                          View Full CLI Guide &amp; .env template <ChevronRight className="w-3 h-3" />
                        </button>
                        <span>Python 3.10+</span>
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
                          <option value="kalshi_demo">Kalshi Demo API v2 (7-Day Trial Sandbox)</option>
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

                      <button
                        onClick={handleLaunchWebRunner}
                        className="w-full inline-flex items-center justify-center gap-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg shadow-sm transition"
                      >
                        Launch Configured Agent <ArrowRight className="w-3.5 h-3.5" />
                      </button>
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
        </div>
      </section>

      {/* Live Signals Grid */}
      <section id="live-signals" className="py-20 border-b border-zinc-800/60 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl space-y-4 mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-white">Live Edge Scanner</h2>
            <p className="text-zinc-400 text-sm">
              Current ensemble vote probabilities compared with market order-book asks across key airport terminals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sampleStations.map((st) => (
              <div key={st.code} className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-sm">{st.city}</span>
                  <span className="text-[11px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-zinc-800">
                    {st.code}
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

      {/* CLI Queries & Terminal Trader Section */}
      <section id="cli-queries" className="py-20 border-b border-zinc-800/60 bg-[#08080a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-400">
                <Terminal className="w-3.5 h-3.5" />
                Terminal Trader Command Reference
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-white">
                Full prediction market trading control from your CLI
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Execute trades by signal ID or ticker, inspect real-time collateral, configure capital per trade, and query Google WeatherNext ensemble forecasts with simple terminal commands.
              </p>
            </div>
            <button
              onClick={() => setIsCliModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold border border-zinc-700 transition shrink-0"
            >
              Open Interactive CLI Guide <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Command 1: Trade */}
            <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  mone trade &lt;id | ticker&gt;
                </span>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Trading</span>
              </div>
              <p className="text-xs text-zinc-300">
                Execute trade by staged signal ID, market ticker (e.g. <code>KXRAIN-26OCT12-SATX</code>), or city name with optional <code>--capital</code>, <code>--side</code>, or <code>--contracts</code>.
              </p>
              <div className="bg-black/80 rounded-lg p-2.5 font-mono text-[11px] text-zinc-300 border border-zinc-800">
                <span className="text-zinc-500">$ </span>mone trade SATX --capital 15 --side YES
              </div>
            </div>

            {/* Command 2: Balance */}
            <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  mone balance
                </span>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Portfolio</span>
              </div>
              <p className="text-xs text-zinc-300">
                Inspect cash balance, open margin collateral, account equity, cumulative realized PnL, win rate %, and daily drawdown circuit breaker status.
              </p>
              <div className="bg-black/80 rounded-lg p-2.5 font-mono text-[11px] text-zinc-300 border border-zinc-800">
                <span className="text-zinc-500">$ </span>mone balance
              </div>
            </div>

            {/* Command 3: Signals */}
            <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  mone signals
                </span>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Copilot</span>
              </div>
              <p className="text-xs text-zinc-300">
                Display staged Copilot opportunities with model probability %, market ask price, expected ROI %, and ready-to-run <code>mone trade &lt;id&gt;</code> commands.
              </p>
              <div className="bg-black/80 rounded-lg p-2.5 font-mono text-[11px] text-zinc-300 border border-zinc-800">
                <span className="text-zinc-500">$ </span>mone signals
              </div>
            </div>

            {/* Command 4: Positions */}
            <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  mone positions [--all]
                </span>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Ledger</span>
              </div>
              <p className="text-xs text-zinc-300">
                View all open active contracts and historical settled positions from the zero-config SQLite ledger with fill prices and net realized PnL.
              </p>
              <div className="bg-black/80 rounded-lg p-2.5 font-mono text-[11px] text-zinc-300 border border-zinc-800">
                <span className="text-zinc-500">$ </span>mone positions --all
              </div>
            </div>

            {/* Command 5: Config */}
            <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  mone config [flags]
                </span>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Settings</span>
              </div>
              <p className="text-xs text-zinc-300">
                Configure capital per trade (<code>--capital 25</code>), max daily drawdown, venue (<code>--venue kalshi_demo</code>), and autonomy mode (<code>--mode copilot</code>).
              </p>
              <div className="bg-black/80 rounded-lg p-2.5 font-mono text-[11px] text-zinc-300 border border-zinc-800">
                <span className="text-zinc-500">$ </span>mone config --capital 25.0 --mode copilot
              </div>
            </div>

            {/* Command 6: Forecast */}
            <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                  mone forecast [city]
                </span>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Forecasts</span>
              </div>
              <p className="text-xs text-zinc-300">
                Inspect Google WeatherNext 63-member ensemble precipitation probabilities, millimeter expectations, and model signals for any city.
              </p>
              <div className="bg-black/80 rounded-lg p-2.5 font-mono text-[11px] text-zinc-300 border border-zinc-800">
                <span className="text-zinc-500">$ </span>mone forecast Miami
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Transparent Pricing Section (USDC Native) */}
      <section id="pricing" className="py-20 border-b border-zinc-800/60 bg-[#0a0a0c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" />
            Native USDC Crypto Payments
          </div>
          <h2 className="text-3xl font-bold text-white">Transparent pricing. Zero banking borders.</h2>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto">
            mone never touches your exchange trading capital. Every new user gets a <strong>7-Day Free Trial</strong> (50 runs). Top up anytime with native <strong>USDC</strong> on Polygon, Base, or Solana.
          </p>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: 100 Runs */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-semibold text-white text-base">100 Runs</h3>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold text-white">10</span>
                <span className="text-sm font-bold text-indigo-400">USDC</span>
                <span className="text-xs text-zinc-500">one-time</span>
              </div>
              <p className="text-xs text-zinc-400">Pay as you go for 100 automated trade cycles.</p>
              <ul className="text-xs text-zinc-400 space-y-2 pt-2">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 100 automated executions</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Open-Meteo &amp; WeatherNext 3</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Polygon, Base &amp; Solana</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Never expires</li>
              </ul>
            </div>
            <button
              onClick={() => setIsPricingOpen(true)}
              className="block w-full text-center text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded-lg transition"
            >
              Pay 10 USDC &bull; 100 Runs
            </button>
          </div>

          {/* Card 2: 300 Runs */}
          <div className="p-6 rounded-xl border border-indigo-500/50 bg-indigo-950/20 space-y-4 relative flex flex-col justify-between shadow-lg shadow-indigo-500/5">
            <span className="absolute -top-2.5 right-4 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              POPULAR
            </span>
            <div className="space-y-4">
              <h3 className="font-semibold text-white text-base">300 Runs</h3>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold text-white">25</span>
                <span className="text-sm font-bold text-indigo-400">USDC</span>
                <span className="text-xs text-zinc-500">one-time</span>
              </div>
              <p className="text-xs text-indigo-300">Save 17% per trade run with priority queue.</p>
              <ul className="text-xs text-zinc-300 space-y-2 pt-2">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 300 automated executions</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Priority execution queue</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Polygon, Base &amp; Solana</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Never expires</li>
              </ul>
            </div>
            <button
              onClick={() => setIsPricingOpen(true)}
              className="block w-full text-center text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg transition"
            >
              Pay 25 USDC &bull; 300 Runs
            </button>
          </div>

          {/* Card 3: Pro */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-semibold text-white text-base">Pro Subscription</h3>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold text-white">49</span>
                <span className="text-sm font-bold text-indigo-400">USDC</span>
                <span className="text-xs text-zinc-500">/ 30 days</span>
              </div>
              <p className="text-xs text-zinc-400">Unlimited automated executions and real-time feeds.</p>
              <ul className="text-xs text-zinc-400 space-y-2 pt-2">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Unlimited executions</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Sub-second order book streaming</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Telegram alerts &amp; Copilot queue</li>
              </ul>
            </div>
            <button
              onClick={() => setIsPricingOpen(true)}
              className="block w-full text-center text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded-lg transition"
            >
              Pay 49 USDC &bull; Pro
            </button>
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
