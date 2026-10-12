"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Play,
  Pause,
  ShieldCheck,
  Check,
  X,
  Settings,
  Activity,
  Layers,
  Sparkles,
  User,
  LogOut,
  DollarSign,
  TrendingUp,
  Trash2,
  Calendar,
  ChevronDown,
  LayoutDashboard,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Sliders,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { BrandLogo } from "../../components/ui/BrandLogo";
import { ThemeToggle } from "../../components/ui/ThemeToggle";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { Switch } from "../../components/ui/Switch";

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

const AVAILABLE_DATES = [
  { value: "2026-10-12", label: "Today — Oct 12, 2026", isCurrent: true },
  { value: "2026-10-11", label: "Yesterday — Oct 11, 2026", isCurrent: false },
  { value: "2026-10-10", label: "Oct 10, 2026", isCurrent: false },
  { value: "2026-10-09", label: "Oct 09, 2026", isCurrent: false },
  { value: "2026-10-08", label: "Oct 08, 2026", isCurrent: false },
  { value: "2026-10-07", label: "Oct 07, 2026", isCurrent: false },
];

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
      status: "EXECUTED",
      reason: "Ensemble convergence: 61 of 63 members show >0.05in rain",
    },
    {
      id: 6,
      station_code: "CLISAT",
      city: "San Antonio",
      target_date: "2026-10-12",
      market_id: "KXRAIN-26OCT12-SAT",
      model_prob_pct: 85.7,
      market_ask: 0.18,
      edge_pct: 67.7,
      side: "YES",
      contracts: 50,
      capital: 9.00,
      status: "EXECUTED",
      reason: "Large market dislocation: Ask 18¢ while radar confirms storm front",
    },
    {
      id: 5,
      station_code: "CLIDEN",
      city: "Denver",
      target_date: "2026-10-12",
      market_id: "KXRAIN-26OCT12-DEN",
      model_prob_pct: 48.0,
      market_ask: 0.52,
      edge_pct: -4.0,
      side: "NO",
      contracts: 0,
      capital: 0.00,
      status: "NO_TRADE",
      reason: "Edge below 5.0% threshold (Calculated edge: -4.0%). Trade rejected.",
    },
  ],
  "2026-10-11": [
    {
      id: 4,
      station_code: "CLIMIA",
      city: "Miami",
      target_date: "2026-10-11",
      market_id: "KXRAIN-26OCT11-MIA",
      model_prob_pct: 91.2,
      market_ask: 0.38,
      edge_pct: 53.2,
      side: "YES",
      contracts: 26,
      capital: 9.88,
      status: "WON",
      reason: "Tropical wave precipitation settled positive at 1.12 inches",
      outcome_pnl: 16.12,
    },
    {
      id: 3,
      station_code: "CLILAX",
      city: "Los Angeles",
      target_date: "2026-10-11",
      market_id: "KXRAIN-26OCT11-LAX",
      model_prob_pct: 3.5,
      market_ask: 0.22,
      edge_pct: 74.5,
      side: "NO",
      contracts: 12,
      capital: 9.36,
      status: "WON",
      reason: "Zero rain front verified; settled NO at 0.00 inches",
      outcome_pnl: 2.64,
    },
  ],
  "2026-10-10": [
    {
      id: 2,
      station_code: "CLIORD",
      city: "Chicago (O'Hare)",
      target_date: "2026-10-10",
      market_id: "KXRAIN-26OCT10-ORD",
      model_prob_pct: 78.4,
      market_ask: 0.30,
      edge_pct: 48.4,
      side: "YES",
      contracts: 33,
      capital: 9.90,
      status: "WON",
      reason: "Frontal system delivered 0.42 inches; contract resolved YES",
      outcome_pnl: 23.10,
    },
    {
      id: 1,
      station_code: "CLIDFW",
      city: "Dallas/Fort Worth",
      target_date: "2026-10-10",
      market_id: "KXRAIN-26OCT10-DFW",
      model_prob_pct: 94.0,
      market_ask: 0.50,
      edge_pct: 44.0,
      side: "YES",
      contracts: 20,
      capital: 10.00,
      status: "WON",
      reason: "Supercell convection confirmed at DFW airport; settled YES",
      outcome_pnl: 10.00,
    },
  ],
};

function AgentDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signInWithGoogle, setIsPricingOpen, signOut } = useAuth();

  // Allow guest exploration if requested
  const [guestMode, setGuestMode] = useState<boolean>(false);

  // Sidebar navigation state
  const [activeNav, setActiveNav] = useState<
    "overview" | "signals" | "positions" | "settings"
  >("overview");

  // Settings & Autonomy Controls
  const [isAgentActive, setIsAgentActive] = useState<boolean>(true);
  const [autonomyMode, setAutonomyMode] = useState<"AUTONOMOUS" | "COPILOT">(
    "AUTONOMOUS"
  );
  const [selectedDate, setSelectedDate] = useState<string>("2026-10-12");

  // Venue Balance State (Default to $1,000 demo sandbox)
  const [venueBalance, setVenueBalance] = useState<number>(1000.0);
  const [capitalPerTrade, setCapitalPerTrade] = useState<number>(10.0);

  // Opportunities and Positions State
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>(
    DAILY_OPPORTUNITIES["2026-10-12"] || []
  );

  const [positions, setPositions] = useState<Position[]>([
    {
      id: 101,
      market_id: "KXRAIN-26OCT12-HOU",
      station_code: "CLIHOU",
      city: "Houston (HOU)",
      side: "YES",
      entry_price: 0.48,
      current_bid: 0.72,
      contracts: 20,
      total_invested: 9.6,
      potential_payout: 20.0,
      unrealized_pnl: 4.8,
      unrealized_pct: 50.0,
      status: "OPEN",
      created_at: "Today, 08:30 UTC",
    },
    {
      id: 102,
      market_id: "KXRAIN-26OCT12-SAT",
      station_code: "CLISAT",
      city: "San Antonio (SATX)",
      side: "YES",
      entry_price: 0.18,
      current_bid: 0.35,
      contracts: 50,
      total_invested: 9.0,
      potential_payout: 50.0,
      unrealized_pnl: 8.5,
      unrealized_pct: 94.4,
      status: "OPEN",
      created_at: "Today, 09:15 UTC",
    },
  ]);

  // Modals
  const [earlyExitPosition, setEarlyExitPosition] = useState<Position | null>(
    null
  );
  const [isExitSubmitting, setIsExitSubmitting] = useState(false);
  const [exitNotification, setExitNotification] = useState<string | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setOpportunities(DAILY_OPPORTUNITIES[selectedDate] || []);
  }, [selectedDate]);

  const handleTakeProfitEarly = async () => {
    if (!earlyExitPosition) return;
    setIsExitSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      const closedPnl = earlyExitPosition.unrealized_pnl;
      const closedProceeds = earlyExitPosition.total_invested + closedPnl;

      setPositions((prev) =>
        prev.map((p) =>
          p.id === earlyExitPosition.id
            ? { ...p, status: "CLOSED_EARLY" as const, unrealized_pnl: closedPnl }
            : p
        )
      );

      setExitNotification(
        `Successfully closed ${earlyExitPosition.city} at $${earlyExitPosition.current_bid.toFixed(2)}. Net proceeds: $${closedProceeds.toFixed(2)} (+${closedPnl >= 0 ? "+" : ""}$${closedPnl.toFixed(2)} profit locked).`
      );
      setEarlyExitPosition(null);
    } finally {
      setIsExitSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== "DELETE") return;
    setIsDeleting(true);
    try {
      await fetch("/api/user/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user?.email }),
      }).catch(() => null);

      signOut();
      localStorage.clear();
      router.push("/?deleted=true");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  // If user is not logged in and not in guest mode, show the clean Auth Gate
  if (!user && !guestMode) {
    return (
      <div className="min-h-screen bg-[var(--geist-background)] text-[var(--geist-foreground)] flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-card-bg)] shadow-2xl space-y-6 text-center">
          <div className="flex justify-center">
            <BrandLogo size="md" />
          </div>

          <div className="space-y-2">
            <h2 className="font-outfit text-2xl font-bold tracking-tight">
              Sign in to Mone Dashboard
            </h2>
            <p className="text-xs text-[var(--ds-gray-900)] max-w-xs mx-auto leading-relaxed">
              Connect your account to access autonomous weather prediction trading, historical signals, and risk controls.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-[var(--brand-border-subtle)] bg-[var(--brand-glass)] text-xs text-emerald-500 font-semibold flex items-center justify-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            7-Day Free Trial Included (50 Runs)
          </div>

          <div className="space-y-3 pt-2">
            <Button
              variant="default"
              size="lg"
              onClick={signInWithGoogle}
              className="w-full gap-3 text-xs font-semibold rounded-xl"
            >
              <svg className="size-4 shrink-0" viewBox="0 0 24 24">
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
              Sign in with Google
            </Button>

            <button
              onClick={() => setGuestMode(true)}
              className="w-full py-2.5 rounded-xl border border-[var(--brand-border-subtle)] text-xs text-[var(--ds-gray-900)] hover:text-[var(--geist-foreground)] hover:bg-[var(--brand-glass)] transition"
            >
              Continue in Demo Sandbox Mode &rarr;
            </button>
          </div>

          <div className="pt-2">
            <Link
              href="/"
              className="text-xs text-[var(--ds-gray-900)] hover:text-[var(--geist-foreground)] transition"
            >
              &larr; Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--geist-background)] text-[var(--geist-foreground)] font-satoshi flex selection:bg-[var(--geist-selection)]">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-[var(--brand-border-subtle)] bg-[var(--brand-glass)] backdrop-blur-md hidden md:flex flex-col justify-between shrink-0 h-screen sticky top-0 p-5">
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--brand-border-subtle)]">
            <BrandLogo size="sm" href="/" />
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveNav("overview")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                activeNav === "overview"
                  ? "bg-[var(--brand-card-bg)] text-[var(--geist-foreground)] border border-[var(--brand-border)] shadow-sm"
                  : "text-[var(--ds-gray-900)] hover:text-[var(--geist-foreground)] hover:bg-[var(--brand-border-subtle)]"
              }`}
            >
              <LayoutDashboard className="size-4" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveNav("signals")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                activeNav === "signals"
                  ? "bg-[var(--brand-card-bg)] text-[var(--geist-foreground)] border border-[var(--brand-border)] shadow-sm"
                  : "text-[var(--ds-gray-900)] hover:text-[var(--geist-foreground)] hover:bg-[var(--brand-border-subtle)]"
              }`}
            >
              <Activity className="size-4" />
              <span>Signals &amp; Execution</span>
            </button>

            <button
              onClick={() => setActiveNav("positions")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                activeNav === "positions"
                  ? "bg-[var(--brand-card-bg)] text-[var(--geist-foreground)] border border-[var(--brand-border)] shadow-sm"
                  : "text-[var(--ds-gray-900)] hover:text-[var(--geist-foreground)] hover:bg-[var(--brand-border-subtle)]"
              }`}
            >
              <Layers className="size-4" />
              <span>Positions &amp; Portfolio</span>
            </button>

            <button
              onClick={() => setActiveNav("settings")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                activeNav === "settings"
                  ? "bg-[var(--brand-card-bg)] text-[var(--geist-foreground)] border border-[var(--brand-border)] shadow-sm"
                  : "text-[var(--ds-gray-900)] hover:text-[var(--geist-foreground)] hover:bg-[var(--brand-border-subtle)]"
              }`}
            >
              <Settings className="size-4" />
              <span>Settings &amp; Risk</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer: Profile & Plan */}
        <div className="pt-4 border-t border-[var(--brand-border-subtle)] space-y-3">
          <div className="p-3 rounded-xl border border-[var(--brand-border-subtle)] bg-[var(--brand-card-bg)] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold truncate max-w-[120px]">
                {user ? user.name || user.email : "Demo User"}
              </span>
              <Badge variant="success" className="text-[10px] font-mono">
                {user ? user.plan : "Sandbox"}
              </Badge>
            </div>
            <div className="text-[11px] text-[var(--ds-gray-900)] flex items-center justify-between">
              <span>Runs Remaining:</span>
              <strong className="text-[var(--geist-foreground)] tabular-nums">
                {user?.plan === "Pro"
                  ? `Unlimited (${user.proDaysRemaining ?? 30}d)`
                  : user?.runsRemaining ?? 50}
              </strong>
            </div>
            <button
              onClick={() => setIsPricingOpen(true)}
              className="w-full py-1.5 rounded-lg border border-[var(--brand-border-subtle)] text-[11px] font-semibold text-[var(--geist-foreground)] hover:bg-[var(--brand-glass)] transition text-center"
            >
              Top Up Runs
            </button>
          </div>

          <div className="flex items-center justify-between">
            <ThemeToggle />
            {user ? (
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="text-xs gap-1.5 rounded-lg"
              >
                <LogOut className="size-3.5" /> Sign Out
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={signInWithGoogle}
                className="text-xs rounded-lg"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-[72px] border-b border-[var(--brand-border-subtle)] bg-[var(--brand-glass)] backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <div className="md:hidden">
              <BrandLogo size="sm" />
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="font-outfit font-bold text-sm uppercase tracking-wider text-[var(--geist-foreground)]">
                {activeNav === "overview" && "Dashboard Overview"}
                {activeNav === "signals" && "Signals & Execution"}
                {activeNav === "positions" && "Positions & Portfolio"}
                {activeNav === "settings" && "Agent Settings"}
              </span>
            </div>

            {/* Mobile Nav Tabs */}
            <div className="flex md:hidden items-center gap-1">
              <button
                onClick={() => setActiveNav("overview")}
                className={`p-2 rounded-lg text-xs ${
                  activeNav === "overview" ? "bg-[var(--brand-card-bg)] font-bold" : ""
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveNav("signals")}
                className={`p-2 rounded-lg text-xs ${
                  activeNav === "signals" ? "bg-[var(--brand-card-bg)] font-bold" : ""
                }`}
              >
                Signals
              </button>
              <button
                onClick={() => setActiveNav("positions")}
                className={`p-2 rounded-lg text-xs ${
                  activeNav === "positions" ? "bg-[var(--brand-card-bg)] font-bold" : ""
                }`}
              >
                Positions
              </button>
              <button
                onClick={() => setActiveNav("settings")}
                className={`p-2 rounded-lg text-xs ${
                  activeNav === "settings" ? "bg-[var(--brand-card-bg)] font-bold" : ""
                }`}
              >
                Settings
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Agent Active Toggle */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--brand-border-subtle)] bg-[var(--brand-card-bg)] text-xs">
              <Switch
                checked={isAgentActive}
                onCheckedChange={setIsAgentActive}
                activeColor="emerald"
                id="header-switch"
              />
              <span className="font-semibold flex items-center gap-1.5">
                <span
                  className={`size-2 rounded-full ${
                    isAgentActive
                      ? "bg-emerald-500 animate-pulse"
                      : "bg-[var(--ds-gray-400)]"
                  }`}
                />
                <span className="hidden sm:inline">
                  {isAgentActive ? "AGENT ACTIVE" : "PAUSED"}
                </span>
              </span>
            </div>

            {/* Autonomy Mode Toggle */}
            <button
              onClick={() =>
                setAutonomyMode((prev) =>
                  prev === "AUTONOMOUS" ? "COPILOT" : "AUTONOMOUS"
                )
              }
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition ${
                autonomyMode === "AUTONOMOUS"
                  ? "bg-[var(--geist-foreground)] text-[var(--geist-background)] border-[var(--geist-foreground)]"
                  : "bg-[var(--brand-card-bg)] text-[var(--geist-foreground)] border-[var(--brand-border-subtle)]"
              }`}
            >
              {autonomyMode}
            </button>

            {/* Date Dropdown */}
            <div className="relative">
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="appearance-none bg-[var(--brand-card-bg)] border border-[var(--brand-border-subtle)] text-[var(--geist-foreground)] text-xs font-medium rounded-xl pl-3 pr-7 h-9 focus:outline-none focus:ring-1 focus:ring-[var(--ds-focus-color)] cursor-pointer"
              >
                {AVAILABLE_DATES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="size-3 text-[var(--ds-gray-900)] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-6 md:p-8 space-y-6 flex-1 max-w-7xl w-full">
          {/* Early Exit Notification Banner */}
          {exitNotification && (
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-xs flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Check className="size-4 shrink-0" />
                <span>{exitNotification}</span>
              </span>
              <button
                onClick={() => setExitNotification(null)}
                className="text-emerald-500 hover:text-emerald-400 p-1"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          {/* SECTION 1: OVERVIEW */}
          {activeNav === "overview" && (
            <div className="space-y-6">
              {/* 4 KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 tabular-nums">
                <div className="p-5 rounded-2xl border border-[var(--brand-border-subtle)] bg-[var(--brand-card-bg)] space-y-2">
                  <div className="flex items-center justify-between text-xs text-[var(--ds-gray-900)]">
                    <span>Venue Balance</span>
                    <DollarSign className="size-4" />
                  </div>
                  <div className="font-outfit text-3xl font-bold">
                    ${venueBalance.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-[var(--ds-gray-900)]">
                    Kalshi Demo BYOK
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-[var(--brand-border-subtle)] bg-[var(--brand-card-bg)] space-y-2">
                  <div className="flex items-center justify-between text-xs text-[var(--ds-gray-900)]">
                    <span>Realized Day PnL</span>
                    <TrendingUp className="size-4 text-emerald-500" />
                  </div>
                  <div className="font-outfit text-3xl font-bold text-emerald-500">
                    +$28.76
                  </div>
                  <div className="text-[11px] text-emerald-500">
                    +14.2% daily yield
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-[var(--brand-border-subtle)] bg-[var(--brand-card-bg)] space-y-2">
                  <div className="flex items-center justify-between text-xs text-[var(--ds-gray-900)]">
                    <span>Audited Win Rate</span>
                    <Activity className="size-4" />
                  </div>
                  <div className="font-outfit text-3xl font-bold">
                    76.8%
                  </div>
                  <div className="text-[11px] text-[var(--ds-gray-900)]">
                    22 NWS stations
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-[var(--brand-border-subtle)] bg-[var(--brand-card-bg)] space-y-2">
                  <div className="flex items-center justify-between text-xs text-[var(--ds-gray-900)]">
                    <span>Remaining Runs</span>
                    <Sparkles className="size-4 text-amber-500" />
                  </div>
                  <div className="font-outfit text-3xl font-bold">
                    {user?.plan === "Pro"
                      ? `Unlimited (${user.proDaysRemaining ?? 30}d)`
                      : `${user?.runsRemaining ?? 50}`}
                  </div>
                  <div className="text-[11px]">
                    <button
                      onClick={() => setIsPricingOpen(true)}
                      className="underline text-[var(--ds-gray-900)] hover:text-[var(--geist-foreground)]"
                    >
                      Top up USDC runs &rarr;
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Status / Recent Opportunities */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-outfit font-bold text-base">
                    Active Evaluated Signals
                  </h3>
                  <button
                    onClick={() => setActiveNav("signals")}
                    className="text-xs text-[var(--ds-gray-900)] hover:text-[var(--geist-foreground)] underline"
                  >
                    View all signals &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {opportunities.slice(0, 2).map((opp) => (
                    <div
                      key={opp.id}
                      className="p-5 rounded-2xl border border-[var(--brand-border-subtle)] bg-[var(--brand-card-bg)] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-outfit font-bold text-base">
                          {opp.city}{" "}
                          <span className="font-mono text-xs text-[var(--ds-gray-900)]">
                            ({opp.station_code})
                          </span>
                        </div>
                        <Badge
                          variant={
                            opp.status === "WON"
                              ? "success"
                              : opp.status === "EXECUTED"
                              ? "blue"
                              : opp.status === "STAGED"
                              ? "warning"
                              : "secondary"
                          }
                        >
                          {opp.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-2 p-3 rounded-xl border border-[var(--brand-border-subtle)] bg-[var(--brand-glass)] text-xs tabular-nums text-center">
                        <div>
                          <span className="block text-[10px] text-[var(--ds-gray-900)]">
                            WeatherNext
                          </span>
                          <span className="font-bold">{opp.model_prob_pct}%</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-[var(--ds-gray-900)]">
                            Market Ask
                          </span>
                          <span className="font-bold">
                            ${opp.market_ask.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-[var(--ds-gray-900)]">
                            Edge
                          </span>
                          <span className="font-bold text-emerald-500">
                            +{opp.edge_pct}%
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-[var(--ds-gray-900)] leading-relaxed">
                        {opp.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: SIGNALS & EXECUTION */}
          {activeNav === "signals" && (
            <div className="space-y-4">
              <div>
                <h2 className="font-outfit text-xl font-bold">
                  Evaluated Precipitation Alpha for {selectedDate}
                </h2>
                <p className="text-xs text-[var(--ds-gray-900)]">
                  Filtered contracts where WeatherNext calculated statistical edge against order books.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {opportunities.map((opp) => (
                  <div
                    key={opp.id}
                    className="p-5 rounded-2xl border border-[var(--brand-border-subtle)] bg-[var(--brand-card-bg)] space-y-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-outfit font-bold text-base">
                            {opp.city}
                          </span>
                          <Badge
                            variant="secondary"
                            className="font-mono text-[10px]"
                          >
                            {opp.station_code}
                          </Badge>
                        </div>
                        <div className="font-mono text-xs text-[var(--ds-gray-900)] mt-0.5">
                          {opp.market_id}
                        </div>
                      </div>

                      <Badge
                        variant={
                          opp.status === "WON"
                            ? "success"
                            : opp.status === "LOST"
                            ? "error"
                            : opp.status === "EXECUTED"
                            ? "blue"
                            : opp.status === "STAGED"
                            ? "warning"
                            : "secondary"
                        }
                      >
                        {opp.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[var(--brand-glass)] border border-[var(--brand-border-subtle)] text-xs tabular-nums text-center">
                      <div>
                        <span className="text-[var(--ds-gray-900)] block text-[10px]">
                          WeatherNext
                        </span>
                        <span className="font-semibold">
                          {opp.model_prob_pct}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[var(--ds-gray-900)] block text-[10px]">
                          Market Ask
                        </span>
                        <span className="font-semibold">
                          ${opp.market_ask.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[var(--ds-gray-900)] block text-[10px]">
                          Edge
                        </span>
                        <span
                          className={`font-semibold ${
                            opp.edge_pct > 0
                              ? "text-emerald-500"
                              : "text-[var(--ds-gray-900)]"
                          }`}
                        >
                          {opp.edge_pct > 0 ? `+${opp.edge_pct}%` : `${opp.edge_pct}%`}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-[var(--ds-gray-900)] leading-relaxed">
                      <strong className="text-[var(--geist-foreground)]">
                        Rationale:{" "}
                      </strong>
                      {opp.reason}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[var(--brand-border-subtle)] text-xs tabular-nums">
                      <span className="text-[var(--ds-gray-900)]">
                        Allocation:{" "}
                        <strong className="text-[var(--geist-foreground)]">
                          ${opp.capital.toFixed(2)}
                        </strong>{" "}
                        ({opp.contracts} contracts)
                      </span>
                      {opp.outcome_pnl !== undefined && (
                        <span
                          className={`font-semibold ${
                            opp.outcome_pnl >= 0 ? "text-emerald-500" : "text-rose-500"
                          }`}
                        >
                          Settled PnL: {opp.outcome_pnl >= 0 ? "+" : ""}$
                          {opp.outcome_pnl.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 3: POSITIONS & PORTFOLIO */}
          {activeNav === "positions" && (
            <div className="space-y-4">
              <div>
                <h2 className="font-outfit text-xl font-bold">
                  Active Contract Positions
                </h2>
                <p className="text-xs text-[var(--ds-gray-900)]">
                  Live mark-to-market positions. Take profit early to lock in gains before expiration.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--brand-border-subtle)] bg-[var(--brand-card-bg)] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs tabular-nums">
                    <thead className="bg-[var(--brand-glass)] border-b border-[var(--brand-border-subtle)] text-[var(--ds-gray-900)]">
                      <tr>
                        <th className="p-4 font-medium">Market / Station</th>
                        <th className="p-4 font-medium">Side</th>
                        <th className="p-4 font-medium">Contracts</th>
                        <th className="p-4 font-medium">Entry Price</th>
                        <th className="p-4 font-medium">Current Bid</th>
                        <th className="p-4 font-medium">Invested</th>
                        <th className="p-4 font-medium">Unrealized PnL</th>
                        <th className="p-4 font-medium text-right">Early Exit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--brand-border-subtle)]">
                      {positions.map((pos) => (
                        <tr
                          key={pos.id}
                          className="hover:bg-[var(--brand-glass)] transition-colors"
                        >
                          <td className="p-4">
                            <span className="font-semibold block">
                              {pos.city}
                            </span>
                            <span className="font-mono text-[11px] text-[var(--ds-gray-900)]">
                              {pos.market_id}
                            </span>
                          </td>
                          <td className="p-4">
                            <Badge
                              variant={pos.side === "YES" ? "success" : "warning"}
                              className="font-bold text-[10px]"
                            >
                              {pos.side}
                            </Badge>
                          </td>
                          <td className="p-4 font-medium">{pos.contracts}</td>
                          <td className="p-4">${pos.entry_price.toFixed(2)}</td>
                          <td className="p-4 font-semibold">
                            ${pos.current_bid.toFixed(2)}
                          </td>
                          <td className="p-4">${pos.total_invested.toFixed(2)}</td>
                          <td className="p-4">
                            <span
                              className={`font-semibold ${
                                pos.unrealized_pnl >= 0
                                  ? "text-emerald-500"
                                  : "text-rose-500"
                              }`}
                            >
                              {pos.unrealized_pnl >= 0 ? "+" : ""}$
                              {pos.unrealized_pnl.toFixed(2)} (
                              {pos.unrealized_pct >= 0 ? "+" : ""}
                              {pos.unrealized_pct.toFixed(1)}%)
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {pos.status === "OPEN" ? (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => setEarlyExitPosition(pos)}
                                className="text-xs rounded-xl font-semibold"
                              >
                                Take Profit
                              </Button>
                            ) : (
                              <Badge variant="secondary">CLOSED EARLY</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: SETTINGS & RISK */}
          {activeNav === "settings" && (
            <div className="space-y-6 max-w-3xl">
              <div className="p-6 rounded-2xl border border-[var(--brand-border-subtle)] bg-[var(--brand-card-bg)] space-y-4">
                <h3 className="font-outfit text-base font-bold">
                  Autonomous Execution Limits
                </h3>
                <p className="text-xs text-[var(--ds-gray-900)]">
                  Configure risk guardrails to protect capital against volatility and slippage.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs tabular-nums">
                  <div className="space-y-1">
                    <label className="text-[var(--ds-gray-900)] block">
                      Capital Allocation Per Trade ($)
                    </label>
                    <input
                      type="number"
                      value={capitalPerTrade}
                      onChange={(e) =>
                        setCapitalPerTrade(parseFloat(e.target.value) || 10)
                      }
                      className="w-full h-10 bg-[var(--brand-glass)] border border-[var(--brand-border-subtle)] rounded-xl px-3 text-xs text-[var(--geist-foreground)] focus:ring-1 focus:ring-[var(--ds-focus-color)]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[var(--ds-gray-900)] block">
                      Daily Drawdown Circuit Breaker
                    </label>
                    <input
                      type="text"
                      defaultValue="$50.00 max daily loss"
                      disabled
                      className="w-full h-10 bg-[var(--brand-glass)] border border-[var(--brand-border-subtle)] rounded-xl px-3 text-xs text-[var(--ds-gray-900)] cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Danger Zone: Account Deletion */}
              <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-500/5 space-y-4">
                <div className="flex items-center gap-2 text-rose-500">
                  <Trash2 className="size-5" />
                  <h3 className="font-outfit text-base font-bold">
                    Danger Zone: Delete Account
                  </h3>
                </div>
                <p className="text-xs text-[var(--ds-gray-900)] leading-relaxed">
                  Permanently remove your account, active sessions, and local configuration.
                </p>
                <Button
                  variant="destructive"
                  size="md"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="text-xs font-semibold rounded-xl"
                >
                  Delete Account
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Take Profit Early Modal */}
      {earlyExitPosition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 space-y-5 rounded-2xl bg-[var(--brand-card-bg)] border border-[var(--brand-border)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--brand-border-subtle)] pb-3">
              <h3 className="font-outfit font-bold text-lg">
                Take Profit Early
              </h3>
              <button
                onClick={() => setEarlyExitPosition(null)}
                className="text-[var(--ds-gray-900)] hover:text-[var(--geist-foreground)] p-1 rounded-full"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--ds-gray-900)]">
              Sell your active position back to the market order book at current bid to lock in gains before settlement:
            </p>

            <div className="p-4 rounded-xl bg-[var(--brand-glass)] border border-[var(--brand-border-subtle)] space-y-2 text-xs tabular-nums">
              <div className="flex justify-between">
                <span className="text-[var(--ds-gray-900)]">Market:</span>
                <span className="font-semibold">
                  {earlyExitPosition.city} ({earlyExitPosition.side})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--ds-gray-900)]">Contracts:</span>
                <span className="font-semibold">
                  {earlyExitPosition.contracts}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--ds-gray-900)]">Current Bid:</span>
                <span className="font-bold">
                  ${earlyExitPosition.current_bid.toFixed(2)}
                </span>
              </div>
              <div className="border-t border-[var(--brand-border-subtle)] pt-2 flex justify-between font-bold text-emerald-500">
                <span>Net Gain to Lock:</span>
                <span>
                  +${earlyExitPosition.unrealized_pnl.toFixed(2)} (+
                  {earlyExitPosition.unrealized_pct.toFixed(1)}%)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setEarlyExitPosition(null)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="md"
                isLoading={isExitSubmitting}
                onClick={handleTakeProfitEarly}
                className="rounded-xl text-xs font-semibold"
              >
                Confirm Early Sell
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Account Deletion Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 space-y-5 rounded-2xl bg-[var(--brand-card-bg)] border border-rose-500/40 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--brand-border-subtle)] pb-3">
              <div className="flex items-center gap-2 text-rose-500">
                <AlertTriangle className="size-5" />
                <h3 className="font-outfit font-bold text-lg">
                  Confirm Account Deletion
                </h3>
              </div>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-[var(--ds-gray-900)] hover:text-[var(--geist-foreground)] p-1 rounded-full"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[var(--ds-gray-900)]">
              <p>
                This action is irreversible. All stored venue credentials, session states, and trade records will be permanently wiped.
              </p>
              <p>
                To confirm, type <strong className="text-[var(--geist-foreground)]">DELETE</strong> below:
              </p>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="DELETE"
                className="w-full h-10 bg-[var(--brand-glass)] border border-[var(--brand-border-subtle)] rounded-xl px-3 text-sm text-[var(--geist-foreground)] font-mono focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsDeleteModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="md"
                disabled={deleteConfirmationText !== "DELETE"}
                isLoading={isDeleting}
                onClick={handleDeleteAccount}
                className="rounded-xl text-xs font-semibold"
              >
                Delete Forever
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AgentDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--geist-background)] flex items-center justify-center text-xs text-[var(--ds-gray-900)]">
          Loading mone dashboard...
        </div>
      }
    >
      <AgentDashboardContent />
    </Suspense>
  );
}
