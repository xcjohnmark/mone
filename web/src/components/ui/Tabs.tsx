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
        "inline-flex p-1 rounded-lg border border-[var(--ds-gray-400)] bg-[var(--ds-gray-100)] gap-1",
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
              "rounded-md font-satoshi font-medium transition-all duration-150 select-none text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-focus-color)]",
              size === "sm"
                ? "text-xs px-2.5 py-1"
                : "text-sm px-3.5 py-1.5",
              isActive
                ? "bg-[var(--geist-background)] text-[var(--geist-foreground)] shadow-sm font-semibold"
                : "text-[var(--ds-gray-900)] hover:text-[var(--geist-foreground)] hover:bg-[var(--ds-gray-200)]"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
