"use client";

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Check,
  X,
  ShieldCheck,
  Zap,
  Sparkles,
  Loader2,
  ArrowRight,
  Copy,
  CheckCircle2,
  ExternalLink,
  QrCode,
  Wallet,
  ArrowLeft,
} from "lucide-react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Card } from "./ui/Card";

type NetworkKey = "polygon" | "base" | "solana";

interface PlanConfig {
  key: string;
  name: string;
  priceUsdc: number;
  runs: string;
  popular?: boolean;
}

const PLANS: PlanConfig[] = [
  {
    key: "pass_10",
    name: "100 Runs Pass",
    priceUsdc: 10,
    runs: "100 automated trade runs",
  },
  {
    key: "pass_25",
    name: "300 Runs Pass",
    priceUsdc: 25,
    runs: "300 automated trade runs",
    popular: true,
  },
  {
    key: "pro_subscription",
    name: "mone Pro (30 Days)",
    priceUsdc: 49,
    runs: "Unlimited trade runs + live alerts",
  },
];

const WALLETS = {
  evm: "0x938C272530Af9939b98893c810d50EB79BE9f58b",
  solana: "AGLeSAyHk5Sk9MzTMq5QuKssL8e6FLWC9i8NddYC85j3",
};

export function PricingModal() {
  const { user, isPricingOpen, setIsPricingOpen, upgradePlan } = useAuth();

  // Selected plan for checkout
  const [selectedPlan, setSelectedPlan] = useState<PlanConfig | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkKey>("polygon");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Manual TX hash verification state
  const [txHashInput, setTxHashInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isPricingOpen) return null;

  const currentAddress =
    selectedNetwork === "solana" ? WALLETS.solana : WALLETS.evm;

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleVerifyTx = async (hashToVerify?: string) => {
    const hash = (hashToVerify || txHashInput).trim();
    if (!hash) {
      setVerifyError("Please paste a valid transaction hash or signature.");
      return;
    }

    setIsVerifying(true);
    setVerifyError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/billing/verify-usdc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tx_hash: hash,
          network: selectedNetwork,
          plan_key: selectedPlan?.key || "pass_10",
          user_email: user?.email || "trader@gmail.com",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            "Verification failed. Please verify the transaction hash."
        );
      }

      // Upgrade account immediately
      const activatedKey =
        data.plan_activated || selectedPlan?.key || "pass_10";
      const customRuns = data.runs_granted;
      upgradePlan(activatedKey, customRuns);
      setSuccessMessage(
        data.note ||
          `Payment confirmed! ${selectedPlan?.name} activated on your account.`
      );

      setTimeout(() => {
        setSuccessMessage(null);
        setSelectedPlan(null);
        setIsPricingOpen(false);
      }, 2500);
    } catch (err: any) {
      setVerifyError(err.message || "Failed to verify transaction.");
    } finally {
      setIsVerifying(false);
    }
  };

  // 1-Click Web3 Wallet Transfer (MetaMask / Phantom / Rabby)
  const handleWeb3Transfer = async () => {
    if (selectedNetwork === "solana") {
      setVerifyError(
        "For Solana, please send USDC via Phantom to the address below and paste your TX signature."
      );
      return;
    }

    if (typeof window === "undefined" || !(window as any).ethereum) {
      setVerifyError(
        "No Web3 wallet extension found. You can send USDC directly to the address below and paste the TX hash."
      );
      return;
    }

    setIsVerifying(true);
    setVerifyError(null);

    try {
      const ethereum = (window as any).ethereum;
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      const sender = accounts[0];

      // Native USDC Contracts: Polygon (137) or Base (8453)
      const targetChainId = selectedNetwork === "polygon" ? "0x89" : "0x2105";
      const tokenAddress =
        selectedNetwork === "polygon"
          ? "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"
          : "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

      // Request network switch if needed
      try {
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: targetChainId }],
        });
      } catch (switchErr) {
        console.warn("Chain switch error:", switchErr);
      }

      // Raw ERC-20 transfer(to, amount) encoded call
      const rawAmount = (selectedPlan?.priceUsdc || 10) * 1_000_000;
      const amountHex = rawAmount.toString(16).padStart(64, "0");
      const cleanTo = WALLETS.evm.substring(2).padStart(64, "0");
      const transferData = `0xa9059cbb${cleanTo}${amountHex}`;

      const txHash = await ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: sender,
            to: tokenAddress,
            data: transferData,
          },
        ],
      });

      if (txHash) {
        setTxHashInput(txHash);
        await handleVerifyTx(txHash);
      }
    } catch (err: any) {
      setVerifyError(err.message || "Wallet transfer rejected.");
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <Card className="bg-[var(--geist-background)] border-[var(--ds-gray-400)] rounded-2xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
        {/* Close Button */}
        <button
          onClick={() => {
            setSelectedPlan(null);
            setIsPricingOpen(false);
          }}
          className="absolute top-5 right-5 text-[var(--ds-gray-900)] hover:text-[var(--geist-foreground)] p-1.5 rounded-lg hover:bg-[var(--ds-gray-100)] transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {!selectedPlan ? (
          /* View 1: Pricing Tiers Selection */
          <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <Badge variant="blue" dot>
                Native USDC Crypto Payments
              </Badge>
              <h2 className="font-outfit text-2xl sm:text-3xl font-bold tracking-tight text-[var(--geist-foreground)]">
                Simple pricing. Zero banking borders.
              </h2>
              <p className="font-satoshi text-xs sm:text-sm text-[var(--ds-gray-900)] leading-relaxed">
                Every new user gets a <strong>7-Day Free Trial</strong> (50 runs).
                Top up anytime with native <strong>USDC</strong> on Polygon, Base, or Solana.
              </p>

              {user && (
                <div className="pt-1">
                  <span className="inline-block text-xs px-3 py-1 rounded-md bg-[var(--ds-gray-100)] border border-[var(--ds-gray-400)] text-[var(--ds-gray-900)] tabular-nums">
                    Active Plan:{" "}
                    <strong className="text-emerald-500">{user.plan}</strong> (
                    {user.plan === "Pro"
                      ? `Unlimited (${user.proDaysRemaining ?? 30}d left)`
                      : `${user.runsRemaining} runs left`}
                    )
                  </span>
                </div>
              )}
            </div>

            {/* Pricing Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
              {/* Card 1: 100 Runs */}
              <Card className="p-5 flex flex-col justify-between hover:border-[var(--ds-gray-500)] transition">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-outfit text-base font-semibold text-[var(--geist-foreground)]">
                      100 Runs
                    </h3>
                    <p className="font-satoshi text-xs text-[var(--ds-gray-900)]">
                      Pay as you go
                    </p>
                  </div>

                  <div className="flex items-baseline gap-1.5 tabular-nums">
                    <span className="font-outfit text-3xl font-extrabold text-[var(--geist-foreground)]">
                      10
                    </span>
                    <span className="text-sm font-bold text-[var(--ds-blue-700)]">
                      USDC
                    </span>
                    <span className="text-xs text-[var(--ds-gray-900)]">
                      one-time
                    </span>
                  </div>

                  <ul className="space-y-2 text-xs text-[var(--ds-gray-900)] font-satoshi">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>100 automated trade runs</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>WeatherNext 3 &amp; 2 ensembles</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Never expires</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => setSelectedPlan(PLANS[0])}
                    className="w-full text-xs font-semibold gap-2"
                  >
                    Pay 10 USDC <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>

              {/* Card 2: 300 Runs */}
              <Card className="p-5 flex flex-col justify-between relative border-[var(--ds-blue-700)] shadow-md">
                <div className="absolute -top-2.5 right-4">
                  <Badge variant="blue" className="text-[10px] font-bold">
                    MOST POPULAR
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-outfit text-base font-semibold text-[var(--geist-foreground)]">
                      300 Runs
                    </h3>
                    <p className="font-satoshi text-xs text-[var(--ds-blue-700)]">
                      Save 17% per trade run
                    </p>
                  </div>

                  <div className="flex items-baseline gap-1.5 tabular-nums">
                    <span className="font-outfit text-3xl font-extrabold text-[var(--geist-foreground)]">
                      25
                    </span>
                    <span className="text-sm font-bold text-[var(--ds-blue-700)]">
                      USDC
                    </span>
                    <span className="text-xs text-[var(--ds-gray-900)]">
                      one-time
                    </span>
                  </div>

                  <ul className="space-y-2 text-xs text-[var(--ds-gray-900)] font-satoshi">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>300 automated trade runs</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Priority execution queue</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Both Kalshi &amp; Polymarket</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6">
                  <Button
                    variant="blue"
                    size="md"
                    onClick={() => setSelectedPlan(PLANS[1])}
                    className="w-full text-xs font-semibold gap-2"
                  >
                    Pay 25 USDC <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>

              {/* Card 3: mone Pro */}
              <Card className="p-5 flex flex-col justify-between hover:border-[var(--ds-gray-500)] transition">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-outfit text-base font-semibold text-[var(--geist-foreground)]">
                      mone Pro
                    </h3>
                    <p className="font-satoshi text-xs text-[var(--ds-gray-900)]">
                      For serious prediction traders
                    </p>
                  </div>

                  <div className="flex items-baseline gap-1.5 tabular-nums">
                    <span className="font-outfit text-3xl font-extrabold text-[var(--geist-foreground)]">
                      49
                    </span>
                    <span className="text-sm font-bold text-[var(--ds-blue-700)]">
                      USDC
                    </span>
                    <span className="text-xs text-[var(--ds-gray-900)]">
                      / 30 days
                    </span>
                  </div>

                  <ul className="space-y-2 text-xs text-[var(--ds-gray-900)] font-satoshi">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Unlimited trade executions</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>30-Day Pass (Days stack on renew)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Real-time webhook signals</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6">
                  <Button
                    variant="default"
                    size="md"
                    onClick={() => setSelectedPlan(PLANS[2])}
                    className="w-full text-xs font-semibold gap-2"
                  >
                    Pay 49 USDC <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        ) : (
          /* View 2: Native USDC Payment Checkout */
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--ds-gray-400)] pb-4">
              <button
                onClick={() => setSelectedPlan(null)}
                className="inline-flex items-center gap-1.5 text-xs text-[var(--ds-gray-900)] hover:text-[var(--geist-foreground)] font-medium transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Plans
              </button>
              <div className="text-right">
                <span className="text-xs text-[var(--ds-gray-900)]">
                  Selected Tier:
                </span>
                <span className="font-outfit font-bold text-sm text-[var(--geist-foreground)] ml-2">
                  {selectedPlan.name} (${selectedPlan.priceUsdc} USDC)
                </span>
              </div>
            </div>

            {/* Network Selector Tabs */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-[var(--geist-foreground)] block">
                Select Network for Native USDC Transfer:
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    key: "polygon" as NetworkKey,
                    name: "Polygon (PoS)",
                    badge: "Lowest Gas (<$0.01)",
                  },
                  {
                    key: "base" as NetworkKey,
                    name: "Base (L2)",
                    badge: "Coinbase L2 (<$0.01)",
                  },
                  {
                    key: "solana" as NetworkKey,
                    name: "Solana",
                    badge: "Sub-Second Finality",
                  },
                ].map((net) => (
                  <button
                    key={net.key}
                    type="button"
                    onClick={() => setSelectedNetwork(net.key)}
                    className={`p-3 rounded-xl border text-left transition select-none ${
                      selectedNetwork === net.key
                        ? "border-[var(--ds-blue-700)] bg-[var(--ds-blue-700)]/5 text-[var(--geist-foreground)] ring-1 ring-[var(--ds-blue-700)]"
                        : "border-[var(--ds-gray-400)] bg-[var(--ds-gray-100)] text-[var(--ds-gray-900)] hover:border-[var(--ds-gray-500)]"
                    }`}
                  >
                    <div className="font-outfit font-bold text-xs text-[var(--geist-foreground)]">
                      {net.name}
                    </div>
                    <div className="text-[10px] text-[var(--ds-gray-900)] mt-0.5">
                      {net.badge}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Deposit Address Card */}
            <div className="p-4 rounded-xl border border-[var(--ds-gray-400)] bg-[var(--ds-gray-100)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--ds-gray-900)]">
                  Send exactly{" "}
                  <strong className="text-[var(--geist-foreground)] tabular-nums">
                    {selectedPlan.priceUsdc} USDC
                  </strong>{" "}
                  to this {selectedNetwork.toUpperCase()} address:
                </span>
                <span className="text-[11px] text-emerald-500 font-medium">
                  2% fee tolerance accepted
                </span>
              </div>

              <div className="flex items-center gap-2">
                <code className="flex-1 bg-[var(--geist-background)] border border-[var(--ds-gray-400)] px-3 py-2 rounded-lg font-mono text-xs text-[var(--geist-foreground)] select-all truncate">
                  {currentAddress}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(currentAddress, "address")}
                  className="shrink-0 text-xs gap-1.5"
                >
                  {copiedField === "address" ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />{" "}
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Transfer & Verification Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option A: Web3 1-Click */}
              <Card className="p-4 space-y-3 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-[var(--ds-blue-700)]" />
                    <span className="font-outfit font-semibold text-xs text-[var(--geist-foreground)]">
                      1-Click Web3 Transfer
                    </span>
                  </div>
                  <p className="font-satoshi text-[11px] text-[var(--ds-gray-900)]">
                    Auto-fill transaction in MetaMask, Rabby, or Coinbase Wallet:
                  </p>
                </div>
                <Button
                  variant="blue"
                  size="md"
                  isLoading={isVerifying}
                  onClick={handleWeb3Transfer}
                  className="w-full text-xs font-semibold"
                >
                  Transfer {selectedPlan.priceUsdc} USDC with Wallet
                </Button>
              </Card>

              {/* Option B: Manual Verification */}
              <Card className="p-4 space-y-3">
                <div className="space-y-1">
                  <span className="font-outfit font-semibold text-xs text-[var(--geist-foreground)] block">
                    Or Verify By Transaction Hash:
                  </span>
                  <p className="font-satoshi text-[11px] text-[var(--ds-gray-900)]">
                    Sent via Binance, Bybit, Phantom, or hardware wallet?
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={txHashInput}
                    onChange={(e) => setTxHashInput(e.target.value)}
                    placeholder="0x... or Solana signature"
                    className="flex-1 bg-[var(--geist-background)] border border-[var(--ds-gray-400)] rounded-md px-3 py-1.5 text-xs text-[var(--geist-foreground)] font-mono focus:ring-1 focus:ring-[var(--ds-focus-color)]"
                  />
                  <Button
                    variant="default"
                    size="sm"
                    isLoading={isVerifying}
                    onClick={() => handleVerifyTx()}
                    className="text-xs"
                  >
                    Verify
                  </Button>
                </div>
              </Card>
            </div>

            {/* Error / Success Feedback */}
            {verifyError && (
              <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-xs text-rose-500">
                {verifyError}
              </div>
            )}
            {successMessage && (
              <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-500 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
