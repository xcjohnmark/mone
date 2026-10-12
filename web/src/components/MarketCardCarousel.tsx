"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CloudRain,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Droplets,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";

interface MarketItem {
  id: string;
  question: string;
  city: string;
  station: string;
  polymarketSlug: string;
  volume: string;
  yesProb: number;
  noProb: number;
  weatherNextProb: number;
  edge: string;
  side: "BUY YES" | "BUY NO";
  ensembleAgreement: string;
  nwsThreshold: string;
}

const MARKETS: MarketItem[] = [
  {
    id: "houston",
    question: "Will it rain in Houston on October 12?",
    city: "Houston, TX",
    station: "KIAH (Bush Intercontinental)",
    polymarketSlug: "will-it-rain-in-houston-october-12",
    volume: "$61,450",
    yesProb: 48,
    noProb: 52,
    weatherNextProb: 98.4,
    edge: "+50.4%",
    side: "BUY YES",
    ensembleAgreement: "61 of 63 ensemble members",
    nwsThreshold: "Precipitation ≥ 0.01 inches",
  },
  {
    id: "nyc",
    question: "Will it rain in New York City on October 12?",
    city: "New York, NY",
    station: "KNYC (Central Park)",
    polymarketSlug: "will-it-rain-in-nyc-october-12",
    volume: "$48,920",
    yesProb: 24,
    noProb: 76,
    weatherNextProb: 62.4,
    edge: "+38.4%",
    side: "BUY YES",
    ensembleAgreement: "42 of 63 ensemble members",
    nwsThreshold: "Precipitation ≥ 0.01 inches",
  },
  {
    id: "lax",
    question: "Will it rain in Los Angeles on October 12?",
    city: "Los Angeles, CA",
    station: "KLAX (Los Angeles Intl)",
    polymarketSlug: "will-it-rain-in-los-angeles-october-12",
    volume: "$32,180",
    yesProb: 22,
    noProb: 78,
    weatherNextProb: 4.2,
    edge: "+73.8%",
    side: "BUY NO",
    ensembleAgreement: "0 of 63 ensemble members (Dry Front)",
    nwsThreshold: "Precipitation ≥ 0.01 inches",
  },
];

