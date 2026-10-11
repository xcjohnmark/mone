import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "mone — Autonomous Weather Prediction Market Agent",
  description: "Bridges Google WeatherNext ensemble forecasts with Kalshi & Polymarket under a non-custodial BYOK architecture.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0c] text-zinc-100 antialiased selection:bg-indigo-500/20 selection:text-indigo-300">
        {children}
      </body>
    </html>
  );
}
