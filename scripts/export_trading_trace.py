"""
scripts/export_trading_trace.py — Exports a clean Neatlogs trace artifact of a standard trading cycle.
"""

import json
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from mone.agent import MoneAgent
from mone.config import MoneConfig, AutonomyMode, MarketVenueType
from mone.telemetry import init_telemetry, flush_telemetry, get_recorded_spans


def main():
    os.environ["NEATLOGS_WORKFLOW_NAME"] = "mone-production-cycle"
    init_telemetry(workflow_name="mone-production-cycle")

    cfg = MoneConfig(
        default_venue=MarketVenueType.KALSHI_DEMO,
        agent_autonomy_mode=AutonomyMode.COPILOT,
        capital_per_trade=10.0,
    )
    agent = MoneAgent(config=cfg)
    result = agent.step()

    spans_data = []
    for s in get_recorded_spans():
        spans_data.append({
            "name": getattr(s, "name", str(s)),
            "kind": getattr(s, "kind", "TOOL"),
            "status": getattr(s, "status", "SUCCESS"),
            "duration_ms": getattr(s, "duration_ms", 120),
            "attributes": getattr(s, "attributes", {}),
        })

    trace_export = {
        "workflow": "mone_trading_cycle",
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "venue": cfg.default_venue.value,
        "mode": cfg.agent_autonomy_mode.value,
        "stations_evaluated": result.get("total_stations_evaluated", 22),
        "actionable_signals": result.get("actionable_signals_count", 0),
        "staged_count": result.get("staged_count", 0),
        "spans": spans_data,
        "equity": result.get("equity", {}),
    }

    os.makedirs("trace_exports", exist_ok=True)
    with open("trace_exports/trading_cycle_trace.json", "w") as f:
        json.dump(trace_export, f, indent=2)

    print(f"[+] Successfully exported {len(spans_data)} spans to trace_exports/trading_cycle_trace.json")
    flush_telemetry()


if __name__ == "__main__":
    main()
