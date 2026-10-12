"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
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
  LogOut,
  Globe,
  Radio,
  BarChart3,
  Lock,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { BrandLogo } from "../components/ui/BrandLogo";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/ui/Card";
import { Tabs } from "../components/ui/Tabs";
import { WeatherGlobe3D } from "../components/ui/WeatherGlobe3D";

export default function LandingPage() {
  const router = useRouter();
  const {
    user,
    signInWithGoogle,
    signOut,
    setIsPricingOpen,
    setIsCliModalOpen,
  } = useAuth();
  const [setupTab, setSetupTab] = useState<string>("globe");
  const [copied, setCopied] = useState(false);

  // In-hero configuration state
  const [provider, setProvider] = useState("auto");
  const [venue, setVenue] = useState("kalshi_demo");
  const [mode, setMode] = useState("copilot");

  const copyCliCommand = () => {
    navigator.clipboard.writeText(
      "pip install mone-agent\nmone doctor\nmone run --mode copilot\nmone serve --port 8000"
    );
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
    {
      city: "San Antonio (SATX)",
      code: "CLISAT",
      prob: 85.7,
      ask: 0.18,
      edge: "+67.7%",
      side: "BUY YES",
      venue: "Kalshi",
    },
    {
      city: "Houston (HOU)",
      code: "CLIHOU",
      prob: 98.4,
      ask: 0.48,
      edge: "+50.4%",
      side: "BUY YES",
      venue: "Kalshi",
    },
    {
      city: "Austin (AUS)",
      code: "CLIAUS",
      prob: 77.8,
      ask: 0.35,
      edge: "+42.8%",
      side: "BUY YES",
      venue: "Polymarket",
    },
    {
      city: "Las Vegas (LV)",
      code: "CLILAS",
      prob: 95.2,
      ask: 0.55,
      edge: "+40.2%",
      side: "BUY YES",
      venue: "Kalshi",
    },
    {
      city: "Los Angeles (LAX)",
      code: "CLILAX",
      prob: 4.2,
      ask: 0.22,
      edge: "+73.8%",
      side: "BUY NO",
      venue: "Polymarket",
    },
    {
      city: "Denver (DEN)",
      code: "CLIDEN",
      prob: 48.0,
      ask: 0.52,
      edge: "0.0%",
      side: "NEUTRAL",
      venue: "Kalshi",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[var(--geist-background)] text-[var(--geist-foreground)] font-satoshi selection:bg-[var(--geist-selection)]">
      {/* 80px Top Navigation Bar (Glider Blueprint Standard) */}
      <header className="sticky top-0 z-50 border-b border-[var(--brand-border-subtle)] bg-[var(--brand-glass)] backdrop-blur-md transition-all duration-200">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 h-[80px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BrandLogo size="md" />
            <Badge variant="blue" dot className="hidden md:inline-flex">
              WeatherNext 3 Engine
            </Badge>
          </div>

          <nav className="hidden lg:flex items-center gap-8 text-xs sm:text-sm font-medium text-[var(--ds-gray-900)]">
            <a
              href="#architecture"
              className="hover:text-[var(--geist-foreground)] transition-colors duration-200"
            >
              Architecture
            </a>
            <a
              href="#live-signals"
              className="hover:text-[var(--geist-foreground)] transition-colors duration-200"
            >
              Live Signals
            </a>
            <a
              href="#backtest"
              className="hover:text-[var(--geist-foreground)] transition-colors duration-200"
            >
              Backtest Audit
            </a>
            <button
              onClick={() => setIsPricingOpen(true)}
              className="hover:text-[var(--geist-foreground)] transition-colors duration-200 cursor-pointer text-left"
            >
              Pricing
            </button>
            <button
              onClick={() => setIsCliModalOpen(true)}
              className="hover:text-[var(--geist-foreground)] transition-colors duration-200 cursor-pointer text-left"
            >
              CLI Guide
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            {user ? (
              <div className="flex items-center gap-2.5">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--brand-card-bg)] border border-[var(--brand-border-subtle)] text-xs shadow-brand-soft">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-[var(--geist-foreground)]">
                    {user.plan}
                  </span>
                  <span className="text-[var(--ds-gray-900)] tabular-nums">
                    (
                    {user.plan === "Pro"
                      ? `Unlimited (${user.proDaysRemaining ?? 30}d)`
                      : `${user.runsRemaining} runs`}
                    )
                  </span>
                </div>
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
            ) : (
              <Button
                variant="secondary"
                size="md"
                onClick={signInWithGoogle}
                className="gap-2 text-xs"
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
                <span className="hidden sm:inline">Sign in</span>
              </Button>
            )}

            <Link href="/agent">
              <Button variant="default" size="md" className="gap-2 text-xs">
                Dashboard <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 overflow-hidden border-b border-[var(--brand-border-subtle)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Value Proposition */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--brand-border-subtle)] bg-[var(--brand-card-bg)] backdrop-blur-md shadow-brand-soft text-xs text-[var(--ds-gray-900)]">
                <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Google WeatherNext 3 × Kalshi &amp; Polymarket · 7-Day Trial</span>
              </div>

              <h1 className="font-outfit text-4xl sm:text-6xl font-bold tracking-tight text-[var(--geist-foreground)] leading-[1.06] text-balance">
                Autonomous weather edge for prediction markets.
              </h1>

              <p className="font-satoshi text-base sm:text-lg text-[var(--ds-gray-900)] max-w-2xl leading-relaxed text-pretty">
                mone continuously ingests Google DeepMind&apos;s 63-member ensemble
                forecasts, calculates statistical mispricings on daily precipitation
                contracts, and routes non-custodial orders across 22 NWS airport stations.
              </p>

              <div className="flex flex-wrap items-center gap-6 pt-1 text-xs text-[var(--ds-gray-900)] font-medium">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-5 text-emerald-500 shrink-0" />
                  <span>100% Non-Custodial (BYOK)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="size-5 text-[var(--ds-blue-700)] shrink-0" />
                  <span>Neatlogs Observability</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-5 text-emerald-500 shrink-0" />
                  <span className="tabular-nums">Audited 76.8% Win Rate</span>
                </div>
              </div>

              {/* 48px Touch Target CTAs (Glider Blueprint Standard) */}
              <div className="flex items-center gap-4 pt-2">
                <Link href="/agent">
                  <Button variant="default" size="lg" className="gap-2">
                    Open Web Dashboard <ArrowRight className="size-4" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setIsCliModalOpen(true)}
                  className="gap-2"
                >
                  <Terminal className="size-4" />
                  Install CLI
                </Button>
              </div>
            </div>

            {/* Right Column: 3D Weather Grid Globe with Interactive Tabs */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <Card className="w-full overflow-hidden">
                <div className="border-b border-[var(--brand-border-subtle)] bg-[var(--brand-glass)] px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-rose-500/80 inline-block" />
                    <span className="size-2.5 rounded-full bg-amber-500/80 inline-block" />
                    <span className="size-2.5 rounded-full bg-emerald-500/80 inline-block" />
                    <span className="ml-2 font-mono text-xs text-[var(--ds-gray-900)]">
                      weathernext_grid.glb
                    </span>
                  </div>
                  <Tabs
                    size="sm"
                    value={setupTab}
                    onValueChange={setSetupTab}
                    items={[
                      { id: "globe", label: "3D Grid" },
                      { id: "cli", label: "Terminal" },
                      { id: "web", label: "Runner" },
                    ]}
                  />
                </div>

                <div className="p-6 flex flex-col items-center justify-center min-h-[340px]">
                  {setupTab === "globe" ? (
                    <div className="w-full flex flex-col items-center">
                      <WeatherGlobe3D className="w-64 h-64 sm:w-72 sm:h-72" />
                      <div className="flex items-center justify-between w-full pt-4 border-t border-[var(--brand-border-subtle)] text-[11px] text-[var(--ds-gray-900)]">
                        <span className="flex items-center gap-1.5">
                          <span className="size-2 rounded-full bg-[var(--ds-blue-700)] animate-ping" />
                          22 Active Forecast Stations
                        </span>
                        <span className="tabular-nums font-mono">
                          LAT: 40.71°N · LON: 74.00°W
                        </span>
                      </div>
                    </div>
                  ) : setupTab === "cli" ? (
                    <div className="w-full space-y-4">
                      <p className="text-xs text-[var(--ds-gray-900)]">
                        Run the standalone autonomous Python engine locally or on your VPS:
                      </p>
                      <div className="relative rounded-brand-card bg-[var(--brand-card-bg)] p-4 font-mono text-xs text-[var(--geist-foreground)] border border-[var(--brand-border-subtle)]">
                        <pre className="overflow-x-auto space-y-1">
                          <span className="text-[var(--ds-gray-500)]">
                            # 1. Install mone agent package
                          </span>
                          <div>pip install mone-agent</div>
                          <span className="text-[var(--ds-gray-500)]">
                            # 2. Run diagnostics
                          </span>
                          <div>mone doctor</div>
                          <span className="text-[var(--ds-gray-500)]">
                            # 3. Launch autonomous trading
                          </span>
                          <div className="text-emerald-500 font-semibold">
                            mone run --mode autonomous
                          </div>
                        </pre>
                        <button
                          onClick={copyCliCommand}
                          className="absolute top-3 right-3 p-1.5 rounded-full border border-[var(--brand-border-subtle)] bg-[var(--brand-glass)] hover:bg-[var(--ds-gray-200)] text-[var(--ds-gray-900)] hover:text-[var(--geist-foreground)] transition-all duration-200"
                          title="Copy commands"
                        >
                          {copied ? (
                            <CheckCircle2 className="size-4 text-emerald-500" />
                          ) : (
                            <Copy className="size-4" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[var(--ds-gray-900)] pt-1">
                        <button
                          onClick={() => setIsCliModalOpen(true)}
                          className="text-[var(--ds-blue-700)] hover:underline inline-flex items-center gap-1 font-medium"
                        >
                          View complete CLI parameters <ChevronRight className="size-3" />
                        </button>
                        <span>v0.1.0-prod</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full space-y-4">
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-[var(--ds-gray-900)] block mb-1">
                            Weather Engine
                          </label>
                          <select
                            value={provider}
                            onChange={(e) => setProvider(e.target.value)}
                            className="w-full h-10 bg-[var(--brand-card-bg)] border border-[var(--brand-border-subtle)] rounded-brand-card px-3 text-xs text-[var(--geist-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-focus-color)]"
                          >
                            <option value="auto">WeatherNext 3 (Auto Failover)</option>
                            <option value="openmeteo">Open-Meteo Ensemble</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs text-[var(--ds-gray-900)] block mb-1">
                            Market Venue
                          </label>
                          <select
                            value={venue}
                            onChange={(e) => setVenue(e.target.value)}
                            className="w-full h-10 bg-[var(--brand-card-bg)] border border-[var(--brand-border-subtle)] rounded-brand-card px-3 text-xs text-[var(--geist-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-focus-color)]"
                          >
                            <option value="kalshi_demo">Kalshi Demo ($1,000 Sandbox)</option>
                            <option value="kalshi">Kalshi Live (Production)</option>
                            <option value="polymarket">Polymarket Live (Polygon)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs text-[var(--ds-gray-900)] block mb-1">
                            Execution Autonomy
                          </label>
                          <select
                            value={mode}
                            onChange={(e) => setMode(e.target.value)}
                            className="w-full h-10 bg-[var(--brand-card-bg)] border border-[var(--brand-border-subtle)] rounded-brand-card px-3 text-xs text-[var(--geist-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-focus-color)]"
                          >
                            <option value="autonomous">Full Autonomous</option>
                            <option value="copilot">Copilot (Manual Approval)</option>
                          </select>
                        </div>
                      </div>

                      <Button
                        variant="blue"
                        size="md"
                        onClick={handleLaunchWebRunner}
                        className="w-full text-xs font-semibold"
                      >
                        Launch Configured Dashboard
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Live Market Signals Showcase (56px Rhythmic Pacing) */}
      <section
        id="live-signals"
        className="py-14 border-b border-[var(--brand-border-subtle)] bg-[var(--brand-card-bg)]/40"
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-medium text-[var(--ds-blue-700)] mb-1">
                <Radio className="size-4 animate-pulse" /> Live Ingestion Feed
              </div>
              <h2 className="font-outfit text-2xl sm:text-3xl font-bold tracking-tight text-[var(--geist-foreground)]">
                Evaluated Market Opportunities
              </h2>
              <p className="font-satoshi text-xs sm:text-sm text-[var(--ds-gray-900)] mt-1">
                Sample evaluated airport stations where Google WeatherNext detected mathematical pricing edges.
              </p>
            </div>
            <Link href="/agent">
              <Button variant="outline" size="md" className="gap-1.5 text-xs">
                Inspect Real-Time Feed <ExternalLink className="size-4" />
              </Button>
            </Link>
          </div>

          {/* 16px Grid System (gap-4) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sampleStations.map((s, idx) => (
              <Card
                key={idx}
                className="hover:border-[var(--brand-border)] transition-all duration-200"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="font-outfit font-semibold text-sm text-[var(--geist-foreground)]">
                      {s.city}
                    </span>
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      {s.venue}
                    </Badge>
                  </div>
                  <CardDescription className="font-mono text-[11px]">
                    Contract: {s.code} · Precip &gt; 0.01&quot;
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-1">
                  <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-brand-card bg-[var(--brand-card-bg)] border border-[var(--brand-border-subtle)] tabular-nums">
                    <div>
                      <span className="text-[var(--ds-gray-900)] block text-[10px]">
                        WeatherNext Prob
                      </span>
                      <span className="font-semibold text-[var(--geist-foreground)]">
                        {s.prob}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--ds-gray-900)] block text-[10px]">
                        Market Ask
                      </span>
                      <span className="font-semibold text-[var(--geist-foreground)]">
                        ${s.ask.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span
                      className={`text-xs font-semibold tabular-nums ${
                        s.edge.startsWith("+")
                          ? "text-emerald-500"
                          : "text-[var(--ds-gray-900)]"
                      }`}
                    >
                      Edge: {s.edge}
                    </span>
                    <Badge
                      variant={
                        s.side === "BUY YES"
                          ? "success"
                          : s.side === "BUY NO"
                          ? "warning"
                          : "secondary"
                      }
                      className="text-[10px] font-bold"
                    >
                      {s.side}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture & Bento Grid (56px Pacing) */}
      <section id="architecture" className="py-14 border-b border-[var(--brand-border-subtle)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <Badge variant="outline">Engine Architecture</Badge>
            <h2 className="font-outfit text-3xl sm:text-4xl font-bold tracking-tight text-[var(--geist-foreground)] text-balance">
              High-resolution meteorological models wired to exchange books.
            </h2>
            <p className="font-satoshi text-sm text-[var(--ds-gray-900)] text-pretty">
              Built on Google DeepMind&apos;s global 0.25-degree grid with non-custodial execution and telemetry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 space-y-4">
              <div className="size-10 rounded-brand-card border border-[var(--brand-border-subtle)] bg-[var(--brand-card-bg)] flex items-center justify-center text-[var(--ds-blue-700)]">
                <Cpu className="size-5" />
              </div>
              <h3 className="font-outfit font-semibold text-lg text-[var(--geist-foreground)]">
                Google WeatherNext 3
              </h3>
              <p className="font-satoshi text-xs text-[var(--ds-gray-900)] leading-relaxed">
                Ingests 63 ensemble perturbations every 6 hours, computing spatial-temporal
                probability density functions across 22 NWS climate stations.
              </p>
            </Card>

            <Card className="p-6 space-y-4">
              <div className="size-10 rounded-brand-card border border-[var(--brand-border-subtle)] bg-[var(--brand-card-bg)] flex items-center justify-center text-emerald-500">
                <ShieldCheck className="size-5" />
              </div>
              <h3 className="font-outfit font-semibold text-lg text-[var(--geist-foreground)]">
                Non-Custodial BYOK
              </h3>
              <p className="font-satoshi text-xs text-[var(--ds-gray-900)] leading-relaxed">
                Bring Your Own Keys. Your Kalshi and Polymarket API credentials live in
                your local environment. Orders route directly from your machine.
              </p>
            </Card>

            <Card className="p-6 space-y-4">
              <div className="size-10 rounded-brand-card border border-[var(--brand-border-subtle)] bg-[var(--brand-card-bg)] flex items-center justify-center text-[var(--ds-blue-700)]">
                <Activity className="size-5" />
              </div>
              <h3 className="font-outfit font-semibold text-lg text-[var(--geist-foreground)]">
                Neatlogs Observability
              </h3>
              <p className="font-satoshi text-xs text-[var(--ds-gray-900)] leading-relaxed">
                Real-time execution telemetry, circuit-breaker alerts, and slippage monitoring
                streamed via structured OpenTelemetry logs into Neatlogs.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Backtest Audit Section (56px Pacing) */}
      <section
        id="backtest"
        className="py-14 border-b border-[var(--brand-border-subtle)] bg-[var(--brand-card-bg)]/40"
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
          <Card className="p-8 sm:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4">
                <Badge variant="success" dot>
                  Backtest Audit Complete
                </Badge>
                <h2 className="font-outfit text-2xl sm:text-3xl font-bold tracking-tight text-[var(--geist-foreground)]">
                  76.8% Audited Win Rate across 90-Day Weather Events
                </h2>
                <p className="font-satoshi text-xs sm:text-sm text-[var(--ds-gray-900)] leading-relaxed">
                  Evaluated on historical NOAA precipitation ground truth vs Kalshi settlement data.
                  The Kelly sizing circuit breaker capped maximum drawdown at 6.2%.
                </p>
              </div>

              <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-4 tabular-nums">
                <div className="p-4 rounded-brand-card border border-[var(--brand-border-subtle)] bg-[var(--brand-card-bg)] text-center shadow-brand-soft">
                  <span className="font-outfit text-2xl font-bold text-emerald-500 block">
                    76.8%
                  </span>
                  <span className="text-[11px] text-[var(--ds-gray-900)]">
                    Win Rate
                  </span>
                </div>
                <div className="p-4 rounded-brand-card border border-[var(--brand-border-subtle)] bg-[var(--brand-card-bg)] text-center shadow-brand-soft">
                  <span className="font-outfit text-2xl font-bold text-[var(--geist-foreground)] block">
                    2.41
                  </span>
                  <span className="text-[11px] text-[var(--ds-gray-900)]">
                    Sharpe Ratio
                  </span>
                </div>
                <div className="p-4 rounded-brand-card border border-[var(--brand-border-subtle)] bg-[var(--brand-card-bg)] text-center shadow-brand-soft">
                  <span className="font-outfit text-2xl font-bold text-[var(--geist-foreground)] block">
                    6.2%
                  </span>
                  <span className="text-[11px] text-[var(--ds-gray-900)]">
                    Max Drawdown
                  </span>
                </div>
                <div className="p-4 rounded-brand-card border border-[var(--brand-border-subtle)] bg-[var(--brand-card-bg)] text-center shadow-brand-soft">
                  <span className="font-outfit text-2xl font-bold text-[var(--ds-blue-700)] block">
                    +48.6%
                  </span>
                  <span className="text-[11px] text-[var(--ds-gray-900)]">
                    90d ROI
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Pricing Section (56px Pacing) */}
      <section id="pricing" className="py-14 border-b border-[var(--brand-border-subtle)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <Badge variant="blue">Native USDC Settlement</Badge>
            <h2 className="font-outfit text-3xl sm:text-4xl font-bold tracking-tight text-[var(--geist-foreground)]">
              Transparent, Decentralized Pricing
            </h2>
            <p className="font-satoshi text-sm text-[var(--ds-gray-900)]">
              Pay strictly in native USDC on Polygon, Base, or Solana. No credit card locks, no surprise billing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {/* Tier 1 */}
            <Card className="p-6 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-outfit font-semibold text-lg text-[var(--geist-foreground)]">
                    100 Runs Pass
                  </h3>
                  <Badge variant="secondary">Starter</Badge>
                </div>
                <div className="flex items-baseline gap-1 tabular-nums">
                  <span className="font-outfit text-3xl font-extrabold text-[var(--geist-foreground)]">
                    $10
                  </span>
                  <span className="text-xs text-[var(--ds-gray-900)]">
                    USDC one-time
                  </span>
                </div>
                <ul className="text-xs text-[var(--ds-gray-900)] space-y-2 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    <span>100 Automated Strategy Runs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    <span>WeatherNext 3 Multi-Station Ingestion</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    <span>Full CLI and Web Dashboard Access</span>
                  </li>
                </ul>
              </div>
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsPricingOpen(true)}
                className="w-full text-xs"
              >
                Buy 100 Runs
              </Button>
            </Card>

            {/* Tier 2: Popular */}
            <Card className="p-6 space-y-6 flex flex-col justify-between border-[var(--ds-blue-700)] shadow-md relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="blue" className="text-[10px] font-bold">
                  MOST POPULAR
                </Badge>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-outfit font-semibold text-lg text-[var(--geist-foreground)]">
                    300 Runs Pass
                  </h3>
                  <Badge variant="secondary">Pro Pack</Badge>
                </div>
                <div className="flex items-baseline gap-1 tabular-nums">
                  <span className="font-outfit text-3xl font-extrabold text-[var(--geist-foreground)]">
                    $25
                  </span>
                  <span className="text-xs text-[var(--ds-gray-900)]">
                    USDC one-time
                  </span>
                </div>
                <ul className="text-xs text-[var(--ds-gray-900)] space-y-2 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    <span>300 Automated Strategy Runs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    <span>Priority Ensemble Compute Queue</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    <span>Both Kalshi &amp; Polymarket Routing</span>
                  </li>
                </ul>
              </div>
              <Button
                variant="blue"
                size="md"
                onClick={() => setIsPricingOpen(true)}
                className="w-full text-xs"
              >
                Buy 300 Runs
              </Button>
            </Card>

            {/* Tier 3: Unlimited Pro */}
            <Card className="p-6 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-outfit font-semibold text-lg text-[var(--geist-foreground)]">
                    Pro Trader
                  </h3>
                  <Badge variant="secondary">30 Days</Badge>
                </div>
                <div className="flex items-baseline gap-1 tabular-nums">
                  <span className="font-outfit text-3xl font-extrabold text-[var(--geist-foreground)]">
                    $49
                  </span>
                  <span className="text-xs text-[var(--ds-gray-900)]">
                    USDC / 30 Days
                  </span>
                </div>
                <ul className="text-xs text-[var(--ds-gray-900)] space-y-2 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    <span>Unlimited Autonomous Executions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    <span>30-Day Pass (Early renewals stack)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    <span>Telegram &amp; Webhook Instant Signals</span>
                  </li>
                </ul>
              </div>
              <Button
                variant="default"
                size="md"
                onClick={() => setIsPricingOpen(true)}
                className="w-full text-xs"
              >
                Get 30-Day Pro Pass
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Minimalist Footer */}
      <footer className="py-12 border-t border-[var(--brand-border-subtle)] bg-[var(--brand-glass)] text-xs text-[var(--ds-gray-900)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" />
            <span>&copy; 2026 mone. Precision prediction market infrastructure.</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsCliModalOpen(true)}
              className="hover:text-[var(--geist-foreground)] transition-colors duration-200"
            >
              CLI Setup
            </button>
            <button
              onClick={() => setIsPricingOpen(true)}
              className="hover:text-[var(--geist-foreground)] transition-colors duration-200"
            >
              USDC Deposit
            </button>
            <a
              href="https://github.com/xcjohnmark/mone"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[var(--geist-foreground)] transition-colors duration-200"
            >
              GitHub
            </a>
            <span className="flex items-center gap-1.5 text-emerald-500 font-medium">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              All Systems Operational
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
