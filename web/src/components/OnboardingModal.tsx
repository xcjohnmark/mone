"use client";

import React from "react";
import { useAuth } from "../context/AuthContext";
import { Sparkles, ArrowRight, ShieldCheck, Zap } from "lucide-react";

export function OnboardingModal() {
  const { user, showOnboardingPrompt, setShowOnboardingPrompt, setIsPricingOpen } = useAuth();

  if (!showOnboardingPrompt || !user) return null;

  const handleExplorePricing = () => {
    setShowOnboardingPrompt(false);
    setIsPricingOpen(true);
  };

  const handleProceed = () => {
    setShowOnboardingPrompt(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0e0e12] border border-zinc-800 rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <Sparkles className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Welcome to mone, {user.name}!
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300">
            Your <span className="text-emerald-400 font-semibold">7-Day Free Trial</span> is now active with <span className="text-white font-semibold">50 complimentary runs</span> and all Pro features unlocked.
          </p>
          <p className="text-xs text-zinc-400 pt-1">
            Explore our transparent pricing plans so you know how trade runs work after your trial ends.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-left space-y-2 text-xs text-zinc-300 font-mono">
          <div className="flex justify-between">
            <span className="text-zinc-500">Account:</span>
            <span className="text-zinc-200">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Trial Period:</span>
            <span className="text-emerald-400 font-semibold">7 Days Active</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Included Runs:</span>
            <span className="text-white font-semibold">50 Trade Cycles</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Custody:</span>
            <span className="text-blue-400 font-semibold">100% Non-Custodial (BYOK)</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleExplorePricing}
            className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition"
          >
            Explore Plans & Pricing <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleProceed}
            className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition"
          >
            Go to Agent Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
