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
    sm: "w-6 h-6",
    md: "w-7 h-7",
    lg: "w-9 h-9",
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
        "inline-flex items-center gap-2.5 group select-none transition-opacity hover:opacity-90",
        className
      )}
    >
      <div
        className={cn(
          "relative rounded-md overflow-hidden border border-[var(--ds-gray-400)] bg-[var(--ds-gray-100)] flex items-center justify-center shrink-0 shadow-sm",
          iconSizes[size]
        )}
      >
        <Image
          src="/logo.png"
          alt="mone logo"
          width={36}
          height={36}
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
