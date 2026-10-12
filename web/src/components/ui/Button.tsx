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
    | "blue";
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
      "inline-flex items-center justify-center font-medium font-satoshi rounded-md transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-focus-color)] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer select-none";

    const variants = {
      default:
        "bg-[var(--geist-foreground)] text-[var(--geist-background)] hover:opacity-90 shadow-sm",
      secondary:
        "bg-[var(--ds-gray-100)] text-[var(--geist-foreground)] border border-[var(--ds-gray-400)] hover:bg-[var(--ds-gray-200)] hover:border-[var(--ds-gray-500)]",
      outline:
        "bg-transparent text-[var(--geist-foreground)] border border-[var(--ds-gray-400)] hover:bg-[var(--ds-gray-100)] hover:border-[var(--ds-gray-500)]",
      ghost:
        "bg-transparent text-[var(--ds-gray-900)] hover:text-[var(--geist-foreground)] hover:bg-[var(--ds-gray-100)]",
      destructive:
        "bg-[var(--geist-error)] text-white hover:opacity-90 shadow-sm",
      blue:
        "bg-[var(--ds-blue-700)] text-white hover:bg-[var(--ds-blue-900)] shadow-sm",
    };

    const sizes = {
      sm: "text-xs px-2.5 py-1.5 h-8 gap-1.5",
      md: "text-sm px-4 py-2 h-9 gap-2",
      lg: "text-base px-5 py-2.5 h-11 gap-2.5",
      icon: "w-8 h-8 p-0 text-sm",
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
            className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-current"
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
