"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`size-[38px] rounded-full border border-[var(--brand-border-subtle)] bg-[var(--brand-card-bg)] opacity-0 ${className}`}
      />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
      className={`relative inline-flex items-center justify-center size-[38px] rounded-full border border-[var(--brand-border-subtle)] bg-[var(--brand-card-bg)] backdrop-blur-md text-[var(--ds-gray-900)] hover:text-[var(--geist-foreground)] hover:border-[var(--brand-border)] hover:bg-[var(--ds-gray-200)] shadow-brand-soft transition-all duration-200 ease-in-out active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-focus-color)] ${className}`}
    >
      {resolvedTheme === "dark" ? (
        <Sun className="size-4 text-amber-400 transition-transform duration-200" />
      ) : (
        <Moon className="size-4 text-zinc-700 transition-transform duration-200" />
      )}
    </button>
  );
}
