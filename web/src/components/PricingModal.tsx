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

  const currentAddress = selectedNetwork === "solana" ? WALLETS.solana : WALLETS.evm;

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
        throw new Error(data.error || "Verification failed. Please verify the transaction hash.");
      }

      // Upgrade account immediately
      upgradePlan(selectedPlan?.key || "pass_10");
      setSuccessMessage(`Payment confirmed! ${selectedPlan?.name} activated on your account.`);

      setTimeout(() => {
        setSuccessMessage(null);
        setSelectedPlan(null);
        setIsPricingOpen(false);
      }, 2000);
    } catch (err: any) {
      setVerifyError(err.message || "Failed to verify transaction.");
    } finally {
      setIsVerifying(false);
    }
  };

  // 1-Click Web3 Wallet Transfer (MetaMask / Phantom / Rabby)
  const handleWeb3Transfer = async () => {
    if (selectedNetwork === "solana") {
      setVerifyError("For Solana, please send USDC via Phantom to the address below and paste your TX signature.");
      return;
    }

    if (typeof window === "undefined" || !(window as any).ethereum) {
      setVerifyError("No Web3 wallet extension found. You can send USDC directly to the address below and paste the TX hash.");
      return;
    }

    setIsVerifying(true);
    setVerifyError(null);

    try {
      const ethereum = (window as any).ethereum;
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0e0e12] border border-zinc-800 rounded-2xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
        {/* Close Button */}
        <button
          onClick={() => {
            setSelectedPlan(null);
            setIsPricingOpen(false);
          }}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {!selectedPlan ? (
          /* View 1: Pricing Tiers Selection */
          <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-400">
                <Sparkles className="w-3.5 h-3.5" />
                Native USDC Crypto Payments
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Simple pricing. Zero banking borders.
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400">
                Every new user gets a <strong>7-Day Free Trial</strong> (50 runs). Top up anytime with native <strong>USDC</strong> on Polygon, Base, or Solana.
              </p>

              {user && (
                <div className="pt-1">
                  <span className="inline-block text-xs px-3 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
                    Active Plan: <span className="text-emerald-400 font-semibold">{user.plan}</span> (
                    {user.plan === "Pro" ? "Unlimited" : `${user.runsRemaining} runs left`})
                  </span>
                </div>
              )}
            </div>

            {/* Pricing Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
              {/* Card 1: 100 Runs */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-5 flex flex-col justify-between hover:border-zinc-700 transition">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">100 Runs</h3>
                    <p className="text-xs text-zinc-400">Pay as you go</p>
                  </div>

                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold text-white">10</span>
                    <span className="text-sm font-bold text-indigo-400">USDC</span>
                    <span className="text-xs text-zinc-500">one-time</span>
                  </div>

                  <ul className="space-y-2 text-xs text-zinc-300">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>100 automated trade runs</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>WeatherNext 3 &amp; 2 ensembles</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Never expires</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => setSelectedPlan(PLANS[0])}
                    className="w-full py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
                  >
                    Pay 10 USDC <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card 2: 300 Runs */}
              <div className="rounded-xl border border-indigo-500/40 bg-zinc-950/90 p-5 flex flex-col justify-between relative shadow-lg shadow-indigo-500/5">
                <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-indigo-500 text-[10px] font-bold text-white uppercase tracking-wider">
                  Most Popular
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">300 Runs</h3>
                    <p className="text-xs text-indigo-300">Save 17% per trade run</p>
                  </div>

                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold text-white">25</span>
                    <span className="text-sm font-bold text-indigo-400">USDC</span>
                    <span className="text-xs text-zinc-500">one-time</span>
                  </div>

                  <ul className="space-y-2 text-xs text-zinc-300">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>300 automated trade runs</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Priority execution queue</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Never expires</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => setSelectedPlan(PLANS[1])}
                    className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
                  >
                    Pay 25 USDC <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card 3: Pro */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-5 flex flex-col justify-between hover:border-zinc-700 transition">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Pro</h3>
                    <p className="text-xs text-zinc-400">For active quantitative traders</p>
                  </div>

                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold text-white">49</span>
                    <span className="text-sm font-bold text-indigo-400">USDC</span>
                    <span className="text-xs text-zinc-500">/ 30 days</span>
                  </div>

                  <ul className="space-y-2 text-xs text-zinc-300">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span><strong>Unlimited</strong> trade runs</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Sub-second order book stream</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Telegram webhook alerts</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => setSelectedPlan(PLANS[2])}
                    className="w-full py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
                  >
                    Pay 49 USDC <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-800/80 pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-500 gap-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Permissionless USDC: Accepted on Polygon, Base, and Solana.</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>Instant on-chain confirmation &bull; Zero merchant KYC hold</span>
              </div>
            </div>
          </div>
        ) : (
          /* View 2: Multi-Chain Crypto Checkout Modal */
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <button
                onClick={() => {
                  setSelectedPlan(null);
                  setVerifyError(null);
                  setSuccessMessage(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Plans
              </button>

              <span className="text-xs font-semibold text-white">
                Checkout: <span className="text-indigo-400">{selectedPlan.name}</span> ({selectedPlan.priceUsdc} USDC)
              </span>
            </div>

            {/* Network Selector Tabs */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-400">Select Blockchain Network:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSelectedNetwork("polygon")}
                  className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                    selectedNetwork === "polygon"
                      ? "bg-purple-950/30 border-purple-500 text-purple-200"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-400" />
                      Polygon
                    </div>
                    <span className="text-[10px] text-zinc-500">Polymarket Native</span>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedNetwork("base")}
                  className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                    selectedNetwork === "base"
                      ? "bg-blue-950/30 border-blue-500 text-blue-200"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      Base
                    </div>
                    <span className="text-[10px] text-zinc-500">Coinbase L2</span>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedNetwork("solana")}
                  className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                    selectedNetwork === "solana"
                      ? "bg-emerald-950/30 border-emerald-500 text-emerald-200"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Solana
                    </div>
                    <span className="text-[10px] text-zinc-500">Phantom SPL</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Payment Details Container */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-zinc-950 p-5 rounded-xl border border-zinc-800">
              {/* QR Code */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-3 bg-black rounded-lg border border-zinc-800 text-center space-y-2">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${currentAddress}&bgcolor=000000&color=ffffff`}
                  alt="USDC Deposit QR Code"
                  className="w-36 h-36 rounded-md"
                />
                <span className="text-[10px] text-zinc-500 font-mono">Scan to send from mobile wallet</span>
              </div>

              {/* Transfer Info */}
              <div className="md:col-span-8 space-y-3.5">
                <div>
                  <span className="text-[11px] text-zinc-500 block">Exact Amount to Send:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold font-mono text-white">
                      {selectedPlan.priceUsdc}.00 USDC
                    </span>
                    <button
                      onClick={() => handleCopy(`${selectedPlan.priceUsdc}.00`, "amount")}
                      className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      {copiedField === "amount" ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-zinc-500 block">
                    Recipient Deposit Address ({selectedNetwork.toUpperCase()}):
                  </span>
                  <div className="flex items-center gap-2 p-2 bg-black rounded-lg border border-zinc-800 font-mono text-xs text-zinc-200">
                    <span className="truncate flex-1">{currentAddress}</span>
                    <button
                      onClick={() => handleCopy(currentAddress, "addr")}
                      className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition shrink-0"
                      title="Copy Address"
                    >
                      {copiedField === "addr" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 1-Click Web3 Send Button */}
                {selectedNetwork !== "solana" && (
                  <button
                    onClick={handleWeb3Transfer}
                    disabled={isVerifying}
                    className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Confirming in Wallet...
                      </>
                    ) : (
                      <>
                        <Wallet className="w-3.5 h-3.5" /> Pay 1-Click with Web3 Wallet (MetaMask / Rabby / Phantom)
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Manual TXID Verification Section */}
            <div className="space-y-3 p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
              <label className="block text-xs font-medium text-zinc-300">
                Sent from an exchange (Binance, Bybit, Coinbase, Yellow Card) or another wallet?
              </label>
              <p className="text-[11px] text-zinc-500">
                Paste your Transaction Hash (TXID) or Solana signature below for instant verification:
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={txHashInput}
                  onChange={(e) => setTxHashInput(e.target.value)}
                  placeholder={
                    selectedNetwork === "solana"
                      ? "Paste Solana Transaction Signature (e.g. 5xKu...)"
                      : "Paste EVM Transaction Hash (e.g. 0x8a92...)"
                  }
                  className="flex-1 text-xs bg-black border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 font-mono focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={() => handleVerifyTx()}
                  disabled={isVerifying || !txHashInput.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" /> Verify &amp; Unlock
                    </>
                  )}
                </button>
              </div>

              {/* Feedback messages */}
              {verifyError && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
                  {verifyError}
                </div>
              )}

              {successMessage && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  {successMessage}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
