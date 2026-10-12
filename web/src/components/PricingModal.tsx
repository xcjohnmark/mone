"use client";

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Check,
  X,
  Info,
  Copy,
  CheckCircle2,
  Wallet,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";

type NetworkKey = "base" | "polygon" | "solana";

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
    name: "Starter Pass",
    priceUsdc: 10,
    runs: "100 automated trade runs",
  },
  {
    key: "pass_25",
    name: "Pro Pack",
    priceUsdc: 25,
    runs: "300 automated trade runs",
    popular: true,
  },
  {
    key: "pro_subscription",
    name: "mone Pro",
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
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkKey>("base");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showRunsInfo, setShowRunsInfo] = useState<boolean>(false);

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

  // 1-Click Web3 Wallet Transfer
  const handleWeb3Transfer = async () => {
    if (selectedNetwork === "solana") {
      setVerifyError(
        "For Solana, please send USDC via Phantom or Solflare and paste the transaction signature below."
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

      const targetChainId = selectedNetwork === "polygon" ? "0x89" : "0x2105";
      const tokenAddress =
        selectedNetwork === "polygon"
          ? "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"
          : "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

      try {
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: targetChainId }],
        });
      } catch (switchErr) {
        console.warn("Chain switch error:", switchErr);
      }

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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[var(--brand-card-bg)] border border-[var(--brand-border)] rounded-2xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 text-[var(--geist-foreground)]">
        {/* Close Button */}
        <button
          onClick={() => {
            setSelectedPlan(null);
            setIsPricingOpen(false);
          }}
          className="absolute top-5 right-5 text-[var(--ds-gray-900)] hover:text-[var(--geist-foreground)] size-8 rounded-full hover:bg-[var(--brand-border-subtle)] flex items-center justify-center transition-all duration-200"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        {!selectedPlan ? (
          /* View 1: Pricing Tiers Selection (Black & White Minimalist) */
          <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-2 relative">
              <div className="flex items-center justify-center gap-2">
                <h2 className="font-outfit text-2xl sm:text-3xl font-bold tracking-tight">
                  Choose the best agent plan
                </h2>
                <button
                  onClick={() => setShowRunsInfo(!showRunsInfo)}
                  className="p-1.5 rounded-full hover:bg-[var(--brand-border-subtle)] text-[var(--ds-gray-900)] hover:text-[var(--geist-foreground)] transition"
                  title="What is a run?"
                  aria-label="Runs Breakdown Info"
                >
                  <Info className="size-4" />
                </button>
              </div>

              <p className="font-satoshi text-xs sm:text-sm text-[var(--ds-gray-900)] leading-relaxed">
                Every new trader gets a 7-day free trial. Top up runs or upgrade to unlimited anytime with USDC.
              </p>

              {/* Info Popup for Runs Breakdown */}
              {showRunsInfo && (
                <div className="p-4 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-glass)] text-left space-y-2 text-xs shadow-lg animate-in fade-in zoom-in-95 duration-150">
                  <div className="font-semibold text-[var(--geist-foreground)] flex items-center justify-between">
                    <span>How Runs Work</span>
                    <button
                      onClick={() => setShowRunsInfo(false)}
                      className="text-[var(--ds-gray-900)] hover:text-[var(--geist-foreground)]"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                  <ul className="space-y-1.5 text-[var(--ds-gray-900)]">
                    <li>• <strong>1 run = 1 complete forecast &amp; market scan</strong> across active airport stations.</li>
                    <li>• In Autonomous mode: 1 scheduled scan per hour consumes 1 run.</li>
                    <li>• In Copilot mode: A manual scan or approval consumes 1 run.</li>
                    <li>• Passes do not expire. Runs roll over indefinitely until used.</li>
                    <li>• Pro tier gives unlimited scans and runs for 30 days.</li>
                  </ul>
                </div>
              )}

              {user && (
                <div className="pt-1">
                  <span className="inline-block text-xs px-3 py-1 rounded-md bg-[var(--brand-card-bg)] border border-[var(--brand-border-subtle)] text-[var(--ds-gray-900)] tabular-nums">
                    Active Plan:{" "}
                    <strong className="text-[var(--geist-foreground)]">{user.plan}</strong> (
                    {user.plan === "Pro"
                      ? `Unlimited (${user.proDaysRemaining ?? 30}d left)`
                      : `${user.runsRemaining} runs left`}
                    )
                  </span>
                </div>
              )}
            </div>

            {/* Pricing Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2 items-stretch">
              {/* Card 1: 100 Runs */}
              <div className="p-6 rounded-2xl border border-[var(--brand-border-subtle)] bg-[var(--brand-glass)] flex flex-col justify-between hover:border-[var(--brand-border)] transition duration-200">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-outfit text-base font-semibold">
                      Starter Pass
                    </h3>
                    <p className="font-satoshi text-xs text-[var(--ds-gray-900)]">
                      100 runs
                    </p>
                  </div>

                  <div className="flex items-baseline gap-1.5 tabular-nums">
                    <span className="font-outfit text-3xl font-extrabold">
                      $10
                    </span>
                    <span className="text-xs text-[var(--ds-gray-900)]">
                      USDC
                    </span>
                  </div>

                  <ul className="space-y-2 text-xs text-[var(--ds-gray-900)] font-satoshi">
                    <li className="flex items-center gap-2">
                      <Check className="size-3.5 text-[var(--geist-foreground)] shrink-0" />
                      <span>100 automated trade runs</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-3.5 text-[var(--geist-foreground)] shrink-0" />
                      <span>WeatherNext &amp; ensemble access</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-3.5 text-[var(--geist-foreground)] shrink-0" />
                      <span>Never expires</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => setSelectedPlan(PLANS[0])}
                    className="w-full text-xs font-semibold rounded-xl"
                  >
                    Select $10 USDC
                  </Button>
                </div>
              </div>

              {/* Card 2: 300 Runs */}
              <div className="p-6 rounded-2xl border-2 border-[var(--geist-foreground)] bg-[var(--brand-card-bg)] flex flex-col justify-between shadow-md relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[var(--geist-foreground)] text-[var(--geist-background)]">
                    Most Popular
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-outfit text-base font-semibold">
                      Pro Pack
                    </h3>
                    <p className="font-satoshi text-xs text-[var(--ds-gray-900)]">
                      300 runs
                    </p>
                  </div>

                  <div className="flex items-baseline gap-1.5 tabular-nums">
                    <span className="font-outfit text-3xl font-extrabold">
                      $25
                    </span>
                    <span className="text-xs text-[var(--ds-gray-900)]">
                      USDC
                    </span>
                  </div>

                  <ul className="space-y-2 text-xs text-[var(--ds-gray-900)] font-satoshi">
                    <li className="flex items-center gap-2">
                      <Check className="size-3.5 text-[var(--geist-foreground)] shrink-0" />
                      <span>300 automated trade runs</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-3.5 text-[var(--geist-foreground)] shrink-0" />
                      <span>Priority execution queue</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-3.5 text-[var(--geist-foreground)] shrink-0" />
                      <span>Both Kalshi &amp; Polymarket</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6">
                  <Button
                    variant="default"
                    size="md"
                    onClick={() => setSelectedPlan(PLANS[1])}
                    className="w-full text-xs font-semibold rounded-xl"
                  >
                    Select $25 USDC
                  </Button>
                </div>
              </div>

              {/* Card 3: mone Pro */}
              <div className="p-6 rounded-2xl border border-[var(--brand-border-subtle)] bg-[var(--brand-glass)] flex flex-col justify-between hover:border-[var(--brand-border)] transition duration-200">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-outfit text-base font-semibold">
                      mone Pro
                    </h3>
                    <p className="font-satoshi text-xs text-[var(--ds-gray-900)]">
                      Unlimited (30 days)
                    </p>
                  </div>

                  <div className="flex items-baseline gap-1.5 tabular-nums">
                    <span className="font-outfit text-3xl font-extrabold">
                      $49
                    </span>
                    <span className="text-xs text-[var(--ds-gray-900)]">
                      USDC / 30d
                    </span>
                  </div>

                  <ul className="space-y-2 text-xs text-[var(--ds-gray-900)] font-satoshi">
                    <li className="flex items-center gap-2">
                      <Check className="size-3.5 text-[var(--geist-foreground)] shrink-0" />
                      <span>Unlimited trade executions</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-3.5 text-[var(--geist-foreground)] shrink-0" />
                      <span>30-day pass (stacks on renewal)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-3.5 text-[var(--geist-foreground)] shrink-0" />
                      <span>Real-time webhook signals</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => setSelectedPlan(PLANS[2])}
                    className="w-full text-xs font-semibold rounded-xl"
                  >
                    Select $49 USDC
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* View 2: Native USDC Payment Checkout */
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--brand-border-subtle)] pb-4">
              <button
                onClick={() => setSelectedPlan(null)}
                className="inline-flex items-center gap-1.5 text-xs text-[var(--ds-gray-900)] hover:text-[var(--geist-foreground)] font-medium transition"
              >
                <ArrowLeft className="size-3.5" /> Back to Plans
              </button>
              <div className="text-right">
                <span className="text-xs text-[var(--ds-gray-900)]">
                  Selected Tier:
                </span>
                <span className="font-outfit font-bold text-sm ml-2">
                  {selectedPlan.name} (${selectedPlan.priceUsdc} USDC)
                </span>
              </div>
            </div>

            {/* Vertical Radio Buttons for Network Selection */}
            <div className="space-y-2">
              <label className="text-xs font-medium block text-[var(--geist-foreground)]">
                Select Network for USDC Transfer:
              </label>
              <div className="space-y-2">
                {[
                  { key: "base" as NetworkKey, name: "Base" },
                  { key: "polygon" as NetworkKey, name: "Polygon" },
                  { key: "solana" as NetworkKey, name: "Solana" },
                ].map((net) => {
                  const isSelected = selectedNetwork === net.key;
                  return (
                    <label
                      key={net.key}
                      onClick={() => setSelectedNetwork(net.key)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition select-none ${
                        isSelected
                          ? "border-[var(--geist-foreground)] bg-[var(--brand-card-bg)] shadow-sm"
                          : "border-[var(--brand-border-subtle)] bg-[var(--brand-glass)] hover:border-[var(--brand-border)]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`size-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? "border-[var(--geist-foreground)]"
                              : "border-[var(--ds-gray-400)]"
                          }`}
                        >
                          {isSelected && (
                            <div className="size-2 rounded-full bg-[var(--geist-foreground)]" />
                          )}
                        </div>
                        <span className="font-medium text-xs text-[var(--geist-foreground)]">
                          {net.name}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-[var(--ds-gray-900)]">
                        USDC
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Deposit Address Card */}
            <div className="p-4 rounded-xl border border-[var(--brand-border-subtle)] bg-[var(--brand-glass)] space-y-3">
              <div className="text-xs text-[var(--ds-gray-900)]">
                Send exactly{" "}
                <strong className="text-[var(--geist-foreground)] tabular-nums">
                  {selectedPlan.priceUsdc} USDC
                </strong>{" "}
                to this {selectedNetwork.toUpperCase()} address:
              </div>

              <div className="flex items-center gap-2">
                <code className="flex-1 bg-[var(--brand-card-bg)] border border-[var(--brand-border-subtle)] px-3 py-2 rounded-lg font-mono text-xs text-[var(--geist-foreground)] select-all truncate">
                  {currentAddress}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(currentAddress, "address")}
                  className="shrink-0 text-xs gap-1.5 rounded-lg"
                >
                  {copiedField === "address" ? (
                    <>
                      <CheckCircle2 className="size-3.5 text-emerald-500" />{" "}
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" /> Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Transfer & Verification Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option A: Web3 1-Click */}
              <div className="p-4 rounded-xl border border-[var(--brand-border-subtle)] bg-[var(--brand-glass)] space-y-3 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Wallet className="size-4" />
                    <span className="font-outfit font-semibold text-xs">
                      Web3 Wallet Transfer
                    </span>
                  </div>
                  <p className="font-satoshi text-[11px] text-[var(--ds-gray-900)]">
                    Send directly from your connected browser wallet:
                  </p>
                </div>
                <Button
                  variant="default"
                  size="md"
                  isLoading={isVerifying}
                  onClick={handleWeb3Transfer}
                  className="w-full text-xs font-semibold rounded-xl"
                >
                  Transfer {selectedPlan.priceUsdc} USDC
                </Button>
              </div>

              {/* Option B: Manual Verification */}
              <div className="p-4 rounded-xl border border-[var(--brand-border-subtle)] bg-[var(--brand-glass)] space-y-3">
                <div className="space-y-1">
                  <span className="font-outfit font-semibold text-xs block">
                    Verify by Transaction Hash:
                  </span>
                  <p className="font-satoshi text-[11px] text-[var(--ds-gray-900)]">
                    Paste your TX hash or Solana signature after sending:
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={txHashInput}
                    onChange={(e) => setTxHashInput(e.target.value)}
                    placeholder="0x... or TX signature"
                    className="flex-1 bg-[var(--brand-card-bg)] border border-[var(--brand-border-subtle)] rounded-lg px-3 py-1.5 text-xs text-[var(--geist-foreground)] font-mono focus:ring-1 focus:ring-[var(--ds-focus-color)]"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    isLoading={isVerifying}
                    onClick={() => handleVerifyTx()}
                    className="text-xs rounded-lg"
                  >
                    Verify
                  </Button>
                </div>
              </div>
            </div>

            {/* Error / Success Feedback */}
            {verifyError && (
              <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-xs text-rose-500">
                {verifyError}
              </div>
            )}
            {successMessage && (
              <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-500 flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
