"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "../context/AuthContext";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Terminal,
  Copy,
  Check,
  Globe,
  Zap,
  X,
  CheckCircle2,
  Key,
} from "lucide-react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Card } from "./ui/Card";

export function OnboardingModal() {
  const router = useRouter();
  const {
    user,
    showOnboardingPrompt,
    setShowOnboardingPrompt,
    setIsPricingOpen,
    setIsCliModalOpen,
  } = useAuth();

  const [copiedToken, setCopiedToken] = useState(false);

  if (!showOnboardingPrompt || !user) return null;

  const handleCopyToken = () => {
    if (!user.cliApiToken) return;
    navigator.clipboard.writeText(user.cliApiToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleGoToDashboard = () => {
    setShowOnboardingPrompt(false);
    router.push("/agent");
  };

  const handleSetupCli = () => {
    setShowOnboardingPrompt(false);
    setIsCliModalOpen(true);
  };

  const handleExplorePricing = () => {
    setShowOnboardingPrompt(false);
    setIsPricingOpen(true);
  };

  const handleClose = () => {
    setShowOnboardingPrompt(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card className="bg-[var(--brand-card-bg)] border border-[var(--brand-border)] rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative text-center">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 size-8 rounded-full flex items-center justify-center text-[var(--ds-gray-900)] hover:text-[var(--geist-foreground)] hover:bg-[var(--brand-border-subtle)] transition"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        {/* Celebration Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-500 font-semibold">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>7-Day Free Trial Activated</span>
          </div>

          <h2 className="font-outfit text-2xl sm:text-3xl font-extrabold text-[var(--geist-foreground)] tracking-tight">
            Welcome to mone, {user.name.split(" ")[0]}!
          </h2>

          <p className="font-satoshi text-xs sm:text-sm text-[var(--ds-gray-900)] max-w-md mx-auto leading-relaxed">
            Your account is loaded with <strong className="text-[var(--geist-foreground)]">50 complimentary automated runs</strong>. Autonomous weather forecasting intelligence across Kalshi &amp; Polymarket is now unlocked.
          </p>
        </div>

        {/* User & Trial Entitlement Details */}
        <div className="p-4 rounded-xl bg-[var(--brand-glass)] border border-[var(--brand-border-subtle)] space-y-3 text-left">
          {/* User ID Row */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--brand-border-subtle)] text-xs">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-full overflow-hidden border border-[var(--brand-border-subtle)] bg-[var(--brand-border-subtle)] shrink-0 flex items-center justify-center">
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="size-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-xs font-bold">
                    {user.name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <p className="font-semibold text-[var(--geist-foreground)] leading-none">
                  {user.name}
                </p>
                <p className="text-[11px] text-[var(--ds-gray-900)] mt-0.5">
                  {user.email}
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
              Active Trial
            </span>
          </div>

          {/* Grid Stats */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs py-1">
            <div className="p-2 rounded-lg bg-[var(--brand-card-bg)] border border-[var(--brand-border-subtle)]">
              <span className="block text-[10px] text-[var(--ds-gray-900)] uppercase font-semibold">
                Trial Days
              </span>
              <span className="font-outfit text-base font-bold text-emerald-500">
                7 Days
              </span>
            </div>
            <div className="p-2 rounded-lg bg-[var(--brand-card-bg)] border border-[var(--brand-border-subtle)]">
              <span className="block text-[10px] text-[var(--ds-gray-900)] uppercase font-semibold">
                Free Compute
              </span>
              <span className="font-outfit text-base font-bold text-[var(--geist-foreground)]">
                50 Runs
              </span>
            </div>
            <div className="p-2 rounded-lg bg-[var(--brand-card-bg)] border border-[var(--brand-border-subtle)]">
              <span className="block text-[10px] text-[var(--ds-gray-900)] uppercase font-semibold">
                Architecture
              </span>
              <span className="font-outfit text-xs font-bold text-[var(--geist-foreground)] mt-0.5 block truncate">
                BYOK Non-Custodial
              </span>
            </div>
          </div>

          {/* CLI Token Row */}
          {user.cliApiToken && (
            <div className="pt-2 border-t border-[var(--brand-border-subtle)]">
              <div className="flex items-center justify-between text-[11px] text-[var(--ds-gray-900)] mb-1.5">
                <span className="flex items-center gap-1.5 font-medium">
                  <Key className="size-3 text-emerald-500" />
                  Terminal CLI Authentication Token:
                </span>
                <span className="text-[10px] text-[var(--ds-gray-900)]">
                  For VPS / Terminal Setup
                </span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-2.5 py-1.5 rounded-lg bg-[var(--brand-card-bg)] border border-[var(--brand-border-subtle)] font-mono text-[11px] text-[var(--geist-foreground)] truncate select-all">
                  {user.cliApiToken}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyToken}
                  className="shrink-0 text-[11px] h-8 px-2.5 gap-1.5"
                >
                  {copiedToken ? (
                    <>
                      <Check className="size-3 text-emerald-500" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Next Step Action Buttons */}
        <div className="space-y-2.5 pt-1">
          {/* Primary Action: Go to Web Dashboard */}
          <Button
            variant="default"
            size="lg"
            onClick={handleGoToDashboard}
            className="w-full text-xs font-semibold rounded-xl gap-2 shadow-lg"
          >
            <Globe className="size-4" />
            <span>Launch Web Dashboard</span>
            <ArrowRight className="size-4 ml-auto" />
          </Button>

          {/* Secondary Action: Setup Agent CLI */}
          <Button
            variant="secondary"
            size="md"
            onClick={handleSetupCli}
            className="w-full text-xs font-semibold rounded-xl gap-2"
          >
            <Terminal className="size-4" />
            <span>Setup Autonomous Agent (Terminal / CLI)</span>
          </Button>
        </div>

        {/* Pricing top-up hint */}
        <div className="pt-1 text-center">
          <button
            onClick={handleExplorePricing}
            className="text-[11px] text-[var(--ds-gray-900)] hover:text-[var(--geist-foreground)] transition underline underline-offset-4"
          >
            Need more runs? View USDC Pricing Passes &amp; Top-Ups &rarr;
          </button>
        </div>
      </Card>
    </div>
  );
}
