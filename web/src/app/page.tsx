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
  CheckCircle2,
  Copy,
  Activity,
  Layers,
  ChevronRight,
  Sparkles,
  LogOut,
  Globe,
  Info,
  Check,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { BrandLogo } from "../components/ui/BrandLogo";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { Tabs } from "../components/ui/Tabs";
import { WeatherGlobe3D } from "../components/ui/WeatherGlobe3D";
import { MarketCardCarousel } from "../components/MarketCardCarousel";
import { SetupAgentModal } from "../components/SetupAgentModal";

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
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [showRunsInfo, setShowRunsInfo] = useState(false);

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

  return (
    <div className="flex flex-col min-h-screen bg-[var(--geist-background)] text-[var(--geist-foreground)] font-satoshi selection:bg-[var(--geist-selection)]">
      {/* 80px Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-[var(--brand-border-subtle)] bg-[var(--brand-glass)] backdrop-blur-md transition-all duration-200">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 h-[80px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BrandLogo size="md" />
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs sm:text-sm font-medium text-[var(--ds-gray-900)]">
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
                className="gap-2 text-xs rounded-xl"
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
              <Button variant="default" size="md" className="gap-2 text-xs rounded-xl">
                Dashboard <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section (Centered, Clean Minimalist) */}
      <section className="relative pt-20 pb-20 overflow-hidden border-b border-[var(--brand-border-subtle)]">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-8 relative z-10 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--brand-border-subtle)] bg-[var(--brand-card-bg)] text-xs text-[var(--ds-gray-900)]">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Google WeatherNext × Prediction Markets · 7-Day Free Trial</span>
          </div>

          <h1 className="font-outfit text-5xl sm:text-7xl font-bold tracking-tight text-[var(--geist-foreground)] leading-[1.05] text-balance">
            Weather edge for prediction markets.
          </h1>

          <p className="font-satoshi text-base sm:text-lg text-[var(--ds-gray-900)] max-w-xl mx-auto leading-relaxed">
            Autonomous AI agent that models precipitation probabilities and executes mispriced opportunities on Polymarket and Kalshi.
          </p>

          {/* Centered CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Button
              variant="default"
              size="lg"
              onClick={() => setIsSetupModalOpen(true)}
              className="px-8 py-3.5 text-sm font-semibold rounded-2xl gap-2 shadow-lg"
            >
              Setup Agent <ArrowRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setIsCliModalOpen(true)}
              className="px-8 py-3.5 text-sm font-semibold rounded-2xl gap-2"
            >
              <Terminal className="size-4" /> View Guide
            </Button>
          </div>

          {/* Centered Visual Card */}
          <div className="pt-8 max-w-xl mx-auto">
            <Card className="w-full overflow-hidden rounded-2xl">
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

              <div className="p-6 flex flex-col items-center justify-center min-h-[320px]">
                {setupTab === "globe" ? (
                  <div className="w-full flex flex-col items-center">
                    <WeatherGlobe3D className="w-60 h-60 sm:w-64 sm:h-64" />
                    <div className="flex items-center justify-between w-full pt-4 border-t border-[var(--brand-border-subtle)] text-[11px] text-[var(--ds-gray-900)]">
                      <span className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                        22 Active Weather Stations
                      </span>
                      <span className="tabular-nums font-mono">
                        Global 0.25° Resolution
                      </span>
                    </div>
                  </div>
                ) : setupTab === "cli" ? (
                  <div className="w-full space-y-4 text-left">
                    <p className="text-xs text-[var(--ds-gray-900)]">
                      Run the autonomous agent package locally or on your cloud server:
                    </p>
                    <div className="relative rounded-xl bg-[var(--brand-card-bg)] p-4 font-mono text-xs text-[var(--geist-foreground)] border border-[var(--brand-border-subtle)]">
                      <pre className="overflow-x-auto space-y-1">
                        <span className="text-[var(--ds-gray-500)]">
                          # 1. Install mone package
                        </span>
                        <div>pip install mone-agent</div>
                        <span className="text-[var(--ds-gray-500)]">
                          # 2. Run diagnostics
                        </span>
                        <div>mone doctor</div>
                        <span className="text-[var(--ds-gray-500)]">
                          # 3. Launch trading
                        </span>
                        <div className="text-emerald-500 font-semibold">
                          mone run --mode copilot
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
                        className="text-[var(--geist-foreground)] underline inline-flex items-center gap-1 font-medium"
                      >
                        Complete CLI setup guide <ChevronRight className="size-3" />
                      </button>
                      <span>v0.1.0</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full space-y-4 text-left">
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-[var(--ds-gray-900)] block mb-1">
                          Weather Engine
                        </label>
                        <select
                          value={provider}
                          onChange={(e) => setProvider(e.target.value)}
                          className="w-full h-10 bg-[var(--brand-card-bg)] border border-[var(--brand-border-subtle)] rounded-xl px-3 text-xs text-[var(--geist-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-focus-color)]"
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
                          className="w-full h-10 bg-[var(--brand-card-bg)] border border-[var(--brand-border-subtle)] rounded-xl px-3 text-xs text-[var(--geist-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-focus-color)]"
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
                          className="w-full h-10 bg-[var(--brand-card-bg)] border border-[var(--brand-border-subtle)] rounded-xl px-3 text-xs text-[var(--geist-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-focus-color)]"
                        >
                          <option value="copilot">Copilot (Manual Approval)</option>
                          <option value="autonomous">Full Autonomous</option>
                        </select>
                      </div>
                    </div>

                    <Button
                      variant="default"
                      size="md"
                      onClick={handleLaunchWebRunner}
                      className="w-full text-xs font-semibold rounded-xl"
                    >
                      Launch Configured Dashboard
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Live Market Signals Showcase (Single Card Carousel) */}
      <section
        id="live-signals"
        className="py-16 border-b border-[var(--brand-border-subtle)] bg-[var(--brand-glass)]"
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="font-outfit text-3xl sm:text-4xl font-bold tracking-tight text-[var(--geist-foreground)]">
              Get the right signals for weather markets
            </h2>
            <p className="font-satoshi text-xs sm:text-sm text-[var(--ds-gray-900)]">
              Real-time mispricings detected between AI weather forecasts and prediction market odds.
            </p>
          </div>

          {/* Single-Card Carousel Component */}
          <MarketCardCarousel />
        </div>
      </section>

      {/* Agent Architecture Section (Simplified, User-Friendly) */}
      <section id="architecture" className="py-16 border-b border-[var(--brand-border-subtle)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="font-outfit text-3xl sm:text-4xl font-bold tracking-tight text-[var(--geist-foreground)]">
              How Mone Agent Works
            </h2>
            <p className="font-satoshi text-sm text-[var(--ds-gray-900)]">
              Weather predictions using WeatherNext by Google DeepMind.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Card 1 */}
            <div className="p-6 rounded-2xl border border-[var(--brand-border-subtle)] bg-[var(--brand-card-bg)] space-y-4 shadow-sm hover:border-[var(--brand-border)] transition duration-200">
              <div className="size-10 rounded-xl border border-[var(--brand-border-subtle)] bg-[var(--brand-glass)] flex items-center justify-center text-[var(--geist-foreground)]">
                <Cpu className="size-5" />
              </div>
              <h3 className="font-outfit font-semibold text-lg text-[var(--geist-foreground)]">
                WeatherNext AI Data
              </h3>
              <p className="font-satoshi text-xs sm:text-sm text-[var(--ds-gray-900)] leading-relaxed">
                The agent fetches weather forecast data from Google DeepMind&apos;s WeatherNext and compares it directly against active Polymarket and Kalshi markets.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl border border-[var(--brand-border-subtle)] bg-[var(--brand-card-bg)] space-y-4 shadow-sm hover:border-[var(--brand-border)] transition duration-200">
              <div className="size-10 rounded-xl border border-[var(--brand-border-subtle)] bg-[var(--brand-glass)] flex items-center justify-center text-[var(--geist-foreground)]">
                <Sparkles className="size-5" />
              </div>
              <h3 className="font-outfit font-semibold text-lg text-[var(--geist-foreground)]">
                Smart Signal Detection
              </h3>
              <p className="font-satoshi text-xs sm:text-sm text-[var(--ds-gray-900)] leading-relaxed">
                The agent uses an advanced model to check for the best signals and opportunities based on the AI weather forecast.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl border border-[var(--brand-border-subtle)] bg-[var(--brand-card-bg)] space-y-4 shadow-sm hover:border-[var(--brand-border)] transition duration-200">
              <div className="size-10 rounded-xl border border-[var(--brand-border-subtle)] bg-[var(--brand-glass)] flex items-center justify-center text-[var(--geist-foreground)]">
                <Layers className="size-5" />
              </div>
              <h3 className="font-outfit font-semibold text-lg text-[var(--geist-foreground)]">
                How It Runs
              </h3>
              <p className="font-satoshi text-xs sm:text-sm text-[var(--ds-gray-900)] leading-relaxed">
                Run the agent in Autonomous mode for automatic autopilot trading, or Copilot mode to review and approve every signal before execution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Backtest Audit Section (Centered, Straightforward) */}
      <section
        id="backtest"
        className="py-16 border-b border-[var(--brand-border-subtle)] bg-[var(--brand-glass)]"
      >
        <div className="max-w-[1000px] mx-auto px-4 sm:px-8 text-center space-y-8">
          <div className="space-y-2">
            <h2 className="font-outfit text-3xl sm:text-4xl font-bold tracking-tight text-[var(--geist-foreground)]">
              Tested across historical weather markets.
            </h2>
            <p className="font-satoshi text-xs sm:text-sm text-[var(--ds-gray-900)] max-w-lg mx-auto">
              Simulated against historical forecasts and official climate settlement records.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 tabular-nums max-w-3xl mx-auto">
            <div className="p-5 rounded-2xl border border-[var(--brand-border-subtle)] bg-[var(--brand-card-bg)] text-center shadow-sm">
              <span className="font-outfit text-3xl font-bold text-emerald-500 block">
                76.8%
              </span>
              <span className="text-xs text-[var(--ds-gray-900)] mt-1 block">
                Win Rate
              </span>
            </div>
            <div className="p-5 rounded-2xl border border-[var(--brand-border-subtle)] bg-[var(--brand-card-bg)] text-center shadow-sm">
              <span className="font-outfit text-3xl font-bold text-[var(--geist-foreground)] block">
                2.41
              </span>
              <span className="text-xs text-[var(--ds-gray-900)] mt-1 block">
                Sharpe Ratio
              </span>
            </div>
            <div className="p-5 rounded-2xl border border-[var(--brand-border-subtle)] bg-[var(--brand-card-bg)] text-center shadow-sm">
              <span className="font-outfit text-3xl font-bold text-[var(--geist-foreground)] block">
                6.2%
              </span>
              <span className="text-xs text-[var(--ds-gray-900)] mt-1 block">
                Max Drawdown
              </span>
            </div>
            <div className="p-5 rounded-2xl border border-[var(--brand-border-subtle)] bg-[var(--brand-card-bg)] text-center shadow-sm">
              <span className="font-outfit text-3xl font-bold text-[var(--geist-foreground)] block">
                +48.6%
              </span>
              <span className="text-xs text-[var(--ds-gray-900)] mt-1 block">
                90d ROI
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section (Black & White Minimalist) */}
      <section id="pricing" className="py-16 border-b border-[var(--brand-border-subtle)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3 relative">
            <div className="flex items-center justify-center gap-2">
              <h2 className="font-outfit text-3xl sm:text-4xl font-bold tracking-tight text-[var(--geist-foreground)]">
                Choose the best agent plan
              </h2>
              <button
                onClick={() => setShowRunsInfo(!showRunsInfo)}
                className="p-1.5 rounded-full hover:bg-[var(--brand-border-subtle)] text-[var(--ds-gray-900)] hover:text-[var(--geist-foreground)] transition"
                title="Runs Breakdown"
                aria-label="Runs Breakdown Info"
              >
                <Info className="size-4" />
              </button>
            </div>
            <p className="font-satoshi text-sm text-[var(--ds-gray-900)]">
              Every new trader gets a 7-day free trial. Top up runs or upgrade anytime with USDC.
            </p>

            {/* Run Breakdown Popover */}
            {showRunsInfo && (
              <div className="p-4 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-glass)] text-left space-y-2 text-xs shadow-lg max-w-md mx-auto">
                <div className="font-semibold text-[var(--geist-foreground)] flex items-center justify-between">
                  <span>How Runs Work</span>
                  <button
                    onClick={() => setShowRunsInfo(false)}
                    className="text-[var(--ds-gray-900)] hover:text-[var(--geist-foreground)]"
                  >
                    &times;
                  </button>
                </div>
                <ul className="space-y-1 text-[var(--ds-gray-900)]">
                  <li>• 1 run = 1 complete forecast &amp; market opportunity scan.</li>
                  <li>• Autonomous mode: 1 scheduled scan per hour consumes 1 run.</li>
                  <li>• Copilot mode: A manual scan or approval consumes 1 run.</li>
                  <li>• Passes never expire; unused runs roll over indefinitely.</li>
                  <li>• Pro tier gives unlimited scans and runs for 30 days.</li>
                </ul>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
            {/* Tier 1 */}
            <div className="p-6 rounded-2xl border border-[var(--brand-border-subtle)] bg-[var(--brand-glass)] space-y-6 flex flex-col justify-between hover:border-[var(--brand-border)] transition duration-200">
              <div className="space-y-4">
                <div>
                  <h3 className="font-outfit font-semibold text-lg text-[var(--geist-foreground)]">
                    Starter Pass
                  </h3>
                  <p className="text-xs text-[var(--ds-gray-900)]">100 runs</p>
                </div>
                <div className="flex items-baseline gap-1 tabular-nums">
                  <span className="font-outfit text-3xl font-extrabold text-[var(--geist-foreground)]">
                    $10
                  </span>
                  <span className="text-xs text-[var(--ds-gray-900)]">
                    USDC
                  </span>
                </div>
                <ul className="text-xs text-[var(--ds-gray-900)] space-y-2 pt-2">
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-[var(--geist-foreground)] shrink-0" />
                    <span>100 Automated Strategy Runs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-[var(--geist-foreground)] shrink-0" />
                    <span>WeatherNext Multi-Station Ingestion</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-[var(--geist-foreground)] shrink-0" />
                    <span>Full CLI and Web Dashboard Access</span>
                  </li>
                </ul>
              </div>
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsPricingOpen(true)}
                className="w-full text-xs font-semibold rounded-xl"
              >
                Select $10 USDC
              </Button>
            </div>

            {/* Tier 2: Popular */}
            <div className="p-6 rounded-2xl border-2 border-[var(--geist-foreground)] bg-[var(--brand-card-bg)] space-y-6 flex flex-col justify-between shadow-md relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[var(--geist-foreground)] text-[var(--geist-background)]">
                  Most Popular
                </span>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-outfit font-semibold text-lg text-[var(--geist-foreground)]">
                    Pro Pack
                  </h3>
                  <p className="text-xs text-[var(--ds-gray-900)]">300 runs</p>
                </div>
                <div className="flex items-baseline gap-1 tabular-nums">
                  <span className="font-outfit text-3xl font-extrabold text-[var(--geist-foreground)]">
                    $25
                  </span>
                  <span className="text-xs text-[var(--ds-gray-900)]">
                    USDC
                  </span>
                </div>
                <ul className="text-xs text-[var(--ds-gray-900)] space-y-2 pt-2">
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-[var(--geist-foreground)] shrink-0" />
                    <span>300 Automated Strategy Runs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-[var(--geist-foreground)] shrink-0" />
                    <span>Priority Ensemble Compute Queue</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-[var(--geist-foreground)] shrink-0" />
                    <span>Both Kalshi &amp; Polymarket Routing</span>
                  </li>
                </ul>
              </div>
              <Button
                variant="default"
                size="md"
                onClick={() => setIsPricingOpen(true)}
                className="w-full text-xs font-semibold rounded-xl"
              >
                Select $25 USDC
              </Button>
            </div>

            {/* Tier 3: Pro */}
            <div className="p-6 rounded-2xl border border-[var(--brand-border-subtle)] bg-[var(--brand-glass)] space-y-6 flex flex-col justify-between hover:border-[var(--brand-border)] transition duration-200">
              <div className="space-y-4">
                <div>
                  <h3 className="font-outfit font-semibold text-lg text-[var(--geist-foreground)]">
                    mone Pro
                  </h3>
                  <p className="text-xs text-[var(--ds-gray-900)]">Unlimited (30 days)</p>
                </div>
                <div className="flex items-baseline gap-1 tabular-nums">
                  <span className="font-outfit text-3xl font-extrabold text-[var(--geist-foreground)]">
                    $49
                  </span>
                  <span className="text-xs text-[var(--ds-gray-900)]">
                    USDC / 30d
                  </span>
                </div>
                <ul className="text-xs text-[var(--ds-gray-900)] space-y-2 pt-2">
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-[var(--geist-foreground)] shrink-0" />
                    <span>Unlimited Autonomous Executions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-[var(--geist-foreground)] shrink-0" />
                    <span>30-Day Pass (Renews stack)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-[var(--geist-foreground)] shrink-0" />
                    <span>Webhook &amp; Real-Time Instant Signals</span>
                  </li>
                </ul>
              </div>
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsPricingOpen(true)}
                className="w-full text-xs font-semibold rounded-xl"
              >
                Select $49 USDC
              </Button>
            </div>
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
              USDC Pricing
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

      {/* Setup Agent Modal */}
      <SetupAgentModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
      />
    </div>
  );
}
