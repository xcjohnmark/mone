import React from "react";
import Link from "next/link";
import { BrandLogo } from "../../components/ui/BrandLogo";
import { ThemeToggle } from "../../components/ui/ThemeToggle";

export const metadata = {
  title: "Terms of Service — mone",
  description: "Terms of Service and non-custodial trading disclaimer for mone prediction market agent.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[var(--geist-background)] text-[var(--geist-foreground)] selection:bg-[var(--geist-selection)]">
      {/* Header */}
      <header className="border-b border-[var(--brand-border-subtle)] bg-[var(--brand-glass)] backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <BrandLogo size="md" />
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs text-[var(--ds-gray-900)] hover:text-[var(--geist-foreground)] transition-colors"
            >
              &larr; Back to Home
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-8 py-12 sm:py-16 space-y-10">
        <div className="space-y-3">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[var(--brand-border-subtle)] text-[var(--ds-gray-900)] uppercase tracking-wider">
            Legal &amp; Compliance
          </span>
          <h1 className="font-outfit text-3xl sm:text-4xl font-extrabold tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xs text-[var(--ds-gray-900)]">
            Last updated: October 12, 2026 &middot; Effective Date: October 12, 2026
          </p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8 text-sm leading-relaxed text-[var(--ds-gray-900)]">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-[var(--geist-foreground)] font-outfit">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using <strong>mone</strong> (&ldquo;mone&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), located at{" "}
              <a href="https://mone-agent.vercel.app" className="text-[var(--geist-foreground)] underline underline-offset-2">
                https://mone-agent.vercel.app
              </a>
              , or by utilizing our web dashboard, open-source CLI client, or backend APIs, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;) and our Privacy Policy.
            </p>
            <p>
              If you do not agree to these Terms, you may not access or use mone.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-[var(--geist-foreground)] font-outfit">
              2. Description of Service &amp; Non-Custodial BYOK Architecture
            </h2>
            <p>
              mone is an autonomous quantitative algorithmic trading agent and forecasting copilot that compares Google DeepMind WeatherNext ensemble weather models with prediction market implied odds on venues such as Kalshi and Polymarket.
            </p>
            <div className="p-4 rounded-xl border border-[var(--brand-border-subtle)] bg-[var(--brand-glass)] text-xs text-[var(--geist-foreground)] space-y-2">
              <strong className="block font-semibold">Strictly Non-Custodial (Bring-Your-Own-Key):</strong>
              <p>
                mone is non-custodial software infrastructure. We do not hold, deposit, custody, or manage fiat currency, cryptocurrency, or trading contracts on behalf of users. Users provide their own API credentials or sign transactions via their own Web3 wallets. You retain sole custody and ultimate operational control over your funds and positions at all times.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-[var(--geist-foreground)] font-outfit">
              3. Financial &amp; Risk Disclaimer
            </h2>
            <p className="font-semibold text-[var(--geist-foreground)]">
              PREDICTION MARKET TRADING INVOLVES SUBSTANTIAL RISK OF FINANCIAL LOSS.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Not Financial or Investment Advice:</strong> All signals, statistical edges, probability calculations, Kelly criterion sizing suggestions, and backtest results provided by mone are for informational and algorithmic evaluation purposes only. Nothing constitutes financial, investment, legal, or tax advice.
              </li>
              <li>
                <strong>No Guarantees of Profit:</strong> Weather forecasting models (including ensemble forecasts) are probabilistic estimates subject to unpredictable meteorological anomalies. Past algorithmic performance or backtested metrics do not guarantee future profits.
              </li>
              <li>
                <strong>Autonomous Execution Risks:</strong> When operating the agent in autonomous or automated mode, you assume all risks related to market volatility, liquidity limitations, slippage, exchange API outages, and potential losses.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-[var(--geist-foreground)] font-outfit">
              4. Accounts &amp; Google Authentication
            </h2>
            <p>
              To access personalized agent dashboards and execution passes, you may authenticate via Google OAuth 2.0. By authenticating:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>You represent that you are at least 18 years old and legally competent to enter into binding agreements.</li>
              <li>You agree to keep your generated CLI token (<code>mone_sec_...</code>) confidential and not share it with unauthorized parties.</li>
              <li>You are solely responsible for all actions conducted through your authenticated session.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-[var(--geist-foreground)] font-outfit">
              5. Free Trials, Anti-Abuse, and Pricing Passes
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>7-Day Free Trial:</strong> First-time users receive a complimentary 7-day trial with 50 automated execution runs. Free trials are strictly limited to one per individual user.
              </li>
              <li>
                <strong>Sybil &amp; Abuse Prevention:</strong> Re-registering, creating multiple Google accounts, or attempting to reset free trial allocations using automated scripts or deletion recycling violates these Terms and will result in permanent exclusion via our cryptographic tombstone ledger.
              </li>
              <li>
                <strong>Execution Passes:</strong> Users may purchase additional run packs ($10 USDC Starter Pass for 100 runs, $25 USDC Pro Pack for 300 runs, or $49 USDC Pro Tier). Because passes grant immediate digital compute access, payments in USDC or fiat are final and non-refundable once runs have been credited.
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-[var(--geist-foreground)] font-outfit">
              6. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by applicable law, mone and its contributors, developers, and operators shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages—including loss of profits, loss of trading capital, contract liquidation, API connectivity failures, or data corruption—arising from your use or inability to use the service.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-[var(--geist-foreground)] font-outfit">
              7. Governing Law &amp; Modifications
            </h2>
            <p>
              We reserve the right to modify or update these Terms at any time. Continued use of mone following any updates constitutes your acceptance of the revised Terms.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-[var(--geist-foreground)] font-outfit">
              8. Contact
            </h2>
            <p>
              For legal inquiries, terms clarification, or technical support, please reach out to:
            </p>
            <div className="p-4 rounded-xl border border-[var(--brand-border-subtle)] bg-[var(--brand-card-bg)] text-xs space-y-1">
              <div><strong>Application:</strong> mone Autonomous Prediction Agent</div>
              <div><strong>Contact:</strong> accessjohnmark@gmail.com</div>
              <div><strong>Website:</strong> https://mone-agent.vercel.app</div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-[var(--brand-border-subtle)] bg-[var(--brand-glass)] text-xs text-[var(--ds-gray-900)] text-center">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>&copy; 2026 mone. Precision prediction market infrastructure.</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-[var(--geist-foreground)] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/" className="hover:text-[var(--geist-foreground)] transition-colors">
              Home
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
