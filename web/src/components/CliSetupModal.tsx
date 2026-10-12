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
  Moon,
  Server,
  Laptop,
  Power,
  AlertTriangle,
  Cloud,
} from "lucide-react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Card } from "./ui/Card";
import { Tabs } from "./ui/Tabs";

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
    cmd: "mone forecast <STATION>",
    example: "mone forecast SATX --days 3",
    desc: "Queries raw Google WeatherNext ensemble forecasts across 63 members, printing probability distribution and precipitation thresholds.",
    category: "Intelligence",
  },
  {
    cmd: "mone run [--mode ...]",
    example: "mone run --mode autonomous",
    desc: "Launches the long-running continuous evaluation loop. Scans markets every 15 minutes and executes high-edge opportunities autonomously or in copilot mode.",
    category: "Automation",
  },
  {
    cmd: "mone doctor",
    example: "mone doctor",
    desc: "Runs end-to-end diagnostics on WeatherNext connectivity, Kalshi/Polymarket API authentication, Neatlogs telemetry, and SQLite database health.",
    category: "Automation",
  },
  {
    cmd: "mone pay [--plan ...]",
    example: "mone pay --plan pass_10 --network polygon --tx 0x...",
    desc: "Submits and verifies a native USDC payment transaction on Polygon, Base, or Solana to unlock automated run passes or 30-day Pro unlimited tier.",
    category: "Config",
  },
];

