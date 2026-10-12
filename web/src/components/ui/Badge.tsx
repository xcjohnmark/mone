"use client";

import React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "success"
    | "warning"
    | "error"
    | "blue";
  dot?: boolean;
}

export function Badge({
  className,
  variant = "default",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default:
      "bg-[var(--ds-gray-200)] text-[var(--geist-foreground)] border border-[var(--brand-border-subtle)]",
    secondary:
      "bg-[var(--ds-gray-100)] text-[var(--ds-gray-900)] border border-[var(--brand-border-subtle)]",
    outline:
      "bg-transparent text-[var(--ds-gray-900)] border border-[var(--brand-border-subtle)]",
    success:
      "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
    warning:
      "bg-amber-500/10 text-amber-500 border border-amber-500/20",
    error:
      "bg-rose-500/10 text-rose-500 border border-rose-500/20",
    blue:
      "bg-[var(--ds-blue-700)]/10 text-[var(--ds-blue-700)] border border-[var(--brand-border)]",
  };

  const dotColors = {
    default: "bg-[var(--geist-foreground)]",
    secondary: "bg-[var(--ds-gray-900)]",
    outline: "bg-[var(--ds-gray-900)]",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    error: "bg-rose-500",
    blue: "bg-[var(--ds-blue-700)]",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium font-satoshi transition-all duration-200 ease-in-out select-none",
        variants[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "size-1.5 rounded-full animate-pulse",
            dotColors[variant]
          )}
        />
      )}
      {children}
    </div>
  );
}
