"""
mone.telemetry.tracer — Neatlogs Observability Integration & Span Decorators.
Instruments all workflow roots, agent decision loops, and external tool calls
with structured Neatlogs spans for the #neatHack AI Agent Hackathon.
"""

from datetime import datetime, timezone
import functools
import logging
from typing import Any, Callable, Dict, Optional

logger = logging.getLogger("mone.telemetry")

_NEATLOGS_INITIALIZED = False
_RECORDED_SPANS: list[Dict[str, Any]] = []


def init_telemetry(api_key: Optional[str] = None, workflow_name: str = "mone-trading-agent") -> bool:
    """
    Initializes Neatlogs SDK if API key is provided and SDK is installed.
    """
    global _NEATLOGS_INITIALIZED
    if _NEATLOGS_INITIALIZED:
        return True

    if not api_key:
        logger.info("Neatlogs API key not provided; operating in local telemetry recording mode.")
        _NEATLOGS_INITIALIZED = True
        return False

    try:
        import neatlogs
        neatlogs.init(
            api_key=api_key,
            workflow_name=workflow_name,
        )
        _NEATLOGS_INITIALIZED = True
        logger.info(f"Neatlogs telemetry initialized successfully for workflow: {workflow_name}")
        return True
    except Exception as e:
        logger.warning(f"Failed to initialize Neatlogs SDK: {e}. Falling back to local telemetry recorder.")
        _NEATLOGS_INITIALIZED = True
        return False


def span(kind: str = "agent", name: Optional[str] = None):
    """
    Decorator to trace function executions.
    Records timing and span metadata locally into audit log,
    and forwards to neatlogs.span when active.
    """
    def decorator(func: Callable) -> Callable:
        span_name = name or func.__name__

        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            span_record = {
                "name": span_name,
                "kind": kind,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "status": "RUNNING",
            }
            _RECORDED_SPANS.append(span_record)
            try:
                result = func(*args, **kwargs)
                span_record["status"] = "SUCCESS"
                return result
            except Exception as exc:
                span_record["status"] = "ERROR"
                span_record["error"] = str(exc)
                raise

        # Wrap with neatlogs.span if SDK is installed
        try:
            import neatlogs
            if hasattr(neatlogs, "span"):
                return neatlogs.span(kind=kind.upper())(wrapper)
        except Exception:
            pass

        return wrapper
    return decorator


def workflow_span(name: Optional[str] = None):
    """Workflow-level span decorator."""
    return span(kind="WORKFLOW", name=name)


def agent_span(name: Optional[str] = None):
    """Agent decision loop span decorator."""
    return span(kind="AGENT", name=name)


def tool_span(name: Optional[str] = None):
    """External tool / API call span decorator."""
    return span(kind="TOOL", name=name)


def get_recorded_spans() -> list[Dict[str, Any]]:
    """Returns local recorded spans list for inspection and test assertions."""
    return list(_RECORDED_SPANS)


def clear_recorded_spans():
    """Clears recorded spans."""
    _RECORDED_SPANS.clear()
