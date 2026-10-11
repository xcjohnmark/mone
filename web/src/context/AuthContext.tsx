"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  trialDaysRemaining: number;
  runsRemaining: number;
  plan: "7-Day Free Trial" | "100 Runs Pass" | "300 Runs Pass" | "Pro";
  isTrialActive: boolean;
  cliApiToken: string;
}

interface AuthContextType {
  user: UserProfile | null;
  signInWithGoogle: () => void;
  signOut: () => void;
  isPricingOpen: boolean;
  setIsPricingOpen: (open: boolean) => void;
  isCliModalOpen: boolean;
  setIsCliModalOpen: (open: boolean) => void;
  showOnboardingPrompt: boolean;
  setShowOnboardingPrompt: (show: boolean) => void;
  upgradePlan: (planKey: string) => void;
  consumeRun: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isCliModalOpen, setIsCliModalOpen] = useState(false);
  const [showOnboardingPrompt, setShowOnboardingPrompt] = useState(false);

  useEffect(() => {
    // Restore session from localStorage if available
    try {
      const stored = localStorage.getItem("mone_user_session");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const signInWithGoogle = () => {
    const defaultProfile: UserProfile = {
      id: "usr_google_7a82b4",
      name: "Alex Vance",
      email: "alex.vance@gmail.com",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces",
      trialDaysRemaining: 7,
      runsRemaining: 50,
      plan: "7-Day Free Trial",
      isTrialActive: true,
      cliApiToken: "mone_sec_9381726481028374",
    };

    setUser(defaultProfile);
    try {
      localStorage.setItem("mone_user_session", JSON.stringify(defaultProfile));
    } catch {
      // ignore
    }

    // Immediately trigger onboarding exploration prompt per user requirement
    setShowOnboardingPrompt(true);
  };

  const signOut = () => {
    setUser(null);
    try {
      localStorage.removeItem("mone_user_session");
    } catch {
      // ignore
    }
  };

  const upgradePlan = (planKey: string) => {
    if (!user) return;
    let updated: UserProfile;

    if (planKey === "pass_10" || planKey === "fuel_10") {
      updated = {
        ...user,
        plan: "100 Runs Pass",
        runsRemaining: user.runsRemaining + 100,
        isTrialActive: false,
      };
    } else if (planKey === "pass_25" || planKey === "fuel_25") {
      updated = {
        ...user,
        plan: "300 Runs Pass",
        runsRemaining: user.runsRemaining + 300,
        isTrialActive: false,
      };
    } else if (planKey === "pro_subscription") {
      updated = {
        ...user,
        plan: "Pro",
        runsRemaining: 999999, // unlimited
        isTrialActive: false,
      };
    } else {
      updated = user;
    }

    setUser(updated);
    try {
      localStorage.setItem("mone_user_session", JSON.stringify(updated));
    } catch {
      // ignore
    }
    setIsPricingOpen(false);
  };

  const consumeRun = (): boolean => {
    if (!user) return false;
    if (user.plan === "Pro") return true;
    if (user.runsRemaining <= 0) {
      setIsPricingOpen(true);
      return false;
    }

    const updated = { ...user, runsRemaining: user.runsRemaining - 1 };
    setUser(updated);
    try {
      localStorage.setItem("mone_user_session", JSON.stringify(updated));
    } catch {
      // ignore
    }
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        signInWithGoogle,
        signOut,
        isPricingOpen,
        setIsPricingOpen,
        isCliModalOpen,
        setIsCliModalOpen,
        showOnboardingPrompt,
        setShowOnboardingPrompt,
        upgradePlan,
        consumeRun,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
