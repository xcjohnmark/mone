"use client";

import React, { forwardRef } from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "ghost"
    | "destructive"
    | "blue"
    | "glass";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium font-satoshi transition-all duration-200 ease-in-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-focus-color)] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer select-none";

    const variants = {
      default:
        "bg-[var(--geist-foreground)] text-[var(--geist-background)] hover:opacity-90 shadow-brand-soft",
      secondary:
        "bg-[var(--ds-gray-100)] text-[var(--geist-foreground)] border border-[var(--brand-border-subtle)] hover:bg-[var(--ds-gray-200)] hover:border-[var(--brand-border)] shadow-brand-soft",
      outline:
        "bg-transparent text-[var(--geist-foreground)] border border-[var(--brand-border-subtle)] hover:bg-[var(--ds-gray-100)] hover:border-[var(--brand-border)] shadow-brand-soft",
      ghost:
        "bg-transparent text-[var(--ds-gray-900)] hover:text-[var(--geist-foreground)] hover:bg-[var(--ds-gray-100)]",
      destructive:
        "bg-[var(--geist-error)] text-white hover:opacity-90 shadow-brand-soft",
      blue:
        "bg-[var(--ds-blue-700)] text-white hover:bg-[var(--ds-blue-900)] shadow-brand-soft",
      glass:
        "bg-[var(--brand-glass)] backdrop-blur-md text-[var(--geist-foreground)] border border-[var(--brand-border)] hover:bg-[var(--ds-gray-200)]/80 shadow-brand-soft",
    };

    const sizes = {
      sm: "text-xs px-3 h-8 gap-1.5 rounded-brand-card",
      md: "text-xs px-4 h-10 gap-2 rounded-brand-card", // 40px standard
      lg: "text-sm px-6 h-12 gap-2.5 rounded-brand-card font-semibold", // 48px touch-target
      icon: "size-[38px] p-0 rounded-full text-sm", // 38px icon target
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-0.5 mr-2 size-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
