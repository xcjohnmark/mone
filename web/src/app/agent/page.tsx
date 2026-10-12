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
import { BrandLogo } from "../../components/ui/BrandLogo";
import { ThemeToggle } from "../../components/ui/ThemeToggle";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../../components/ui/Card";
import { Switch } from "../../components/ui/Switch";
import { Tabs } from "../../components/ui/Tabs";

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
      reason: "Lake effect band yielded 0.22 inches; settled YES",
      outcome_pnl: 23.10,
    },
  ],
  "2026-10-09": [
    {
      id: 1,
      station_code: "CLISEA",
      city: "Seattle",
      target_date: "2026-10-09",
      market_id: "KXRAIN-26OCT09-SEA",
      model_prob_pct: 82.0,
      market_ask: 0.65,
      edge_pct: 17.0,
      side: "YES",
      contracts: 15,
      capital: 9.75,
      status: "LOST",
      reason: "Precipitation occurred 3 miles south of station sensor (0.00 trace)",
      outcome_pnl: -9.75,
    },
  ],
  "2026-10-08": [
    {
      id: 101,
      station_code: "CLIBOS",
      city: "Boston",
      target_date: "2026-10-08",
      market_id: "KXRAIN-26OCT08-BOS",
      model_prob_pct: 88.0,
      market_ask: 0.40,
      edge_pct: 48.0,
      side: "YES",
      contracts: 25,
      capital: 10.00,
      status: "WON",
      reason: "Coastal front produced 0.44 inches; settled YES",
      outcome_pnl: 15.00,
    },
  ],
  "2026-10-07": [
    {
      id: 102,
      station_code: "CLIDFW",
      city: "Dallas/Fort Worth",
      target_date: "2026-10-07",
      market_id: "KXRAIN-26OCT07-DFW",
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
  const { user, setIsPricingOpen, signOut } = useAuth();

  // Settings & Autonomy Controls
  const [isAgentActive, setIsAgentActive] = useState<boolean>(true);
  const [autonomyMode, setAutonomyMode] = useState<"AUTONOMOUS" | "COPILOT">("AUTONOMOUS");
  const [selectedDate, setSelectedDate] = useState<string>("2026-10-12");
  const [activeTab, setActiveTab] = useState<"opportunities" | "positions" | "settings">("opportunities");

  // Venue Real Balance State
  const [venueBalance, setVenueBalance] = useState<number>(4.50);
  const [capitalPerTrade, setCapitalPerTrade] = useState<number>(10.00);

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
      total_invested: 9.60,
      potential_payout: 20.00,
      unrealized_pnl: 4.80,
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
      total_invested: 9.00,
      potential_payout: 50.00,
      unrealized_pnl: 8.50,
      unrealized_pct: 94.4,
      status: "OPEN",
      created_at: "Today, 09:15 UTC",
    },
  ]);

  // Modals
  const [earlyExitPosition, setEarlyExitPosition] = useState<Position | null>(null);
  const [isExitSubmitting, setIsExitSubmitting] = useState(false);
  const [exitNotification, setExitNotification] = useState<string | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Update opportunities when date dropdown changes
  useEffect(() => {
    setOpportunities(DAILY_OPPORTUNITIES[selectedDate] || []);
  }, [selectedDate]);

  // Handle Take Profit Early
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
    } catch (e) {
      console.error(e);
    } finally {
      setIsExitSubmitting(false);
    }
  };

  // Handle Account Deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== "DELETE") return;
    setIsDeleting(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      signOut();
      localStorage.clear();
      router.push("/?deleted=true");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const isLowCollateral = venueBalance < capitalPerTrade;

  return (
    <div className="min-h-screen bg-[var(--geist-background)] text-[var(--geist-foreground)] font-satoshi flex flex-col selection:bg-[var(--geist-selection)]">
      {/* 80px Top Navigation Bar (Glider Blueprint Standard) */}
      <header className="sticky top-0 z-40 border-b border-[var(--brand-border-subtle)] bg-[var(--brand-glass)] backdrop-blur-md transition-all duration-200">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 h-[80px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BrandLogo size="md" href="/agent" />
            <div className="h-6 w-px bg-[var(--brand-border-subtle)] hidden sm:block" />

            {/* Master Agent Power Toggle */}
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-brand-card border border-[var(--brand-border-subtle)] bg-[var(--brand-card-bg)] backdrop-blur-md shadow-brand-soft">
              <Switch
                checked={isAgentActive}
                onCheckedChange={setIsAgentActive}
                activeColor="emerald"
                id="agent-master-switch"
              />
              <span className="text-xs font-semibold font-satoshi flex items-center gap-1.5">
                <span
                  className={`size-2 rounded-full ${
                    isAgentActive
                      ? "bg-emerald-500 animate-pulse"
                      : "bg-[var(--ds-gray-500)]"
                  }`}
                />
                {isAgentActive ? "AGENT ACTIVE" : "PAUSED"}
              </span>
            </div>

            {/* Autonomy Switch */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-brand-card border border-[var(--brand-border-subtle)] bg-[var(--brand-card-bg)] backdrop-blur-md shadow-brand-soft">
              <span className="text-xs text-[var(--ds-gray-900)]">Mode:</span>
              <button
                onClick={() =>
                  setAutonomyMode((prev) =>
                    prev === "AUTONOMOUS" ? "COPILOT" : "AUTONOMOUS"
                  )
                }
                className={`text-xs font-semibold px-2.5 py-1 rounded-brand-card transition-all duration-200 ${
                  autonomyMode === "AUTONOMOUS"
                    ? "bg-[var(--ds-blue-700)] text-white shadow-sm"
                    : "bg-[var(--ds-gray-200)] text-[var(--geist-foreground)]"
                }`}
              >
                {autonomyMode}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* 40px Standard Height Date Dropdown */}
            <div className="relative">
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="appearance-none bg-[var(--brand-card-bg)] border border-[var(--brand-border-subtle)] text-[var(--geist-foreground)] text-xs font-medium rounded-brand-card pl-3 pr-8 h-10 focus:outline-none focus:ring-1 focus:ring-[var(--ds-focus-color)] cursor-pointer shadow-brand-soft transition-all duration-200 hover:border-[var(--brand-border)]"
              >
                {AVAILABLE_DATES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="size-3.5 text-[var(--ds-gray-900)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <ThemeToggle />

            {/* User Plan Pill */}
            {user && (
              <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--brand-border-subtle)] bg-[var(--brand-card-bg)] backdrop-blur-md shadow-brand-soft text-xs">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-[var(--geist-foreground)]">
                  {user.plan}
                </span>
                <span className="text-[var(--ds-gray-900)] tabular-nums">
                  (
                  {user.plan === "Pro"
                    ? `${user.proDaysRemaining ?? 30}d`
                    : `${user.runsRemaining} left`}
                  )
                </span>
              </div>
            )}

            <Button
              variant="outline"
              size="icon"
              onClick={signOut}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="size-4 text-[var(--ds-gray-900)]" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container (1440px Max Width with 16px Grid System) */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8 flex-1 w-full space-y-6">
        {/* Early Exit Notification Banner */}
        {exitNotification && (
          <div className="p-4 rounded-brand-card border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-xs flex items-center justify-between shadow-brand-soft">
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

        {/* Venue Collateral Awareness Alert */}
        {isLowCollateral && (
          <div className="p-4 rounded-brand-card border border-amber-500/30 bg-amber-500/10 text-amber-500 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-brand-soft">
            <div className="flex items-start sm:items-center gap-3">
              <AlertTriangle className="size-5 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <span className="font-semibold block sm:inline font-outfit">
                  INSUFFICIENT VENUE COLLATERAL:{" "}
                </span>
                <span>
                  Available Kalshi balance is{" "}
                  <strong className="tabular-nums font-mono">
                    ${venueBalance.toFixed(2)}
                  </strong>
                  , but configured capital per trade requires{" "}
                  <strong className="tabular-nums font-mono">
                    ${capitalPerTrade.toFixed(2)}
                  </strong>
                  . Autonomous order execution halted to protect capital.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="https://kalshi.com/account/deposit"
                target="_blank"
                rel="noreferrer"
              >
                <Button variant="default" size="md" className="text-xs bg-amber-500 text-black hover:bg-amber-400 font-semibold">
                  Deposit Collateral
                </Button>
              </a>
            </div>
          </div>
        )}

        {/* 4 Metric KPI Cards (16px Grid Rhythm) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 tabular-nums">
          <Card className="p-4">
            <div className="flex items-center justify-between text-xs text-[var(--ds-gray-900)] mb-1">
              <span>Venue Balance</span>
              <DollarSign className="size-4" />
            </div>
            <div className="font-outfit text-2xl font-bold text-[var(--geist-foreground)]">
              ${venueBalance.toFixed(2)}
            </div>
            <div className="text-[11px] text-[var(--ds-gray-900)] mt-1">
              Kalshi Demo BYOK
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between text-xs text-[var(--ds-gray-900)] mb-1">
              <span>Realized Day PnL</span>
              <TrendingUp className="size-4 text-emerald-500" />
            </div>
            <div className="font-outfit text-2xl font-bold text-emerald-500">
              +$28.76
            </div>
            <div className="text-[11px] text-emerald-500 mt-1">
              +14.2% daily yield
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between text-xs text-[var(--ds-gray-900)] mb-1">
              <span>Audited Win Rate</span>
              <Activity className="size-4 text-[var(--ds-blue-700)]" />
            </div>
            <div className="font-outfit text-2xl font-bold text-[var(--geist-foreground)]">
              76.8%
            </div>
            <div className="text-[11px] text-[var(--ds-gray-900)] mt-1">
              22 NWS stations
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between text-xs text-[var(--ds-gray-900)] mb-1">
              <span>Remaining Runs</span>
              <Sparkles className="size-4 text-amber-500" />
            </div>
            <div className="font-outfit text-2xl font-bold text-[var(--geist-foreground)]">
              {user?.plan === "Pro"
                ? `Unlimited (${user.proDaysRemaining ?? 30}d)`
                : `${user?.runsRemaining ?? 37}`}
            </div>
            <div className="text-[11px] text-[var(--ds-blue-700)] mt-1">
              <button
                onClick={() => setIsPricingOpen(true)}
                className="hover:underline cursor-pointer"
              >
                Top up USDC runs &rarr;
              </button>
            </div>
          </Card>
        </div>

        {/* Segmented Control Navigation */}
        <div className="flex items-center justify-between border-b border-[var(--brand-border-subtle)] pb-4">
          <Tabs
            size="md"
            value={activeTab}
            onValueChange={(val) =>
              setActiveTab(val as "opportunities" | "positions" | "settings")
            }
            items={[
              {
                id: "opportunities",
                label: (
                  <span className="flex items-center gap-2">
                    <Activity className="size-4" />
                    Curated Daily Signals ({opportunities.length})
                  </span>
                ),
              },
              {
                id: "positions",
                label: (
                  <span className="flex items-center gap-2">
                    <Layers className="size-4" />
                    Active Positions (
                    {positions.filter((p) => p.status === "OPEN").length})
                  </span>
                ),
              },
              {
                id: "settings",
                label: (
                  <span className="flex items-center gap-2">
                    <Settings className="size-4" />
                    Settings &amp; Danger Zone
                  </span>
                ),
              },
            ]}
          />
        </div>

        {/* Tab 1: Curated Daily Opportunities */}
        {activeTab === "opportunities" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-outfit text-lg font-bold text-[var(--geist-foreground)]">
                  Evaluated Precipitation Alpha for {selectedDate}
                </h2>
                <p className="font-satoshi text-xs text-[var(--ds-gray-900)]">
                  Filtered specifically for evaluated contracts where WeatherNext calculated probability spread.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {opportunities.map((opp) => (
                <Card
                  key={opp.id}
                  className="p-5 space-y-4 hover:border-[var(--brand-border)] transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-outfit font-bold text-base text-[var(--geist-foreground)]">
                          {opp.city}
                        </span>
                        <Badge variant="secondary" className="font-mono text-[10px]">
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
                      dot={opp.status === "EXECUTED" || opp.status === "STAGED"}
                    >
                      {opp.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-3 rounded-brand-card bg-[var(--brand-card-bg)] border border-[var(--brand-border-subtle)] text-xs tabular-nums">
                    <div>
                      <span className="text-[var(--ds-gray-900)] block text-[10px]">
                        WeatherNext Prob
                      </span>
                      <span className="font-semibold text-[var(--geist-foreground)]">
                        {opp.model_prob_pct}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--ds-gray-900)] block text-[10px]">
                        Market Ask
                      </span>
                      <span className="font-semibold text-[var(--geist-foreground)]">
                        ${opp.market_ask.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--ds-gray-900)] block text-[10px]">
                        Calculated Edge
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
                    <strong className="text-[var(--geist-foreground)] font-satoshi">
                      Decision Rationale:{" "}
                    </strong>
                    {opp.reason}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[var(--brand-border-subtle)] text-xs tabular-nums">
                    <span className="text-[var(--ds-gray-900)]">
                      Capital Allocation:{" "}
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
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Active Positions & Early Profit Exit */}
        {activeTab === "positions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-outfit text-lg font-bold text-[var(--geist-foreground)]">
                  Live Contract Positions
                </h2>
                <p className="font-satoshi text-xs text-[var(--ds-gray-900)]">
                  Real-time market mark-to-market. Lock in profits early before market expiration.
                </p>
              </div>
            </div>

            <div className="rounded-brand-card border border-[var(--brand-border-subtle)] bg-[var(--brand-card-bg)] backdrop-blur-md overflow-hidden shadow-brand-soft">
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
                        className="hover:bg-[var(--ds-gray-200)]/40 transition-colors duration-200"
                      >
                        <td className="p-4">
                          <span className="font-semibold text-[var(--geist-foreground)] block">
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
                        <td className="p-4 font-semibold text-[var(--ds-blue-700)]">
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
                              size="md"
                              onClick={() => setEarlyExitPosition(pos)}
                              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                            >
                              Take Profit Early
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

        {/* Tab 3: Settings & Danger Zone */}
        {activeTab === "settings" && (
          <div className="space-y-6 max-w-3xl">
            <Card className="p-6 space-y-4">
              <h3 className="font-outfit text-base font-bold text-[var(--geist-foreground)]">
                Autonomous Execution Risk Limits
              </h3>
              <p className="font-satoshi text-xs text-[var(--ds-gray-900)]">
                Protect your account against volatile meteorological deviations and exchange slippage.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs tabular-nums">
                <div className="space-y-1">
                  <label className="text-[var(--ds-gray-900)]">
                    Capital Allocation Per Trade
                  </label>
                  <input
                    type="number"
                    value={capitalPerTrade}
                    onChange={(e) => setCapitalPerTrade(parseFloat(e.target.value) || 10)}
                    className="w-full h-10 bg-[var(--brand-card-bg)] border border-[var(--brand-border-subtle)] rounded-brand-card px-3 text-xs text-[var(--geist-foreground)] focus:ring-1 focus:ring-[var(--ds-focus-color)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[var(--ds-gray-900)]">
                    Daily Loss Circuit Breaker
                  </label>
                  <input
                    type="text"
                    defaultValue="$50.00 max daily drawdown"
                    disabled
                    className="w-full h-10 bg-[var(--ds-gray-200)] border border-[var(--brand-border-subtle)] rounded-brand-card px-3 text-xs text-[var(--ds-gray-900)] cursor-not-allowed"
                  />
                </div>
              </div>
            </Card>

            {/* Danger Zone: Account Deletion */}
            <Card className="p-6 border-rose-500/30 bg-rose-500/5 space-y-4">
              <div className="flex items-center gap-2 text-rose-500">
                <Trash2 className="size-5" />
                <h3 className="font-outfit text-base font-bold">
                  Danger Zone: Account Deletion
                </h3>
              </div>
              <p className="font-satoshi text-xs text-[var(--ds-gray-900)] leading-relaxed">
                Permanently delete your account, session records, and API credentials from the system.
              </p>
              <div className="p-3.5 rounded-brand-card border border-rose-500/20 bg-rose-500/10 text-xs text-rose-500 font-medium">
                ⚠️ Strict Non-Refundable Crypto Policy: Decentralized USDC payments and remaining plan runs are final and non-refundable upon account deletion.
              </div>
              <Button
                variant="destructive"
                size="md"
                onClick={() => setIsDeleteModalOpen(true)}
                className="text-xs font-semibold"
              >
                Delete Account &amp; Wipe Credentials
              </Button>
            </Card>
          </div>
        )}
      </main>

      {/* Take Profit Early Modal */}
      {earlyExitPosition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <Card className="w-full max-w-md p-6 space-y-5 bg-[var(--brand-glass)] border-[var(--brand-border)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--brand-border-subtle)] pb-3">
              <h3 className="font-outfit font-bold text-lg text-[var(--geist-foreground)]">
                Take Profit Early
              </h3>
              <button
                onClick={() => setEarlyExitPosition(null)}
                className="text-[var(--ds-gray-900)] hover:text-[var(--geist-foreground)] p-1 rounded-full"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="font-satoshi text-xs text-[var(--ds-gray-900)]">
              Sell your active position back to the market order book at current bid to lock in gains before settlement:
            </p>

            <div className="p-4 rounded-brand-card bg-[var(--brand-card-bg)] border border-[var(--brand-border-subtle)] space-y-2 text-xs tabular-nums">
              <div className="flex justify-between">
                <span className="text-[var(--ds-gray-900)]">Market:</span>
                <span className="font-semibold text-[var(--geist-foreground)]">
                  {earlyExitPosition.city} ({earlyExitPosition.side})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--ds-gray-900)]">Contracts:</span>
                <span className="font-semibold">{earlyExitPosition.contracts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--ds-gray-900)]">Entry Price:</span>
                <span>${earlyExitPosition.entry_price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--ds-gray-900)]">Current Bid:</span>
                <span className="font-bold text-[var(--ds-blue-700)]">
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
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="md"
                isLoading={isExitSubmitting}
                onClick={handleTakeProfitEarly}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                Confirm Early Sell
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Account Deletion Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <Card className="w-full max-w-md p-6 space-y-5 bg-[var(--brand-glass)] border-rose-500/40 shadow-2xl">
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
              <div className="p-3.5 rounded-brand-card border border-rose-500/30 bg-rose-500/10 text-rose-500 font-semibold leading-relaxed">
                ⚠️ NON-REFUNDABLE POLICY: Any remaining USDC subscription time or run passes are permanently forfeit and cannot be refunded.
              </div>
              <p>
                To confirm, type <strong className="text-[var(--geist-foreground)]">DELETE</strong> in the box below:
              </p>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="DELETE"
                className="w-full h-10 bg-[var(--brand-card-bg)] border border-[var(--brand-border-subtle)] rounded-brand-card px-3 text-sm text-[var(--geist-foreground)] font-mono focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="md"
                disabled={deleteConfirmationText !== "DELETE"}
                isLoading={isDeleting}
                onClick={handleDeleteAccount}
              >
                Delete Forever
              </Button>
            </div>
          </Card>
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
