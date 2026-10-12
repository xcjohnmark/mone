"use client";

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Terminal,
  X,
  Copy,
  CheckCircle2,
  ShieldCheck,
  Search,
  DollarSign,
  TrendingUp,
  Cpu,
  Layers,
  HelpCircle,
} from "lucide-react";

interface CliQuery {
  cmd: string;
  example: string;
  desc: string;
  category: "Trading" | "Portfolio" | "Intelligence" | "Config" | "Automation";
}

const CLI_QUERIES: CliQuery[] = [
  {
    cmd: "mone trade <ID | TICKER | CITY>",
    example: "mone trade SATX --capital 25 --side YES",
    desc: "Executes an immediate prediction market trade by Signal ID (e.g. 14), ticker (KXRAIN-26OCT12-SATX), station suffix (SATX), or city ('San Antonio'). Automatically checks risk guardrails and submits order.",
    category: "Trading",
  },
  {
    cmd: "mone signals",
    example: "mone signals",
    desc: "Lists pending Copilot signals from the WeatherNext ensemble queue. Shows model probability, market ask, quantitative edge %, and one-line 'mone trade <id>' execution helpers.",
    category: "Trading",
  },
  {
    cmd: "mone balance",
    example: "mone balance",
    desc: "Inspects cash balance, invested margin collateral, portfolio equity, realized PnL, win rate %, and daily stop-loss circuit breaker buffer.",
    category: "Portfolio",
  },
  {
    cmd: "mone positions [--all]",
    example: "mone positions --all",
    desc: "Displays active open contracts and settled positions in your local SQLite ledger with fill prices, contract quantities, payouts, and net PnL.",
    category: "Portfolio",
  },
  {
    cmd: "mone config [flags]",
    example: "mone config --capital 25.0 --mode copilot",
    desc: "Views or sets runtime parameters: --capital (USD per trade), --max-drawdown (stop-loss cap), --mode (copilot/autonomous), --venue (kalshi_demo/kalshi_live/polymarket).",
    category: "Config",
  },
  {
    cmd: "mone markets",
    example: "mone markets",
    desc: "Lists all 22 official NWS weather prediction market stations (Chicago, San Antonio, Miami, Denver, etc.) with coordinates, airport codes, and tickers.",
    category: "Intelligence",
  },
  {
    cmd: "mone forecast [CITY | STATION]",
    example: "mone forecast Miami",
    desc: "Queries live 63-member ensemble rain probabilities, expected millimeter rainfall, and model signals for any specific city or all 22 hubs.",
    category: "Intelligence",
  },
  {
    cmd: "mone scan",
    example: "mone scan",
    desc: "Pre-defined scanner comparing Google WeatherNext edge against live market asks across all 22 airport contracts.",
    category: "Intelligence",
  },
  {
    cmd: "mone run [flags]",
    example: "mone run --mode copilot --loop --interval 3600",
    desc: "Runs autonomous agent trading cycles: settlement verification, forecast ingest, order book pricing, risk check, and execution.",
    category: "Automation",
  },
  {
    cmd: "mone doctor",
    example: "mone doctor",
    desc: "Diagnoses connectivity to Neatlogs telemetry, Google WeatherNext / Open-Meteo providers, and Kalshi/Polymarket exchanges.",
    category: "Automation",
  },
];

