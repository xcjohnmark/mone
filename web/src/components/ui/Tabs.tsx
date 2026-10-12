"use client";

import React from "react";
import { cn } from "../../lib/utils";

export interface TabItem {
  id: string;
  label: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onValueChange: (id: string) => void;
  className?: string;
  size?: "sm" | "md";
}

export function Tabs({
  items,
  value,
  onValueChange,
  className,
  size = "md",
}: TabsProps) {
  return (
    <div
      className={cn(
        "inline-flex p-1 rounded-brand-card border border-[var(--brand-border-subtle)] bg-[var(--brand-card-bg)] backdrop-blur-md gap-1 shadow-brand-soft",
        className
      )}
    >
      {items.map((tab) => {
        const isActive = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onValueChange(tab.id)}
            className={cn(
              "rounded-brand-card font-satoshi font-medium transition-all duration-200 ease-in-out select-none text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-focus-color)]",
              size === "sm"
                ? "text-xs px-3 py-1.5"
                : "text-xs sm:text-sm px-4 py-2",
              isActive
                ? "bg-[var(--geist-background)] text-[var(--geist-foreground)] shadow-sm font-semibold border border-[var(--brand-border-subtle)]"
                : "text-[var(--ds-gray-900)] hover:text-[var(--geist-foreground)] hover:bg-[var(--ds-gray-200)]/60"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
