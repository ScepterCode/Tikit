"""
Error tracking / observability wiring.

Sentry is entirely optional: with no SENTRY_DSN set, every function here is a
no-op and the app behaves exactly as before. Import and call `init_sentry()`
as early as possible - before the FastAPI app is constructed - so the ASGI
and logging integrations attach cleanly.
"""
from __future__ import annotations

import logging
import os
import re
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

# Header / body keys whose values must never leave this process.
_SENSITIVE_KEY_RE = re.compile(
    r"(authorization|cookie|x-csrf-token|apikey|api[-_]?key|token|secret|password|pin|"
    r"encryption[-_]?key|verif-hash|service[-_]?key|anon[-_]?key)",
    re.IGNORECASE,
)

_REDACTED = "[redacted]"


def _scrub(value: Any, depth: int = 0) -> Any:
    """Recursively redact sensitive-looking keys in an event payload."""
    if depth > 8:
        return value
    if isinstance(value, dict):
        return {
            k: (_REDACTED if _SENSITIVE_KEY_RE.search(str(k)) else _scrub(v, depth + 1))
            for k, v in value.items()
        }
    if isinstance(value, list):
        return [_scrub(v, depth + 1) for v in value]
    return value


def _before_send(event: Dict[str, Any], _hint: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Strip credentials from outgoing Sentry events."""
    try:
        request = event.get("request")
        if isinstance(request, dict):
            for key in ("headers", "cookies", "data", "env"):
                if key in request:
                    request[key] = _scrub(request[key])
            # Query strings can carry tokens; drop them entirely.
            request.pop("query_string", None)

        for exc in (event.get("exception") or {}).get("values") or []:
            for frame in (exc.get("stacktrace") or {}).get("frames") or []:
                if "vars" in frame:
                    frame["vars"] = _scrub(frame["vars"])

        if "extra" in event:
            event["extra"] = _scrub(event["extra"])
    except Exception:  # never let scrubbing break error reporting
        logger.exception("Sentry before_send scrubbing failed; dropping event")
        return None
    return event


def init_sentry() -> bool:
    """Initialise Sentry if SENTRY_DSN is configured.

    Returns True when Sentry was initialised, False otherwise.
    """
    dsn = os.getenv("SENTRY_DSN", "").strip()
    if not dsn:
        logger.info("SENTRY_DSN not set - error tracking disabled")
        return False

    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.logging import LoggingIntegration
        from sentry_sdk.integrations.starlette import StarletteIntegration
    except ImportError:
        logger.warning("SENTRY_DSN is set but sentry-sdk is not installed - error tracking disabled")
        return False

    environment = os.getenv("ENVIRONMENT", "production").lower()

    try:
        traces_sample_rate = float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.1"))
    except ValueError:
        traces_sample_rate = 0.1

    sentry_sdk.init(
        dsn=dsn,
        environment=environment,
        release=os.getenv("SENTRY_RELEASE") or os.getenv("RENDER_GIT_COMMIT") or None,
        integrations=[
            StarletteIntegration(),
            FastApiIntegration(),
            LoggingIntegration(level=logging.INFO, event_level=logging.ERROR),
        ],
        traces_sample_rate=traces_sample_rate,
        # Never ship user PII or request bodies by default.
        send_default_pii=False,
        max_request_body_size="never",
        before_send=_before_send,
    )
    logger.info(f"✅ Sentry initialised (environment={environment}, traces={traces_sample_rate})")
    return True


def capture_exception(exc: BaseException) -> None:
    """Report an exception to Sentry. Safe no-op when Sentry is not configured."""
    try:
        import sentry_sdk
    except ImportError:
        return
    try:
        sentry_sdk.capture_exception(exc)
    except Exception:
        logger.debug("Failed to report exception to Sentry", exc_info=True)
