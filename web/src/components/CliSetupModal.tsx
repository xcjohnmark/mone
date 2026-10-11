"use client";

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Terminal, X, Copy, CheckCircle2, ShieldCheck, Cpu } from "lucide-react";

export function CliSetupModal() {
  const { isCliModalOpen, setIsCliModalOpen, user } = useAuth();
  const [platform, setPlatform] = useState<"unix" | "windows">("unix");
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isCliModalOpen) return null;

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const unixCommands = `# 1. Install mone agent package via pip
pip install mone-agent

# 2. Configure Bring-Your-Own-Key (BYOK) credentials
mone configure

# 3. Verify weather ensemble connectivity and Neatlogs SDK
mone doctor

# 4. Start agent in Copilot mode (1-click manual approval)
mone run --mode copilot

# 5. (Optional) Run companion API server for web dashboard
mone serve --port 8000`;

  const windowsCommands = `# 1. Install mone agent package in PowerShell
pip install mone-agent

# 2. Configure Bring-Your-Own-Key (BYOK) credentials
mone configure

# 3. Verify weather ensemble connectivity and Neatlogs SDK
mone doctor

# 4. Start agent in Autonomous mode
mone run --mode autonomous

# 5. (Optional) Run companion API server
mone serve --port 8000`;

  const envTemplate = `# --- mone Agent BYOK Environment ---
WEATHER_PROVIDER=auto
DEFAULT_VENUE=paper
AGENT_AUTONOMY_MODE=copilot

# Neatlogs Project Tracing
NEATLOGS_API_KEY=CWkvQ30hGStyqjsjlxMo0LM-h9pQ9oAR
NEATLOGS_PROJECT_ID=4829ff21-c298-4d8c-9a4c-fed6a426623e

# Kalshi API Credentials (Demo or Live KXRAIN)
KALSHI_API_KEY_ID=
KALSHI_PRIVATE_KEY_PATH=

# CLI Auth Token
MONE_API_TOKEN=${user?.cliApiToken || "mone_sec_your_token_here"}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0e0e12] border border-zinc-800 rounded-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
        <button
          onClick={() => setIsCliModalOpen(false)}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-400">
            <Terminal className="w-3.5 h-3.5" />
            Local CLI Installation & Setup
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Run mone locally or on your cloud VPS
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            The standalone Python agent runs non-custodially on your own machine. All API keys remain encrypted locally in your `.env`.
          </p>
        </div>

        {/* Platform Toggle */}
        <div className="flex gap-2 border-b border-zinc-800 pb-3">
          <button
            onClick={() => setPlatform("unix")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              platform === "unix"
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            macOS / Linux (bash/zsh)
          </button>
          <button
            onClick={() => setPlatform("windows")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              platform === "windows"
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Windows (PowerShell)
          </button>
        </div>

        {/* Terminal Commands Block */}
        <div className="relative rounded-xl bg-black/90 p-4 font-mono text-xs text-zinc-300 border border-zinc-800">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800/80 text-[11px] text-zinc-500">
            <span>Terminal Commands</span>
            <button
              onClick={() => copyToClipboard(platform === "unix" ? unixCommands : windowsCommands, "commands")}
              className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition"
            >
              {copiedSection === "commands" ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy all</span>
                </>
              )}
            </button>
          </div>
          <pre className="overflow-x-auto whitespace-pre leading-relaxed">
            {platform === "unix" ? unixCommands : windowsCommands}
          </pre>
        </div>

        {/* Environment File Template */}
        <div className="relative rounded-xl bg-black/90 p-4 font-mono text-xs text-zinc-300 border border-zinc-800">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800/80 text-[11px] text-zinc-500">
            <span>Configuration File (.env template)</span>
            <button
              onClick={() => copyToClipboard(envTemplate, "env")}
              className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition"
            >
              {copiedSection === "env" ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy .env</span>
                </>
              )}
            </button>
          </div>
          <pre className="overflow-x-auto whitespace-pre leading-relaxed text-zinc-400">
            {envTemplate}
          </pre>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Python 3.10+ required. Verified on Linux x86/ARM64, macOS Apple Silicon, and Windows.</span>
          </div>
          <button
            onClick={() => setIsCliModalOpen(false)}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