export function MarketCardCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % MARKETS.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + MARKETS.length) % MARKETS.length);
  };

  useEffect(() => {
    if (isPaused) return;
    timerRef.current = setInterval(nextSlide, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, currentIndex]);

  const market = MARKETS[currentIndex];

  return (
    <div
      className="max-w-2xl mx-auto w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative rounded-2xl border border-[var(--brand-border-subtle)] bg-[var(--brand-card-bg)] shadow-brand-soft overflow-hidden transition-all duration-300 hover:border-[var(--brand-border)]">
        {/* Polymarket Top Embed Bar */}
        <div className="px-5 py-3.5 border-b border-[var(--brand-border-subtle)] bg-[var(--brand-glass)] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {/* Minimalist Polymarket Icon */}
            <div className="size-5 rounded-md bg-[var(--geist-foreground)] text-[var(--geist-background)] flex items-center justify-center font-bold text-[10px] tracking-tighter">
              P
            </div>
            <span className="font-semibold text-[var(--geist-foreground)] tracking-tight">
              Polymarket
            </span>
            <span className="text-[var(--ds-gray-500)]">·</span>
            <span className="text-[var(--ds-gray-900)] text-[11px] font-mono">
              Daily Precipitation
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-[var(--ds-gray-900)] tabular-nums">
            <span>Vol: {market.volume}</span>
            <span className="inline-flex items-center gap-1 text-emerald-500 font-medium">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
        </div>

        {/* Polymarket Question & Odds */}
        <div className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-[var(--ds-gray-900)]">
                <Droplets className="size-3.5 text-[var(--geist-foreground)]" />
                <span>{market.city}</span>
                <span>·</span>
                <span className="font-mono text-[11px]">{market.station}</span>
              </div>
              <h3 className="font-outfit text-xl sm:text-2xl font-bold tracking-tight text-[var(--geist-foreground)] leading-snug">
                {market.question}
              </h3>
            </div>
            <span className="text-[11px] font-mono px-2 py-1 rounded bg-[var(--brand-card-bg)] border border-[var(--brand-border-subtle)] text-[var(--ds-gray-900)] whitespace-nowrap">
              {market.nwsThreshold}
            </span>
          </div>

          {/* Probability Bars (Polymarket Style) */}
          <div className="space-y-2.5">
            {/* YES Row */}
            <div className="relative overflow-hidden rounded-xl border border-[var(--brand-border-subtle)] bg-[var(--brand-card-bg)] p-3 flex items-center justify-between transition-all">
              <div
                className="absolute inset-y-0 left-0 bg-[var(--geist-foreground)]/5 transition-all duration-500"
                style={{ width: `${market.yesProb}%` }}
              />
              <span className="relative z-10 font-semibold text-xs text-[var(--geist-foreground)]">
                Yes
              </span>
              <span className="relative z-10 font-mono text-sm font-bold text-[var(--geist-foreground)] tabular-nums">
                {market.yesProb}%{" "}
                <span className="text-[11px] font-normal text-[var(--ds-gray-900)]">
                  (${(market.yesProb / 100).toFixed(2)})
                </span>
              </span>
            </div>

            {/* NO Row */}
            <div className="relative overflow-hidden rounded-xl border border-[var(--brand-border-subtle)] bg-[var(--brand-card-bg)] p-3 flex items-center justify-between transition-all">
              <div
                className="absolute inset-y-0 left-0 bg-[var(--geist-foreground)]/5 transition-all duration-500"
                style={{ width: `${market.noProb}%` }}
              />
              <span className="relative z-10 font-semibold text-xs text-[var(--geist-foreground)]">
                No
              </span>
              <span className="relative z-10 font-mono text-sm font-bold text-[var(--geist-foreground)] tabular-nums">
                {market.noProb}%{" "}
                <span className="text-[11px] font-normal text-[var(--ds-gray-900)]">
                  (${(market.noProb / 100).toFixed(2)})
                </span>
              </span>
            </div>
          </div>

          {/* Mone Agent Signal Breakdown (Embedded directly below market) */}
          <div className="rounded-xl border border-[var(--brand-border-subtle)] bg-[var(--brand-glass)] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--geist-foreground)]">
                  Mone Agent Signal
                </span>
              </div>
              <Badge
                variant={market.side === "BUY YES" ? "success" : "warning"}
                className="text-xs font-bold px-2.5 py-0.5"
              >
                {market.side}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[var(--brand-border-subtle)] text-center tabular-nums">
              <div className="p-2">
                <span className="block text-[10px] text-[var(--ds-gray-900)] uppercase font-mono">
                  WeatherNext
                </span>
                <span className="font-outfit text-base font-bold text-[var(--geist-foreground)]">
                  {market.weatherNextProb}%
                </span>
              </div>

              <div className="p-2 border-x border-[var(--brand-border-subtle)]">
                <span className="block text-[10px] text-[var(--ds-gray-900)] uppercase font-mono">
                  Calculated Edge
                </span>
                <span className="font-outfit text-base font-bold text-emerald-500">
                  {market.edge}
                </span>
              </div>

              <div className="p-2">
                <span className="block text-[10px] text-[var(--ds-gray-900)] uppercase font-mono">
                  Confidence
                </span>
                <span className="text-xs font-semibold text-[var(--geist-foreground)] leading-tight block mt-1">
                  High
                </span>
              </div>
            </div>

            <div className="text-[11px] text-[var(--ds-gray-900)] flex items-center justify-between pt-1">
              <span>{market.ensembleAgreement}</span>
              <span className="text-[10px] font-mono">Settlement: NOAA 24h</span>
            </div>
          </div>
        </div>

        {/* Carousel Footer with Controls & Pagination */}
        <div className="px-6 py-3.5 border-t border-[var(--brand-border-subtle)] bg-[var(--brand-glass)] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {MARKETS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentIndex === idx
                    ? "w-6 bg-[var(--geist-foreground)]"
                    : "w-1.5 bg-[var(--ds-gray-400)] hover:bg-[var(--ds-gray-500)]"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--ds-gray-900)] font-mono tabular-nums mr-2">
              0{currentIndex + 1} / 0{MARKETS.length}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={prevSlide}
              className="size-8 rounded-full"
              aria-label="Previous market"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextSlide}
              className="size-8 rounded-full"
              aria-label="Next market"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
