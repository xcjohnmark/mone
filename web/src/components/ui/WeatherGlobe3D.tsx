"use client";

import React, { useEffect, useRef } from "react";
import createGlobe from "cobe";
import { useTheme } from "../../context/ThemeContext";

export function WeatherGlobe3D({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    let phi = 0;
    let width = 0;
    let rafId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onResize = () => {
      if (canvas) {
        width = canvas.offsetWidth;
      }
    };
    window.addEventListener("resize", onResize);
    onResize();

    const isDark = resolvedTheme === "dark";

    const globe = createGlobe(canvas, {
      devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      width: width * 2 || 600,
      height: width * 2 || 600,
      phi: 0,
      theta: 0.25,
      dark: isDark ? 1 : 0,
      diffuse: 1.2,
      mapSamples: 12000,
      mapBrightness: isDark ? 6 : 4,
      baseColor: isDark ? [0.15, 0.15, 0.2] : [0.85, 0.85, 0.9],
      markerColor: [0, 0.44, 0.95], // Vercel blue #0070f3
      glowColor: isDark ? [0.1, 0.2, 0.4] : [0.9, 0.95, 1],
      markers: [
        // Weather prediction market locations:
        { location: [40.7128, -74.006], size: 0.08 }, // New York Central Park
        { location: [41.8781, -87.6298], size: 0.07 }, // Chicago O'Hare
        { location: [25.7617, -80.1918], size: 0.07 }, // Miami International
        { location: [34.0522, -118.2437], size: 0.06 }, // Los Angeles
        { location: [51.5074, -0.1278], size: 0.07 }, // London Heathrow
        { location: [35.6762, 139.6503], size: 0.07 }, // Tokyo Haneda
      ],
    });

    const animate = () => {
      phi += 0.005;
      globe.update({ phi });
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, [resolvedTheme]);

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          maxWidth: "500px",
          aspectRatio: "1",
        }}
        className="opacity-95 transition-opacity duration-500"
      />
    </div>
  );
}
