"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  ArrowRight,
  Terminal,
  Globe,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";

interface SetupAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SetupAgentModal({ isOpen, onClose }: SetupAgentModalProps) {
  const router = useRouter();
  const { user, signInWithGoogle, setIsCliModalOpen, showOnboardingPrompt } = useAuth();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && user && showOnboardingPrompt) {
      onClose();
    }
  }, [isOpen, user, showOnboardingPrompt, onClose]);

  if (!isOpen) return null;

  const copyCli = () => {
    navigator.clipboard.writeText("pip install mone-agent\nmone doctor\nmone run --mode copilot");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLaunchWeb = () => {
    onClose();
    router.push("/agent");
  };

  const handleOpenCliModal = () => {
    onClose();
    setIsCliModalOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-card-bg)] shadow-2xl p-6 sm:p-8 space-y-6 text-[var(--geist-foreground)]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 size-8 rounded-full flex items-center justify-center text-[var(--ds-gray-900)] hover:text-[var(--geist-foreground)] hover:bg-[var(--brand-border-subtle)] transition"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <h2 className="font-outfit text-2xl font-bold tracking-tight">
            Setup Mone Agent
          </h2>
          <p className="text-xs sm:text-sm text-[var(--ds-gray-900)] max-w-sm mx-auto">
            Start autonomous weather prediction trading on Kalshi &amp; Polymarket in seconds.
          </p>
        </div>

        {!user ? (
          /* Step 1: Google Sign In with Free Trial */
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl border border-[var(--brand-border-subtle)] bg-[var(--brand-glass)] text-center space-y-1">
              <span className="text-xs font-semibold text-emerald-500 flex items-center justify-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                7-Day Free Trial Included
              </span>
              <p className="text-xs text-[var(--ds-gray-900)]">
                50 free execution runs. No credit card required.
              </p>
            </div>

            <Button
              variant="default"
              size="lg"
              onClick={async () => {
                await signInWithGoogle();
              }}
              className="w-full gap-3 text-sm font-semibold rounded-xl"
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
              Continue with Google
            </Button>

            <div className="text-center pt-2">
              <button
                onClick={handleLaunchWeb}
                className="text-xs text-[var(--ds-gray-900)] hover:text-[var(--geist-foreground)] underline underline-offset-4"
              >
                Open Dashboard &rarr;
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Choose Execution Mode */
          <div className="space-y-4 pt-1">
            <div className="text-xs text-[var(--ds-gray-900)] text-center">
              Logged in as <strong className="text-[var(--geist-foreground)]">{user.name || user.email}</strong> · Plan: <strong className="text-emerald-500">{user.plan}</strong>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Web Dashboard */}
              <button
                onClick={handleLaunchWeb}
                className="p-4 rounded-xl border border-[var(--brand-border-subtle)] bg-[var(--brand-glass)] hover:border-[var(--brand-border)] text-left space-y-2 transition group"
              >
                <div className="size-8 rounded-lg bg-[var(--brand-card-bg)] border border-[var(--brand-border-subtle)] flex items-center justify-center">
                  <Globe className="size-4 text-[var(--geist-foreground)]" />
                </div>
                <div>
                  <h4 className="font-outfit font-semibold text-sm group-hover:text-[var(--geist-foreground)]">
                    Web Dashboard
                  </h4>
                  <p className="text-[11px] text-[var(--ds-gray-900)] mt-0.5">
                    Live UI runner in your browser. No terminal setup needed.
                  </p>
                </div>
              </button>

              {/* Option 2: CLI Terminal */}
              <button
                onClick={handleOpenCliModal}
                className="p-4 rounded-xl border border-[var(--brand-border-subtle)] bg-[var(--brand-glass)] hover:border-[var(--brand-border)] text-left space-y-2 transition group"
              >
                <div className="size-8 rounded-lg bg-[var(--brand-card-bg)] border border-[var(--brand-border-subtle)] flex items-center justify-center">
                  <Terminal className="size-4 text-[var(--geist-foreground)]" />
                </div>
                <div>
                  <h4 className="font-outfit font-semibold text-sm group-hover:text-[var(--geist-foreground)]">
                    Terminal CLI
                  </h4>
                  <p className="text-[11px] text-[var(--ds-gray-900)] mt-0.5">
                    Run locally or on VPS for 24/7 background execution.
                  </p>
                </div>
              </button>
            </div>

            <div className="pt-2">
              <Button
                variant="default"
                size="md"
                onClick={handleLaunchWeb}
                className="w-full text-xs font-semibold rounded-xl gap-2"
              >
                Open Dashboard <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