export function CliSetupModal() {
  const { user, isCliModalOpen, setIsCliModalOpen } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("queries");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [laptopOs, setLaptopOs] = useState<"windows" | "mac" | "linux">("windows");

  if (!isCliModalOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const sampleEnv = `# mone agent BYOK configuration
WEATHER_PROVIDER=auto
MARKET_VENUE=kalshi_demo
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
    const matchesCategory =
      categoryFilter === "All" || q.category === categoryFilter;
    const matchesSearch =
      q.cmd.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.example.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <Card className="bg-[var(--geist-background)] border-[var(--ds-gray-400)] rounded-2xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={() => setIsCliModalOpen(false)}
          className="absolute top-5 right-5 text-[var(--ds-gray-900)] hover:text-[var(--geist-foreground)] p-1.5 rounded-lg hover:bg-[var(--ds-gray-100)] transition z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-2 pr-8">
          <Badge variant="blue" dot>
            CLI Guide &amp; Query Reference
          </Badge>
          <h2 className="font-outfit text-2xl font-bold tracking-tight text-[var(--geist-foreground)]">
            Command-Line Interface for Prediction Market Traders
          </h2>
          <p className="font-satoshi text-xs sm:text-sm text-[var(--ds-gray-900)] leading-relaxed">
            Trade prediction markets, configure capital limits, query WeatherNext ensemble forecasts, and inspect account balance non-custodially from your terminal.
          </p>
        </div>

        {/* Top-Level Tabs */}
        <Tabs
          size="sm"
          value={activeTab}
          onValueChange={setActiveTab}
          items={[
            { id: "queries", label: `Trader Queries (${CLI_QUERIES.length})` },
            { id: "setup", label: "Installation & Setup" },
            { id: "always_on", label: "24/7 Setup (Lid Closed)" },
            { id: "env", label: "Environment (.env) BYOK" },
          ]}
        />

        {/* Tab 1: Queries Reference */}
        {activeTab === "queries" && (
          <div className="space-y-4 overflow-y-auto pr-1 flex-1">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ds-gray-500)]" />
                <input
                  type="text"
                  placeholder="Search queries (e.g. trade, balance, capital, forecast)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs bg-[var(--ds-gray-100)] border border-[var(--ds-gray-400)] rounded-lg pl-9 pr-3 py-2 text-[var(--geist-foreground)] placeholder-[var(--ds-gray-500)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-focus-color)]"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto text-xs pb-1 sm:pb-0">
                {["All", "Trading", "Portfolio", "Intelligence", "Config", "Automation"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition ${
                      categoryFilter === cat
                        ? "bg-[var(--geist-foreground)] text-[var(--geist-background)]"
                        : "text-[var(--ds-gray-900)] hover:text-[var(--geist-foreground)] hover:bg-[var(--ds-gray-100)]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Queries Grid */}
            <div className="space-y-3">
              {filteredQueries.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-[var(--ds-gray-400)] bg-[var(--ds-gray-100)] space-y-2 hover:border-[var(--ds-gray-500)] transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-xs font-bold text-[var(--geist-foreground)]">
                        {item.cmd}
                      </code>
                      <Badge variant="secondary" className="text-[10px]">
                        {item.category}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(item.example, `q-${idx}`)}
                      className="text-[11px] h-7 px-2"
                    >
                      {copiedKey === `q-${idx}` ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copy Example
                        </>
                      )}
                    </Button>
                  </div>

                  <p className="font-satoshi text-xs text-[var(--ds-gray-900)] leading-relaxed">
                    {item.desc}
                  </p>

                  <div className="pt-1">
                    <code className="block bg-[var(--geist-background)] border border-[var(--ds-gray-400)] rounded-md px-2.5 py-1.5 font-mono text-xs text-[var(--ds-blue-700)] overflow-x-auto">
                      $ {item.example}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Installation & Setup */}
        {activeTab === "setup" && (
          <div className="space-y-4 overflow-y-auto pr-1 flex-1 font-satoshi text-xs leading-relaxed text-[var(--ds-gray-900)]">
            <div className="space-y-2">
              <h3 className="font-outfit font-bold text-sm text-[var(--geist-foreground)]">
                1. Install the CLI Package via pip
              </h3>
              <div className="relative">
                <pre className="p-3 bg-[var(--ds-gray-100)] border border-[var(--ds-gray-400)] rounded-lg font-mono text-xs text-[var(--geist-foreground)]">
                  pip install mone-agent
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy("pip install mone-agent", "pip")}
                  className="absolute right-2 top-2 h-7 px-2 text-[11px]"
                >
                  {copiedKey === "pip" ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-outfit font-bold text-sm text-[var(--geist-foreground)]">
                2. Run System Diagnostics
              </h3>
              <div className="relative">
                <pre className="p-3 bg-[var(--ds-gray-100)] border border-[var(--ds-gray-400)] rounded-lg font-mono text-xs text-[var(--geist-foreground)]">
                  mone doctor
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy("mone doctor", "doc")}
                  className="absolute right-2 top-2 h-7 px-2 text-[11px]"
                >
                  {copiedKey === "doc" ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-outfit font-bold text-sm text-[var(--geist-foreground)]">
                3. Launch Trading Loop
              </h3>
              <div className="relative">
                <pre className="p-3 bg-[var(--ds-gray-100)] border border-[var(--ds-gray-400)] rounded-lg font-mono text-xs text-emerald-500">
                  mone run --mode autonomous
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy("mone run --mode autonomous", "run")}
                  className="absolute right-2 top-2 h-7 px-2 text-[11px]"
                >
                  {copiedKey === "run" ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tab: 24/7 Always-On Setup (Lid Closed) */}
        {activeTab === "always_on" && (
          <div className="space-y-6 overflow-y-auto pr-1 flex-1 text-xs">
            {/* Safety & Execution Invariant Banner */}
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-500 font-semibold font-outfit text-sm">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                What Happens When You Close Your Laptop Lid?
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs leading-relaxed text-[var(--ds-gray-900)]">
                <div className="p-3 rounded-lg bg-[var(--ds-gray-100)] border border-[var(--ds-gray-400)] space-y-1">
                  <div className="font-bold text-[var(--geist-foreground)] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Open Positions
                  </div>
                  <p className="text-[11px] text-[var(--ds-gray-900)]">
                    <strong>100% Safe &amp; Unaffected.</strong> Once placed, orders reside on the Kalshi / Polymarket exchange or blockchain. NOAA settlements and cash payouts resolve on the exchange automatically even if your machine is completely turned off.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[var(--ds-gray-100)] border border-[var(--ds-gray-400)] space-y-1">
                  <div className="font-bold text-[var(--geist-foreground)] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                    Copilot Traders
                  </div>
                  <p className="text-[11px] text-[var(--ds-gray-900)]">
                    The agent pauses scanning while asleep. Staged signals remain in your local SQLite ledger. When you reopen your laptop, mone wakes up, discards any expired yesterday contracts, and displays fresh opportunities.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[var(--ds-gray-100)] border border-[var(--ds-gray-400)] space-y-1">
                  <div className="font-bold text-[var(--geist-foreground)] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                    Autonomous Traders
                  </div>
                  <p className="text-[11px] text-[var(--ds-gray-900)]">
                    The CPU pauses in sleep mode and cannot execute trades during sleep. When you reopen your laptop, the agent immediately runs a fresh scan and resumes trading on live order books.
                  </p>
                </div>
              </div>
            </div>

            {/* Two Operational Options Header */}
            <div className="space-y-1">
              <h3 className="font-outfit font-bold text-sm text-[var(--geist-foreground)]">
                Choose How You Want to Run 24/7 Without Interruptions
              </h3>
              <p className="text-[11px] text-[var(--ds-gray-900)]">
                Select between hosting on an independent cloud container or configuring your laptop to keep trading while closed with the screen off.
              </p>
            </div>

            {/* Option A: Cloud Container (Docker / VPS) */}
            <div className="p-4 rounded-xl border border-[var(--ds-gray-400)] bg-[var(--ds-gray-100)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[var(--ds-blue-700)]/10 text-[var(--ds-blue-700)] flex items-center justify-center font-bold text-xs">
                    A
                  </span>
                  <div>
                    <h4 className="font-outfit font-bold text-sm text-[var(--geist-foreground)] flex items-center gap-1.5">
                      <Cloud className="w-4 h-4 text-[var(--ds-blue-700)]" />
                      Run on a 24/7 Cloud Container (Docker / VPS)
                    </h4>
                    <span className="text-[11px] text-[var(--ds-gray-900)]">
                      Recommended for Pro &amp; continuous traders. Works on AWS EC2, DigitalOcean ($4/mo), Fly.io, or Hetzner.
                    </span>
                  </div>
                </div>
                <Badge variant="blue">Zero Laptop Needed</Badge>
              </div>

              <div className="space-y-2 pt-1">
                <p className="text-[11px] text-[var(--ds-gray-900)]">
                  Launch the lightweight cloud daemon in 3 simple commands. You can close your laptop, sleep, or travel while it trades every 60 minutes:
                </p>
                <div className="relative">
                  <pre className="p-3 bg-[var(--geist-background)] border border-[var(--ds-gray-400)] rounded-lg font-mono text-xs text-[var(--geist-foreground)] overflow-x-auto">
{`# 1. Clone repository & configure BYOK credentials
git clone https://github.com/xcjohnmark/mone.git && cd mone
cp .env.example .env
# Edit .env with your Kalshi / Polymarket keys

# 2. Launch 24/7 background container
docker compose up -d

# 3. View real-time autonomous execution & neatlogs traces
docker compose logs -f`}
                  </pre>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleCopy(
                        "git clone https://github.com/xcjohnmark/mone.git && cd mone\ncp .env.example .env\ndocker compose up -d\ndocker compose logs -f",
                        "docker_cmd"
                      )
                    }
                    className="absolute right-2 top-2 h-7 px-2 text-[11px]"
                  >
                    {copiedKey === "docker_cmd" ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Option B: Laptop Power Settings (Zero Cost) */}
            <div className="p-4 rounded-xl border border-[var(--ds-gray-400)] bg-[var(--ds-gray-100)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs">
                    B
                  </span>
                  <div>
                    <h4 className="font-outfit font-bold text-sm text-[var(--geist-foreground)] flex items-center gap-1.5">
                      <Laptop className="w-4 h-4 text-emerald-500" />
                      Keep Laptop Running With Lid Closed (100% Free)
                    </h4>
                    <span className="text-[11px] text-[var(--ds-gray-900)]">
                      Turn off your screen while keeping the CPU active. Zero cloud expense.
                    </span>
                  </div>
                </div>
                <Badge variant="success">Zero Cost</Badge>
              </div>

              {/* OS Tabs */}
              <div className="flex items-center gap-1.5 pt-1">
                {(["windows", "mac", "linux"] as const).map((os) => (
                  <button
                    key={os}
                    onClick={() => setLaptopOs(os)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition ${
                      laptopOs === os
                        ? "bg-[var(--geist-foreground)] text-[var(--geist-background)]"
                        : "bg-[var(--geist-background)] text-[var(--ds-gray-900)] border border-[var(--ds-gray-400)] hover:text-[var(--geist-foreground)]"
                    }`}
                  >
                    {os === "mac" ? "macOS" : os}
                  </button>
                ))}
              </div>

              {/* Windows Instructions */}
              {laptopOs === "windows" && (
                <div className="p-3.5 rounded-lg bg-[var(--geist-background)] border border-[var(--ds-gray-400)] space-y-2 text-[11px] text-[var(--ds-gray-900)]">
                  <p className="font-semibold text-[var(--geist-foreground)]">
                    Windows 10 / 11 Setup (Takes 30 seconds):
                  </p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Open <strong>Start</strong>, type <strong>Control Panel</strong>, and open it.</li>
                    <li>Click <strong>Hardware and Sound</strong> &rarr; <strong>Power Options</strong>.</li>
                    <li>In the left sidebar, click <strong>&quot;Choose what closing the lid does&quot;</strong>.</li>
                    <li>Under <strong>&quot;When I close the lid&quot;</strong>, set the <strong>Plugged in</strong> dropdown to <strong>&quot;Do nothing&quot;</strong>.</li>
                    <li>Click <strong>Save changes</strong>.</li>
                  </ol>
                  <p className="text-[11px] text-emerald-500 pt-1 font-medium">
                    &bull; Now you can launch <code className="font-mono bg-[var(--ds-gray-100)] px-1 py-0.5 rounded">mone run --loop</code> and close your laptop lid while plugged into power. The screen will turn off, but mone will continuously execute every 60 minutes!
                  </p>
                </div>
              )}

              {/* macOS Instructions */}
              {laptopOs === "mac" && (
                <div className="p-3.5 rounded-lg bg-[var(--geist-background)] border border-[var(--ds-gray-400)] space-y-2 text-[11px] text-[var(--ds-gray-900)]">
                  <p className="font-semibold text-[var(--geist-foreground)]">
                    macOS Setup (Choose either method):
                  </p>
                  <div className="space-y-2">
                    <div>
                      <span className="font-bold text-[var(--geist-foreground)]">Method 1: Native Terminal Command</span>
                      <p className="text-[11px]">Run mone with macOS&apos;s built-in <code className="font-mono">caffeinate</code> utility to prevent sleep:</p>
                      <div className="relative mt-1">
                        <pre className="p-2 bg-[var(--ds-gray-100)] border border-[var(--ds-gray-400)] rounded font-mono text-xs text-[var(--geist-foreground)]">
                          caffeinate -d -s mone run --loop
                        </pre>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy("caffeinate -d -s mone run --loop", "mac_caffeinate")}
                          className="absolute right-1.5 top-1.5 h-6 px-1.5 text-[10px]"
                        >
                          {copiedKey === "mac_caffeinate" ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <span className="font-bold text-[var(--geist-foreground)]">Method 2: Mac System Settings</span>
                      <p className="text-[11px]">Go to <strong>System Settings</strong> &rarr; <strong>Displays</strong> &rarr; <strong>Advanced...</strong> &rarr; Enable <em>&quot;Prevent automatic sleeping when display is off&quot;</em>. Or install the free Mac App Store utility <strong>Amphetamine</strong>.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Linux Instructions */}
              {laptopOs === "linux" && (
                <div className="p-3.5 rounded-lg bg-[var(--geist-background)] border border-[var(--ds-gray-400)] space-y-2 text-[11px] text-[var(--ds-gray-900)]">
                  <p className="font-semibold text-[var(--geist-foreground)]">
                    Linux systemd Setup (Ubuntu / Debian / Arch):
                  </p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Edit <code className="font-mono bg-[var(--ds-gray-100)] px-1 py-0.5 rounded">/etc/systemd/logind.conf</code> using sudo.</li>
                    <li>Set <code className="font-mono bg-[var(--ds-gray-100)] px-1 py-0.5 rounded">HandleLidSwitch=ignore</code> and <code className="font-mono bg-[var(--ds-gray-100)] px-1 py-0.5 rounded">HandleLidSwitchExternalPower=ignore</code>.</li>
                    <li>Restart logind daemon: <code className="font-mono bg-[var(--ds-gray-100)] px-1 py-0.5 rounded">sudo systemctl restart systemd-logind</code>.</li>
                  </ol>
                  <div className="relative mt-1">
                    <pre className="p-2 bg-[var(--ds-gray-100)] border border-[var(--ds-gray-400)] rounded font-mono text-xs text-[var(--geist-foreground)]">
                      nohup mone run --loop &gt; mone.log 2&gt;&amp;1 &amp;
                    </pre>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy("nohup mone run --loop > mone.log 2>&1 &", "linux_nohup")}
                      className="absolute right-1.5 top-1.5 h-6 px-1.5 text-[10px]"
                    >
                      {copiedKey === "linux_nohup" ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Environment .env Template */}
        {activeTab === "env" && (
          <div className="space-y-3 overflow-y-auto pr-1 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--ds-gray-900)] font-medium">
                Save as <code className="text-[var(--geist-foreground)] font-mono">.env</code> in your root directory:
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(sampleEnv, "env")}
                className="text-xs gap-1.5"
              >
                {copiedKey === "env" ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy .env
                  </>
                )}
              </Button>
            </div>
            <pre className="p-4 bg-[var(--ds-gray-100)] border border-[var(--ds-gray-400)] rounded-xl font-mono text-xs text-[var(--geist-foreground)] overflow-x-auto leading-relaxed">
              {sampleEnv}
            </pre>
          </div>
        )}
      </Card>
    </div>
  );
}
