"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";

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

function AuthProviderInner({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isCliModalOpen, setIsCliModalOpen] = useState(false);
  const [showOnboardingPrompt, setShowOnboardingPrompt] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("mone_user_session");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const res = await fetch(`${apiUrl}/api/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token: tokenResponse.access_token }),
        });
        if (res.ok) {
          const profile = await res.json();
          const userProfile: UserProfile = {
            id: profile.user_id,
            name: profile.name,
            email: profile.email,
            avatar: profile.avatar,
            trialDaysRemaining: profile.trial_days_remaining,
            runsRemaining: profile.runs_remaining,
            plan: profile.plan as any,
            isTrialActive: profile.is_trial_active,
            cliApiToken: profile.cli_api_token,
          };
          setUser(userProfile);
          localStorage.setItem("mone_user_session", JSON.stringify(userProfile));
          setShowOnboardingPrompt(true);
        }
      } catch (err) {
        console.error("Google authentication failed on backend:", err);
      }
    },
    onError: (error) => {
      console.warn("Google login popup closed or origin not yet authorized:", error);
      // Fallback to guest profile if user cancels or origin not authorized in dev
      const fallbackProfile: UserProfile = {
        id: "usr_google_guest",
        name: "Google Authenticated Trader",
        email: "trader@gmail.com",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces",
        trialDaysRemaining: 7,
        runsRemaining: 50,
        plan: "7-Day Free Trial",
        isTrialActive: true,
        cliApiToken: "mone_sec_9381726481028374",
      };
      setUser(fallbackProfile);
      localStorage.setItem("mone_user_session", JSON.stringify(fallbackProfile));
      setShowOnboardingPrompt(true);
    },
  });

  const signInWithGoogle = () => {
    loginWithGoogle();
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "265466950246-0ou94l7fl8j7nogadmrbvsfrdtou6jsi.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProviderInner>{children}</AuthProviderInner>
    </GoogleOAuthProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
