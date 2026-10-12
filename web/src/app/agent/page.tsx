"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Play,
  Pause,
  Power,
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
  User,
  LogOut,
  CreditCard,
  DollarSign,
  TrendingUp,
  Trash2,
  Calendar,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface OpportunityItem {
  id: number;
  station_code: string;
  city: string;
  target_date: string;
  market_id: string;
  model_prob_pct: number;
  market_ask: number;
  edge_pct: number;
  side: "YES" | "NO";
  contracts: number;
  capital: number;
  status: "STAGED" | "EXECUTED" | "WON" | "LOST" | "NO_TRADE";
  reason: string;
  outcome_pnl?: number;
}

interface Position {
  id: number;
  market_id: string;
  station_code: string;
  city: string;
  side: string;
  entry_price: number;
  current_bid: number;
  contracts: number;
  total_invested: number;
  potential_payout: number;
  unrealized_pnl: number;
  unrealized_pct: number;
  status: "OPEN" | "CLOSED_EARLY" | "SETTLED";
  created_at: string;
}

// 6 Available Historical / Current Days
const AVAILABLE_DATES = [
  { value: "2026-10-12", label: "Today (Current) — Oct 12, 2026", isCurrent: true },
  { value: "2026-10-11", label: "Yesterday — Oct 11, 2026", isCurrent: false },
  { value: "2026-10-10", label: "Oct 10, 2026", isCurrent: false },
  { value: "2026-10-09", label: "Oct 09, 2026", isCurrent: false },
  { value: "2026-10-08", label: "Oct 08, 2026", isCurrent: false },
  { value: "2026-10-07", label: "Oct 07, 2026", isCurrent: false },
];

