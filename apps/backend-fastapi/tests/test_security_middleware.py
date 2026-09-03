"""Tests for the security middleware.

It was written but never mounted (`# app.add_middleware(SecurityMiddleware)`),
so responses carried no security headers and there was no request size limit.
CSRF enforcement inside it stays opt-in: this API authenticates with
`Authorization: Bearer` and sets no cookies, so a cross-site request carries no
ambient authority to abuse - and no client call site sends the CSRF headers.
"""
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

import main
from middleware.security import SecurityMiddleware


def _client(**env):
    app = FastAPI()
    app.add_middleware(SecurityMiddleware)

    @app.get("/thing")
    async def read():
        return {"ok": True}

    @app.post("/thing")
    async def write():
        return {"ok": True}

    return TestClient(app)


def test_security_headers_are_present():
    response = _client().get("/thing")
    headers = response.headers

    assert headers["x-content-type-options"] == "nosniff"
    assert headers["x-frame-options"] == "DENY"
    assert "max-age=" in headers["strict-transport-security"]
    assert "default-src" in headers["content-security-policy"]
    assert headers["referrer-policy"] == "strict-origin-when-cross-origin"


def test_state_changing_requests_are_not_blocked_by_default():
    """CSRF is off by default - otherwise every authenticatedFetch call 403s."""
    assert _client().post("/thing").status_code == 200


def test_csrf_can_be_enabled_and_then_enforces(monkeypatch):
    monkeypatch.setenv("ENABLE_CSRF", "true")
    response = _client().post("/thing")
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "CSRF_TOKEN_MISSING"


def test_csrf_rejection_is_a_clean_403_not_a_500(monkeypatch):
    """Raising HTTPException inside BaseHTTPMiddleware bypasses FastAPI's
    handlers and surfaces as a 500; the middleware returns a response."""
    monkeypatch.setenv("ENABLE_CSRF", "true")
    response = _client().post("/thing")
    assert response.status_code == 403
    assert response.json()["success"] is False


def test_oversized_payload_is_rejected_with_413():
    client = _client()
    response = client.post(
        "/thing",
        content=b"x",
        headers={"content-length": str(11 * 1024 * 1024)},
    )
    assert response.status_code == 413
    assert response.json()["error"]["code"] == "PAYLOAD_TOO_LARGE"


# --- wiring -----------------------------------------------------------------

def _mounted(cls):
    return any(m.cls is cls for m in main.app.user_middleware)


def test_security_middleware_is_mounted_on_the_app():
    assert _mounted(SecurityMiddleware)


def test_rate_limit_middleware_is_mounted_on_the_app():
    from middleware.rate_limiter import RateLimitMiddleware
    assert _mounted(RateLimitMiddleware)


def test_cors_origins_contain_no_blank_entry():
    """FRONTEND_URL being unset used to inject "" into allow_origins."""
    assert "" not in main._cors_origins
