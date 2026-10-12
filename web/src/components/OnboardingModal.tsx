"use client";

import React from "react";
import { useAuth } from "../context/AuthContext";
import { Sparkles, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Card } from "./ui/Card";

export function OnboardingModal() {
  const {
    user,
    showOnboardingPrompt,
    setShowOnboardingPrompt,
    setIsPricingOpen,
  } = useAuth();

  if (!showOnboardingPrompt || !user) return null;

  const handleExplorePricing = () => {
    setShowOnboardingPrompt(false);
    setIsPricingOpen(true);
  };

  const handleProceed = () => {
    setShowOnboardingPrompt(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <Card className="bg-[var(--geist-background)] border-[var(--ds-gray-400)] rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
          <Sparkles className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <h2 className="font-outfit text-xl sm:text-2xl font-bold text-[var(--geist-foreground)]">
            Welcome to mone, {user.name}!
          </h2>
          <p className="font-satoshi text-xs sm:text-sm text-[var(--ds-gray-900)] leading-relaxed">
            Your <span className="text-emerald-500 font-semibold">7-Day Free Trial</span> is now active with <span className="text-[var(--geist-foreground)] font-semibold">50 complimentary runs</span> and all prediction features unlocked.
          </p>
          <p className="font-satoshi text-xs text-[var(--ds-gray-900)]">
            Explore our transparent pricing tiers to learn how automated runs work after your trial.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--ds-gray-100)] border border-[var(--ds-gray-400)] text-left space-y-2 text-xs text-[var(--ds-gray-900)] font-mono tabular-nums">
          <div className="flex justify-between">
            <span className="text-[var(--ds-gray-900)]">Account:</span>
            <span className="text-[var(--geist-foreground)]">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--ds-gray-900)]">Trial Period:</span>
            <span className="text-emerald-500 font-semibold">7 Days Active</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--ds-gray-900)]">Included Runs:</span>
            <span className="text-[var(--geist-foreground)] font-semibold">50 Trade Cycles</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--ds-gray-900)]">Architecture:</span>
            <span className="text-[var(--ds-blue-700)] font-semibold">100% Non-Custodial (BYOK)</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="blue"
            size="md"
            onClick={handleExplorePricing}
            className="flex-1 text-xs font-semibold gap-2"
          >
            Explore Plans &amp; Pricing <ArrowRight className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={handleProceed}
            className="flex-1 text-xs"
          >
            Go to Agent Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
}