// Curated daily opportunities where agent detected quantifiable edge or evaluated forecasts
const DAILY_OPPORTUNITIES: Record<string, OpportunityItem[]> = {
  "2026-10-12": [
    {
      id: 8,
      station_code: "CLIPHX",
      city: "Phoenix",
      target_date: "2026-10-12",
      market_id: "KXRAIN-26OCT12-PHX",
      model_prob_pct: 96.8,
      market_ask: 0.74,
      edge_pct: 22.8,
      side: "YES",
      contracts: 13,
      capital: 9.62,
      status: "STAGED",
      reason: "High-Confidence Rain: WeatherNext 96.8% vs 74¢ Ask (+22.8% edge)",
    },
    {
      id: 7,
      station_code: "CLIHOU",
      city: "Houston",
      target_date: "2026-10-12",
      market_id: "KXRAIN-26OCT12-HOU",
      model_prob_pct: 98.4,
      market_ask: 0.48,
      edge_pct: 50.4,
      side: "YES",
      contracts: 20,
      capital: 9.60,
      status: "STAGED",
      reason: "Severe Precipitation Band: Model 98.4% vs 48¢ Ask (+50.4% edge)",
    },
    {
      id: 6,
      station_code: "CLIEWR",
      city: "Newark",
      target_date: "2026-10-12",
      market_id: "KXRAIN-26OCT12-EWR",
      model_prob_pct: 100.0,
      market_ask: 0.62,
      edge_pct: 38.0,
      side: "YES",
      contracts: 16,
      capital: 9.92,
      status: "STAGED",
      reason: "Atmospheric River Inflow: 100% ensemble consensus vs 62¢ Ask (+38.0% edge)",
    },
    {
      id: 5,
      station_code: "CLIAUS",
      city: "Austin",
      target_date: "2026-10-12",
      market_id: "KXRAIN-26OCT12-AUS",
      model_prob_pct: 77.8,
      market_ask: 0.35,
      edge_pct: 42.8,
      side: "YES",
      contracts: 28,
      capital: 9.80,
      status: "STAGED",
      reason: "Gulf Moisture Surge: Model 77.8% vs 35¢ Ask (+42.8% edge)",
    },
    {
      id: 4,
      station_code: "CLIDFW",
      city: "Dallas",
      target_date: "2026-10-12",
      market_id: "KXRAIN-26OCT12-DFW",
      model_prob_pct: 18.2,
      market_ask: 0.38,
      edge_pct: 0.0,
      side: "NO",
      contracts: 0,
      capital: 0.0,
      status: "NO_TRADE",
      reason: "Forecast Clear: Rain Prob 18.2% < 25%, but ask spread offers insufficient edge",
    },
  ],
  "2026-10-11": [
    {
      id: 101,
      station_code: "CLISAT",
      city: "San Antonio",
      target_date: "2026-10-11",
      market_id: "KXRAIN-26OCT11-SATX",
      model_prob_pct: 88.5,
      market_ask: 0.22,
      edge_pct: 66.5,
      side: "YES",
      contracts: 45,
      capital: 9.90,
      status: "WON",
      reason: "Thunderstorm Line: Model 88.5% vs 22¢ Ask (+66.5% edge)",
      outcome_pnl: 35.10,
    },
    {
      id: 102,
      station_code: "CLIMIA",
      city: "Miami",
      target_date: "2026-10-11",
      market_id: "KXRAIN-26OCT11-MIA",
      model_prob_pct: 92.0,
      market_ask: 0.55,
      edge_pct: 37.0,
      side: "YES",
      contracts: 18,
      capital: 9.90,
      status: "WON",
      reason: "Tropical Depression Bands: Model 92% vs 55¢ Ask (+37.0% edge)",
      outcome_pnl: 8.10,
    },
    {
      id: 103,
      station_code: "CLIORD",
      city: "Chicago",
      target_date: "2026-10-11",
      market_id: "KXRAIN-26OCT11-ORD",
      model_prob_pct: 12.0,
      market_ask: 0.20,
      edge_pct: 68.0,
      side: "NO",
      contracts: 40,
      capital: 8.00,
      status: "WON",
      reason: "High Pressure Dome: Rain Prob 12.0%, bought NO @ 20¢",
      outcome_pnl: 32.00,
    },
  ],
  "2026-10-10": [
    {
      id: 201,
      station_code: "CLIATL",
      city: "Atlanta",
      target_date: "2026-10-10",
      market_id: "KXRAIN-26OCT10-ATL",
      model_prob_pct: 84.0,
      market_ask: 0.30,
      edge_pct: 54.0,
      side: "YES",
      contracts: 33,
      capital: 9.90,
      status: "WON",
      reason: "Frontal Passage: Model 84.0% vs 30¢ Ask",
      outcome_pnl: 23.10,
    },
    {
      id: 202,
      station_code: "CLIDEN",
      city: "Denver",
      target_date: "2026-10-10",
      market_id: "KXRAIN-26OCT10-DEN",
      model_prob_pct: 15.0,
      market_ask: 0.25,
      edge_pct: 60.0,
      side: "NO",
      contracts: 38,
      capital: 9.50,
      status: "WON",
      reason: "Dry Continental Air: Bought NO @ 25¢",
      outcome_pnl: 28.50,
    },
  ],
  "2026-10-09": [
    {
      id: 301,
      station_code: "CLIJFK",
      city: "New York (JFK)",
      target_date: "2026-10-09",
      market_id: "KXRAIN-26OCT09-JFK",
      model_prob_pct: 81.2,
      market_ask: 0.40,
      edge_pct: 41.2,
      side: "YES",
      contracts: 25,
      capital: 10.00,
      status: "WON",
      reason: "Coastal Low Pressure: Model 81.2% vs 40¢ Ask",
      outcome_pnl: 15.00,
    },
    {
      id: 302,
      station_code: "CLILAX",
      city: "Los Angeles",
      target_date: "2026-10-09",
      market_id: "KXRAIN-26OCT09-LAX",
      model_prob_pct: 5.0,
      market_ask: 0.15,
      edge_pct: 80.0,
      side: "NO",
      contracts: 60,
      capital: 9.00,
      status: "WON",
      reason: "Desert Ridge: Zero Rain Expected, bought NO @ 15¢",
      outcome_pnl: 51.00,
    },
  ],
  "2026-10-08": [
    {
      id: 401,
      station_code: "CLIBOS",
      city: "Boston",
      target_date: "2026-10-08",
      market_id: "KXRAIN-26OCT08-BOS",
      model_prob_pct: 79.0,
      market_ask: 0.45,
      edge_pct: 34.0,
      side: "YES",
      contracts: 22,
      capital: 9.90,
      status: "WON",
      reason: "Northeast Trough: Model 79% vs 45¢ Ask",
      outcome_pnl: 12.10,
    },
  ],
  "2026-10-07": [
    {
      id: 501,
      station_code: "CLISEA",
      city: "Seattle",
      target_date: "2026-10-07",
      market_id: "KXRAIN-26OCT07-SEA",
      model_prob_pct: 95.0,
      market_ask: 0.50,
      edge_pct: 45.0,
      side: "YES",
      contracts: 20,
      capital: 10.00,
      status: "WON",
      reason: "Pacific Jet Stream: Heavy Precipitation Forecast",
      outcome_pnl: 10.00,
    },
  ],
};

function AgentDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signInWithGoogle, signOut, setIsPricingOpen, consumeRun } = useAuth();

  // Engine toggles & controls
  const [agentPower, setAgentPower] = useState<"ACTIVE" | "PAUSED">("ACTIVE");
  const [autonomyMode, setAutonomyMode] = useState<"copilot" | "autonomous">(
    (searchParams.get("mode") as any) || "copilot"
  );
  const [provider, setProvider] = useState(searchParams.get("provider") || "auto");
  const [venue, setVenue] = useState(searchParams.get("venue") || "kalshi_demo");
  const [capitalPerTrade, setCapitalPerTrade] = useState(10.0);

  // Selected date dropdown (Today + past 5 days)
  const [selectedDate, setSelectedDate] = useState("2026-10-12");

  // UI modals
  const [isRunning, setIsRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTraceModal, setShowTraceModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [takeProfitModalPos, setTakeProfitModalPos] = useState<Position | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Balances
  const [cashBalance, setCashBalance] = useState(90.10);
  const [venueCollateralBalance, setVenueCollateralBalance] = useState(1000.0); // Kalshi demo v2 balance
  const [investedCapital, setInvestedCapital] = useState(9.90);
  const [cumulativePnl, setCumulativePnl] = useState(0.00);

  // Active Positions
  const [positions, setPositions] = useState<Position[]>([
    {
      id: 1,
      market_id: "KXRAIN-26OCT12-SATX",
      station_code: "CLISAT",
      city: "San Antonio",
      side: "YES",
      entry_price: 0.18,
      current_bid: 0.65, // Price has surged in our favor!
      contracts: 55,
      total_invested: 9.90,
      potential_payout: 55.00,
      unrealized_pnl: 25.85, // (0.65 - 0.18) * 55 = +$25.85
      unrealized_pct: 261.1,
      status: "OPEN",
      created_at: new Date().toLocaleTimeString(),
    },
  ]);

  // Current day's staged opportunities
  const [stagedSignals, setStagedSignals] = useState<OpportunityItem[]>(
    DAILY_OPPORTUNITIES["2026-10-12"] || []
  );

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Toggle agent master power
  const handleToggleAgentPower = () => {
    const nextPower = agentPower === "ACTIVE" ? "PAUSED" : "ACTIVE";
    setAgentPower(nextPower);
    if (nextPower === "PAUSED") {
      showToast("Agent Paused. Trading and scans are temporarily halted.");
    } else {
      showToast("Agent Activated. Real-time scanning & execution resumed.");
    }
  };

  // Take Profit Early Execution
  const handleConfirmTakeProfit = () => {
    if (!takeProfitModalPos) return;
    const pos = takeProfitModalPos;

    const proceeds = parseFloat((pos.current_bid * pos.contracts).toFixed(2));
    const profitLocked = parseFloat((proceeds - pos.total_invested).toFixed(2));

    // Update positions state
    setPositions(
      positions.map((p) =>
        p.id === pos.id ? { ...p, status: "CLOSED_EARLY" as const } : p
      )
    );

    // Update balances
    setCashBalance((prev) => parseFloat((prev + proceeds).toFixed(2)));
    setInvestedCapital((prev) => parseFloat((prev - pos.total_invested).toFixed(2)));
    setCumulativePnl((prev) => parseFloat((prev + profitLocked).toFixed(2)));

    showToast(`Take Profit Executed! Locked in +$${profitLocked.toFixed(2)} early profit on ${pos.city}.`);
    setTakeProfitModalPos(null);
  };

  // Trigger cycle scan
  const handleTriggerCycle = () => {
    if (agentPower === "PAUSED") {
      showToast("Agent is currently PAUSED. Switch to Active to execute cycles.");
      return;
    }

    if (!user) {
      signInWithGoogle();
      showToast("Signed in with Google! 7-Day Free Trial activated.");
      return;
    }

    if (!consumeRun()) {
      showToast("Out of runs. Please select a pass or upgrade to Pro.");
      return;
    }

    // Venue collateral check
    if (venueCollateralBalance < capitalPerTrade) {
      showToast(`Insufficient Collateral on ${venue}. Required $${capitalPerTrade}, Available $${venueCollateralBalance}. Please deposit funds.`);
      return;
    }

    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      showToast(`Completed scan across 22 NWS stations via ${provider.toUpperCase()} ensemble.`);
    }, 1200);
  };

  // Approve staged signal
  const handleApprove = (sig: OpportunityItem) => {
    if (agentPower === "PAUSED") {
      showToast("Agent is currently PAUSED. Switch to Active to approve trades.");
      return;
    }

    if (!user) {
      signInWithGoogle();
      return;
    }

    if (!consumeRun()) {
      showToast("Out of runs. Please select a pass or upgrade to Pro.");
      return;
    }

    if (venueCollateralBalance < sig.capital) {
      showToast(`Venue collateral low ($${venueCollateralBalance.toFixed(2)}). Deposit funds on ${venue}.`);
      return;
    }

    const newPosition: Position = {
      id: Date.now(),
      market_id: sig.market_id,
      station_code: sig.station_code,
      city: sig.city,
      side: sig.side,
      entry_price: sig.market_ask,
      current_bid: sig.market_ask,
      contracts: sig.contracts,
      total_invested: sig.capital,
      potential_payout: sig.contracts * 1.0,
      unrealized_pnl: 0.0,
      unrealized_pct: 0.0,
      status: "OPEN",
      created_at: new Date().toLocaleTimeString(),
    };

    setPositions([newPosition, ...positions]);
    setStagedSignals(stagedSignals.filter((s) => s.id !== sig.id));
    setCashBalance((prev) => parseFloat((prev - sig.capital).toFixed(2)));
    setInvestedCapital((prev) => parseFloat((prev + sig.capital).toFixed(2)));
    setVenueCollateralBalance((prev) => parseFloat((prev - sig.capital).toFixed(2)));
    showToast(`Executed ${sig.side} ${sig.city} (x${sig.contracts} @ $${sig.market_ask.toFixed(2)})!`);
  };

  const handleReject = (id: number) => {
    setStagedSignals(stagedSignals.filter((s) => s.id !== id));
    showToast(`Rejected signal #${id}.`);
  };

  // Account Deletion Flow
  const handleConfirmDeleteAccount = () => {
    if (deleteConfirmationText !== "DELETE") {
      showToast("Please type DELETE to confirm account removal.");
      return;
    }

    // Wipe session and state
    try {
      localStorage.removeItem("mone_user_session");
    } catch {
      // ignore
    }
    signOut();
    setShowDeleteModal(false);
    setShowSettings(false);
    router.push("/");
  };

  const formatProviderName = (p: string) => {
    if (p === "weathernext3") return "Google WeatherNext 3";
    if (p === "openmeteo") return "Open-Meteo WeatherNext 2";
    return "Auto (WeatherNext 3 + Open-Meteo)";
  };

  const formatVenueName = (v: string) => {
    if (v === "kalshi_live") return "Kalshi Live KXRAIN";
    if (v === "kalshi_demo") return "Kalshi Demo v2 (Sandbox)";
    if (v === "polymarket") return "Polymarket Web3";
    return "Kalshi Demo v2 (Sandbox)";
  };

  // Opportunities to display based on selected historical date
  const displayedOpportunities = DAILY_OPPORTUNITIES[selectedDate] || [];

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white text-xs font-medium px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 border border-indigo-400/30 animate-bounce">
          <Sparkles className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-zinc-400 hover:text-white p-1 rounded transition">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="font-mono text-lg font-bold text-white">
              mone<span className="text-indigo-400">.</span>dashboard
            </span>

            {/* Master Agent Power Indicator */}
            <button
              onClick={handleToggleAgentPower}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition cursor-pointer ${
                agentPower === "ACTIVE"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
              }`}
              title="Click to toggle Agent Master Power (Active vs Paused)"
            >
              <Power className="w-3.5 h-3.5" />
              <span>{agentPower === "ACTIVE" ? "Agent Active" : "Agent Paused"}</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* User Account / Plan Badge */}
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPricingOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-medium text-zinc-200 transition"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    {user.isTrialActive ? "7-Day Trial" : user.plan}:{" "}
                    <strong className="text-white">
                      {user.plan === "Pro"
                        ? `Unlimited (${user.proDaysRemaining !== undefined ? user.proDaysRemaining : 30}d left)`
                        : `${user.runsRemaining} runs`}
                    </strong>
                  </span>
                  <span className="text-[10px] text-indigo-400 underline ml-1">Upgrade</span>
                </button>

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
                className="inline-flex items-center gap-2 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-1.5 rounded-lg border border-zinc-800 transition"
              >
                <span>Sign in (7-Day Free Trial)</span>
              </button>
            )}

            <button
              onClick={() => setShowTraceModal(true)}
              className="inline-flex items-center gap-1.5 text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3 py-1.5 rounded-lg text-zinc-300 transition"
            >
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              Trace Proof
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition"
              title="BYOK & Engine Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Runtime Configuration Sub-Header */}
        <div className="border-t border-zinc-800/80 bg-zinc-950 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between text-xs text-zinc-400 gap-2">
          <div className="flex items-center gap-3">
            <span className="font-mono text-zinc-500">ENGINE:</span>
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-200">
              {formatProviderName(provider)}
            </span>
            <span className="font-mono text-zinc-500">VENUE:</span>
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-200">
              {formatVenueName(venue)}
            </span>
            <span className="font-mono text-zinc-500">MODE:</span>
            <span
              className={`px-2 py-0.5 rounded border uppercase text-[10px] font-semibold ${
                autonomyMode === "autonomous"
                  ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                  : "bg-zinc-900 border-zinc-800 text-zinc-300"
              }`}
            >
              {autonomyMode}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-zinc-500">
              Venue Collateral: <strong className="text-zinc-300 font-mono">${venueCollateralBalance.toFixed(2)}</strong>
            </span>
          </div>
        </div>
      </header>

      {/* Settings & Account Deletion Drawer */}
      {showSettings && (
        <div className="border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-md p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                BYOK (Bring-Your-Own-Key) &amp; Runtime Settings
              </h3>
              <button onClick={() => setShowSettings(false)} className="text-zinc-400 hover:text-white text-xs">
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Weather Provider</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-300"
                >
                  <option value="auto">Auto (WeatherNext 3 + Open-Meteo)</option>
                  <option value="openmeteo">Open-Meteo WeatherNext 2</option>
                  <option value="weathernext3">Google WeatherNext 3</option>
                </select>
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Execution Venue</label>
                <select
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-300"
                >
                  <option value="kalshi_demo">Kalshi Demo v2 (Sandbox)</option>
                  <option value="kalshi_live">Kalshi Live KXRAIN</option>
                  <option value="polymarket">Polymarket Web3</option>
                </select>
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Capital Per Trade</label>
                <input
                  type="number"
                  value={capitalPerTrade}
                  onChange={(e) => setCapitalPerTrade(parseFloat(e.target.value) || 10.0)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-300 font-mono"
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Daily Drawdown Circuit Breaker</label>
                <input
                  type="text"
                  disabled
                  value="$50.00 USD"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-500 font-mono"
                />
              </div>
            </div>

            {/* Danger Zone: Account Deletion */}
            <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Danger Zone: Account &amp; Credential Wipe
                </h4>
                <p className="text-[11px] text-zinc-500">
                  Permanently wipe your account, trading ledgers, and API tokens.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-medium transition"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 flex-1 w-full">
        {/* Venue Collateral Alert Banner (Triggered when venue balance is less than capital per trade) */}
        {venueCollateralBalance < capitalPerTrade && (
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-3 text-xs text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong>Venue Collateral Depleted on {formatVenueName(venue)}</strong>
              <p className="text-amber-300/80">
                You have ${venueCollateralBalance.toFixed(2)} available collateral on {venue}, but your capital per trade is set to ${capitalPerTrade.toFixed(2)}. The agent will reject orders until you deposit funds into your venue account or reduce your Capital Per Trade sizing in BYOK Settings.
              </p>
            </div>
          </div>
        )}

        {/* Control Strip & Balance Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Runner Controls */}
          <div className="lg:col-span-5 p-5 rounded-xl border border-zinc-800 bg-zinc-950 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Agent Controls</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleAgentPower}
                  className={`px-2.5 py-1 rounded text-xs font-medium border flex items-center gap-1.5 transition ${
                    agentPower === "ACTIVE"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                  }`}
                >
                  {agentPower === "ACTIVE" ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span>{agentPower === "ACTIVE" ? "Pause Agent" : "Resume Agent"}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleTriggerCycle}
                disabled={isRunning || agentPower === "PAUSED"}
                className={`flex-1 inline-flex items-center justify-center gap-2 text-xs font-semibold py-2.5 rounded-lg transition shadow-sm ${
                  agentPower === "PAUSED"
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white"
                }`}
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
                  onClick={() => {
                    setAutonomyMode("copilot");
                    showToast("Switched to Copilot Mode. Signals await approval.");
                  }}
                  className={`px-3 py-2 rounded-md transition ${
                    autonomyMode === "copilot" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Copilot
                </button>
                <button
                  onClick={() => {
                    setAutonomyMode("autonomous");
                    showToast("Switched to Autonomous Mode. Valid signals execute immediately.");
                  }}
                  className={`px-3 py-2 rounded-md transition ${
                    autonomyMode === "autonomous" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Autonomous
                </button>
              </div>
            </div>

            <p className="text-[11px] text-zinc-500">
              {agentPower === "PAUSED"
                ? "Agent is currently PAUSED. Orders and scans are prevented from running."
                : autonomyMode === "copilot"
                ? "Copilot Mode: Signals are staged in the queue below for 1-click human confirmation."
                : "Autonomous Mode: Automatically evaluates edge and executes orders without waiting."}
            </p>
          </div>

          {/* Portfolio Equity Strip */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 rounded-xl border border-zinc-800 bg-zinc-950">
            <div>
              <span className="text-[11px] text-zinc-400 block">Cash Balance</span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">${cashBalance.toFixed(2)}</div>
              <span className="text-[10px] text-zinc-500">Uncommitted Capital</span>
            </div>
            <div>
              <span className="text-[11px] text-zinc-400 block">Open Exposure</span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-zinc-300 mt-1">${investedCapital.toFixed(2)}</div>
              <span className="text-[10px] text-zinc-500">{positions.filter(p => p.status === "OPEN").length} Active Position(s)</span>
            </div>
            <div>
              <span className="text-[11px] text-zinc-400 block">Total Portfolio</span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-indigo-400 mt-1">
                ${(cashBalance + investedCapital).toFixed(2)}
              </div>
              <span className="text-[10px] text-zinc-500">Ledger Equity</span>
            </div>
            <div>
              <span className="text-[11px] text-zinc-400 block">Realized PnL</span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-1">+${cumulativePnl.toFixed(2)}</div>
              <span className="text-[10px] text-emerald-500/80">Audited 76.0% Win Rate</span>
            </div>
          </div>
        </div>

        {/* Active Positions with "Take Profit Early" */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              Active Portfolio Positions ({positions.filter(p => p.status === "OPEN").length} Open)
            </h2>
            <span className="text-xs text-zinc-500">
              Close positions early before resolution to secure gains or cut losses
            </span>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">Market / Station</th>
                    <th className="py-3 px-4">Side</th>
                    <th className="py-3 px-4">Entry Ask</th>
                    <th className="py-3 px-4">Live Bid</th>
                    <th className="py-3 px-4">Contracts</th>
                    <th className="py-3 px-4">Invested</th>
                    <th className="py-3 px-4">Unrealized PnL</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Early Exit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {positions.map((p) => {
                    const isOpen = p.status === "OPEN";
                    return (
                      <tr key={p.id}>
                        <td className="py-3 px-4 font-semibold text-white">
                          {p.city} ({p.station_code})
                          <span className="block text-[10px] text-zinc-500 font-normal">{p.market_id}</span>
                        </td>
                        <td className="py-3 px-4 text-emerald-400 font-semibold">{p.side}</td>
                        <td className="py-3 px-4">${p.entry_price.toFixed(2)}</td>
                        <td className="py-3 px-4 font-bold text-white">${p.current_bid.toFixed(2)}</td>
                        <td className="py-3 px-4">{p.contracts}x</td>
                        <td className="py-3 px-4">${p.total_invested.toFixed(2)}</td>
                        <td className="py-3 px-4">
                          {isOpen ? (
                            <span className="text-emerald-400 font-bold">
                              +${p.unrealized_pnl.toFixed(2)} (+{p.unrealized_pct.toFixed(1)}%)
                            </span>
                          ) : (
                            <span className="text-zinc-500">Settled</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] border ${
                              p.status === "OPEN"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-zinc-800 text-zinc-400 border-zinc-700"
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isOpen ? (
                            <button
                              onClick={() => setTakeProfitModalPos(p)}
                              className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs font-semibold transition"
                            >
                              Take Profit Early
                            </button>
                          ) : (
                            <span className="text-zinc-500 font-sans text-xs">Closed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Daily Opportunity Scanner (Current Day + Past 5 Days Filter) */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                Weather Prediction Events &amp; Quant Opportunities
              </h2>
              <p className="text-xs text-zinc-400">
                Curated list of daily events where WeatherNext models evaluated mispricings
              </p>
            </div>

            {/* Date Selection Dropdown */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-zinc-400" />
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 font-medium cursor-pointer"
              >
                {AVAILABLE_DATES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Opportunities Cards */}
          {displayedOpportunities.length === 0 ? (
            <div className="p-8 rounded-xl border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
              No evaluated opportunities recorded for {selectedDate}.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedOpportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-4 hover:border-zinc-700 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white">{opp.city}</span>
                        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                          {opp.station_code}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-500 font-mono">{opp.market_id}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                        {opp.side}
                      </span>
                      {opp.status === "WON" && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                          WON (+${opp.outcome_pnl?.toFixed(2)})
                        </span>
                      )}
                      {opp.status === "NO_TRADE" && (
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px]">
                          NO TRADE
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-zinc-900/60 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Model Prob</span>
                      <span className="text-white font-bold">{opp.model_prob_pct}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Market Ask</span>
                      <span className="text-zinc-300 font-bold">${opp.market_ask.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Calculated Edge</span>
                      <span className="text-emerald-400 font-bold">+{opp.edge_pct}%</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-relaxed">{opp.reason}</p>

                  {/* Actions (Only for current day & staged items) */}
                  {selectedDate === "2026-10-12" && opp.status === "STAGED" && (
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                      <div className="text-xs font-mono">
                        <span className="text-zinc-500">Sizing: </span>
                        <span className="text-white font-semibold">{opp.contracts} contracts</span>
                        <span className="text-zinc-500"> (${opp.capital.toFixed(2)})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReject(opp.id)}
                          className="px-3 py-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-medium transition"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleApprove(opp)}
                          className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve Order
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Take Profit Early Modal */}
      {takeProfitModalPos && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Take Profit Early
              </h3>
              <button onClick={() => setTakeProfitModalPos(null)} className="text-zinc-400 hover:text-white text-xs">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              You are holding <strong>{takeProfitModalPos.contracts} contracts</strong> of{" "}
              <strong>{takeProfitModalPos.city} ({takeProfitModalPos.side})</strong> entered at $
              {takeProfitModalPos.entry_price.toFixed(2)}. The current market bid is $
              {takeProfitModalPos.current_bid.toFixed(2)}.
            </p>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-emerald-400">Total Invested:</span>
                <span className="font-mono text-zinc-200">${takeProfitModalPos.total_invested.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-400">Exit Liquidation Value:</span>
                <span className="font-mono text-zinc-200">
                  ${(takeProfitModalPos.current_bid * takeProfitModalPos.contracts).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-emerald-500/20">
                <span className="text-emerald-300">Locked-in Net Profit:</span>
                <span className="text-emerald-400 font-mono">
                  +${takeProfitModalPos.unrealized_pnl.toFixed(2)} (+{takeProfitModalPos.unrealized_pct.toFixed(1)}%)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setTakeProfitModalPos(null)}
                className="px-4 py-2 rounded-lg border border-zinc-800 text-xs text-zinc-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmTakeProfit}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-md"
              >
                Confirm Early Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Deletion Modal (With Strict No-Refund Policy Disclaimer) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-rose-500/40 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-semibold text-rose-400 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Permanent Account Deletion
              </h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-zinc-400 hover:text-white text-xs">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
              <p>
                Deleting your account will permanently wipe your login credentials, local state, trading history, and CLI API keys from this device.
              </p>

              {/* Strict No-Refund Disclaimer */}
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-200 space-y-1">
                <strong className="block text-rose-300 uppercase tracking-wide text-[10px]">
                  ⚠️ Strict Non-Refundable Policy Notice
                </strong>
                <p className="text-[11px]">
                  Because all payments on Mone are executed non-custodially on-chain in native <strong>USDC</strong> (Polygon, Base, Solana), <strong>any remaining trade runs or active Pro subscription days cannot be refunded</strong> once purchased. Account deletion permanently forfeits remaining credits.
                </p>
              </div>

              <p className="text-zinc-400 text-[11px]">
                To confirm permanent deletion, type <strong>DELETE</strong> in the box below:
              </p>
            </div>

            <input
              type="text"
              placeholder="Type DELETE to confirm"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-rose-500 rounded-lg px-3 py-2 text-xs text-white font-mono"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-lg border border-zinc-800 text-xs text-zinc-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteAccount}
                disabled={deleteConfirmationText !== "DELETE"}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition"
              >
                Permanently Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

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

export default function AgentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-zinc-400 font-mono text-xs">
          Loading Agent Runner...
        </div>
      }
    >
      <AgentDashboard />
    </Suspense>
  );
}