export function CliSetupModal() {
  const { isCliModalOpen, setIsCliModalOpen, user } = useAuth();
  const [activeTab, setActiveTab] = useState<"queries" | "setup" | "env">("queries");
  const [platform, setPlatform] = useState<"unix" | "windows">("unix");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isCliModalOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const unixCommands = `# 1. Install mone agent package via pip
pip install mone-agent

# 2. Configure Bring-Your-Own-Key (BYOK) credentials
mone config

# 3. Verify weather ensemble connectivity and Neatlogs SDK
mone doctor

# 4. Check active weather prediction markets
mone markets

# 5. Check account balance and circuit breaker
mone balance

# 6. Start agent in Copilot mode (1-click manual approval)
mone run --mode copilot

# 7. (Optional) Run companion API server for web dashboard
mone serve --port 8000`;

  const windowsCommands = `# 1. Install mone agent in PowerShell
pip install mone-agent

# 2. View and configure parameters
mone config

# 3. Verify system health and Neatlogs telemetry
mone doctor

# 4. Inspect account balance and margin
mone balance

# 5. Execute a trade directly on a weather market
mone trade SATX --capital 15 --side YES

# 6. Start autonomous agent runner
mone run --mode copilot

# 7. Launch web companion server
mone serve --port 8000`;

  const envTemplate = `# --- mone Agent BYOK Environment ---
WEATHER_PROVIDER=auto
DEFAULT_VENUE=kalshi_demo
AGENT_AUTONOMY_MODE=copilot
CAPITAL_PER_TRADE=10.00
MAX_DAILY_DRAWDOWN=50.00
MIN_EDGE_THRESHOLD=0.05

# Neatlogs Project Observability Telemetry
NEATLOGS_API_KEY=CWkvQ30hGStyqjsjlxMo0LM-h9pQ9oAR
NEATLOGS_WORKFLOW_NAME=mone-trading-agent

# Kalshi API Credentials (Demo or Live KXRAIN)
KALSHI_DEMO_API_KEY_ID=
KALSHI_DEMO_PRIVATE_KEY_PATH=
KALSHI_API_KEY_ID=
KALSHI_PRIVATE_KEY_PATH=

# CLI Auth Token
MONE_API_TOKEN=${user?.cliApiToken || "mone_sec_your_token_here"}`;

  const filteredQueries = CLI_QUERIES.filter((q) => {
    const matchesCategory = categoryFilter === "All" || q.category === categoryFilter;
    const matchesSearch =
      q.cmd.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.example.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0e0e12] border border-zinc-800 rounded-2xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={() => setIsCliModalOpen(false)}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-2 pr-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-400">
            <Terminal className="w-3.5 h-3.5" />
            CLI Guide &amp; Query Reference
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Command-Line Interface for Prediction Market Traders
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Trade prediction markets, configure capital limits, query WeatherNext ensemble forecasts, and inspect account balance non-custodially from your terminal.
          </p>
        </div>

        {/* Top-Level Tabs */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
          <button
            onClick={() => setActiveTab("queries")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "queries"
                ? "bg-indigo-600 text-white"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            Trader Queries &amp; Actions ({CLI_QUERIES.length})
          </button>
          <button
            onClick={() => setActiveTab("setup")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "setup"
                ? "bg-indigo-600 text-white"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            Installation &amp; Setup
          </button>
          <button
            onClick={() => setActiveTab("env")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "env"
                ? "bg-indigo-600 text-white"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            Environment (.env) BYOK
          </button>
        </div>

        {/* Tab 1: Queries Reference */}
        {activeTab === "queries" && (
          <div className="space-y-4 overflow-y-auto pr-1 flex-1">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search queries (e.g. trade, balance, capital, forecast)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
                {["All", "Trading", "Portfolio", "Intelligence", "Config", "Automation"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition shrink-0 ${
                      categoryFilter === cat
                        ? "bg-zinc-700 text-white"
                        : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Queries Catalog List */}
            <div className="space-y-3">
              {filteredQueries.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 transition space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          {item.cmd}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(item.example, `cmd-${idx}`)}
                      title="Copy example query"
                      className="p-1.5 rounded-md text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 transition shrink-0"
                    >
                      {copiedId === `cmd-${idx}` ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="bg-black/60 rounded-lg px-3 py-2 border border-zinc-800 flex items-center justify-between font-mono text-[11px] text-zinc-400">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-zinc-600 select-none">$</span>
                      <span className="text-emerald-300 truncate">{item.example}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 hidden sm:inline ml-2 shrink-0">Click icon to copy</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Setup Commands */}
        {activeTab === "setup" && (
          <div className="space-y-4 overflow-y-auto pr-1 flex-1">
            {/* Platform Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setPlatform("unix")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  platform === "unix"
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                macOS / Linux (bash/zsh)
              </button>
              <button
                onClick={() => setPlatform("windows")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  platform === "windows"
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Windows (PowerShell)
              </button>
            </div>

            {/* Terminal Commands Block */}
            <div className="relative rounded-xl bg-black/90 p-4 font-mono text-xs text-zinc-300 border border-zinc-800">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800/80 text-[11px] text-zinc-500">
                <span>Terminal Quickstart</span>
                <button
                  onClick={() => copyToClipboard(platform === "unix" ? unixCommands : windowsCommands, "commands")}
                  className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition"
                >
                  {copiedId === "commands" ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy all</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="overflow-x-auto whitespace-pre leading-relaxed">
                {platform === "unix" ? unixCommands : windowsCommands}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 3: Environment Template */}
        {activeTab === "env" && (
          <div className="space-y-4 overflow-y-auto pr-1 flex-1">
            <p className="text-xs text-zinc-400">
              Save this configuration in your working directory as <code className="text-zinc-200">.env</code>. The CLI agent automatically loads your keys and risk settings on startup.
            </p>
            <div className="relative rounded-xl bg-black/90 p-4 font-mono text-xs text-zinc-300 border border-zinc-800">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800/80 text-[11px] text-zinc-500">
                <span>Configuration File (.env template)</span>
                <button
                  onClick={() => copyToClipboard(envTemplate, "env")}
                  className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition"
                >
                  {copiedId === "env" ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy .env</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="overflow-x-auto whitespace-pre leading-relaxed text-zinc-400">
                {envTemplate}
              </pre>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800 text-xs text-zinc-400 mt-auto">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">Non-custodial. Kalshi Demo sandbox enabled by default.</span>
          </div>
          <button
            onClick={() => setIsCliModalOpen(false)}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold transition shrink-0 ml-2"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
