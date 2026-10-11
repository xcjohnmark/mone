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


def init_telemetry(
    api_key: Optional[str] = None,
    workflow_name: str = "mone-trading-agent",
    endpoint: str = "https://ingest.neatlogs.com",
    tags: Optional[list[str]] = None,
) -> bool:
    """
    Initializes Neatlogs SDK if API key is provided and SDK is installed.
    Uses regional Neatlogs ingest endpoint: https://ingest.neatlogs.com
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
            endpoint=endpoint,
            workflow_name=workflow_name,
            tags=tags or ["neatHack", "weather-quant", "mone"],
        )
        _NEATLOGS_INITIALIZED = True
        logger.info(f"Neatlogs telemetry initialized successfully for workflow: {workflow_name} at {endpoint}")
        return True
    except Exception as e:
        logger.warning(f"Failed to initialize Neatlogs SDK: {e}. Falling back to local telemetry recorder.")
        _NEATLOGS_INITIALIZED = True
        return False


def flush_telemetry():
    """Flush all buffered Neatlogs spans before one-shot script completion."""
    try:
        import neatlogs
        if hasattr(neatlogs, "flush_all"):
            neatlogs.flush_all()
        elif hasattr(neatlogs, "flush"):
            neatlogs.flush()
    except Exception as e:
        logger.debug(f"Telemetry flush error: {e}")


def shutdown_telemetry():
    """Shut down Neatlogs telemetry on process exit."""
    try:
        import neatlogs
        if hasattr(neatlogs, "shutdown"):
            neatlogs.shutdown()
    except Exception as e:
        logger.debug(f"Telemetry shutdown error: {e}")


def span(
    kind: str = "AGENT",
    name: Optional[str] = None,
    *,
    role: Optional[str] = None,
    goal: Optional[str] = None,
    tool_name: Optional[str] = None,
    description: Optional[str] = None,
):
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
                "kind": kind.upper(),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "status": "RUNNING",
            }
            if tool_name:
                span_record["tool_name"] = tool_name
            if description:
                span_record["description"] = description
            _RECORDED_SPANS.append(span_record)
            try:
                result = func(*args, **kwargs)
                span_record["status"] = "SUCCESS"
                return result
            except Exception as exc:
                span_record["status"] = "ERROR"
                span_record["error"] = str(exc)
                raise

        # Wrap with native neatlogs.span if SDK is installed
        try:
            import neatlogs
            if hasattr(neatlogs, "span"):
                span_kwargs: Dict[str, Any] = {
                    "kind": kind.upper(),
                    "name": span_name,
                }
                if role:
                    span_kwargs["role"] = role
                if goal:
                    span_kwargs["goal"] = goal
                if tool_name:
                    span_kwargs["tool_name"] = tool_name
                if description:
                    span_kwargs["description"] = description
                return neatlogs.span(**span_kwargs)(wrapper)
        except Exception:
            pass

        return wrapper
    return decorator


def workflow_span(name: Optional[str] = None, description: Optional[str] = None):
    """Workflow-level span decorator."""
    return span(kind="WORKFLOW", name=name, description=description)


def agent_span(name: Optional[str] = None, role: Optional[str] = None, goal: Optional[str] = None):
    """Agent decision loop span decorator."""
    return span(kind="AGENT", name=name, role=role, goal=goal)


def tool_span(name: Optional[str] = None, tool_name: Optional[str] = None, description: Optional[str] = None):
    """External tool / API call span decorator."""
    return span(kind="TOOL", name=name, tool_name=tool_name or name, description=description)


def get_recorded_spans() -> list[Dict[str, Any]]:
    """Returns local recorded spans list for inspection and test assertions."""
    return list(_RECORDED_SPANS)


def clear_recorded_spans():
    """Clears recorded spans."""
    _RECORDED_SPANS.clear()

