"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "../../lib/utils";

export function BrandLogo({
  href = "/",
  className = "",
  size = "md",
}: {
  href?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const iconSizes = {
    sm: "size-7",
    md: "size-9",
    lg: "size-11",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-3 group select-none transition-opacity duration-200 hover:opacity-90",
        className
      )}
    >
      <div
        className={cn(
          "relative rounded-brand-card overflow-hidden border border-[var(--brand-border-subtle)] bg-[var(--brand-card-bg)] backdrop-blur-md flex items-center justify-center shrink-0 shadow-brand-soft group-hover:border-[var(--brand-border)] transition-all duration-200",
          iconSizes[size]
        )}
      >
        <Image
          src="/logo.png"
          alt="mone logo"
          width={38}
          height={38}
          priority
          className="object-contain"
        />
      </div>
      <span
        className={cn(
          "font-outfit font-extrabold tracking-tight text-[var(--geist-foreground)] flex items-baseline leading-none",
          textSizes[size]
        )}
      >
        mone
        <span className="text-[var(--ds-blue-700)] group-hover:animate-pulse">
          _
        </span>
      </span>
    </Link>
  );
}
