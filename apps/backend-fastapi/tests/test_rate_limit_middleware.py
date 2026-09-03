"""Tests for the IP-based rate limiter on abuse-prone endpoints.

Rate limiting was declared in main.py but the middleware class did not exist,
so the import was commented out and login/registration/OTP had no throttle at
all. These tests pin the behaviour of the replacement.
"""
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from middleware.rate_limiter import RateLimitMiddleware


def _client(rules=None, **kwargs):
    app = FastAPI()
    app.add_middleware(RateLimitMiddleware, rules=rules, **kwargs)

    @app.post("/api/auth/login")
    async def login():
        return {"ok": True}

    @app.get("/api/events")
    async def events():
        return {"ok": True}

    return TestClient(app)


def test_requests_under_the_limit_pass_through():
    client = _client(rules={"/api/auth/login": (3, 60)})
    for _ in range(3):
        assert client.post("/api/auth/login").status_code == 200


def test_requests_over_the_limit_get_429_with_retry_after():
    client = _client(rules={"/api/auth/login": (2, 60)})
    assert client.post("/api/auth/login").status_code == 200
    assert client.post("/api/auth/login").status_code == 200

    blocked = client.post("/api/auth/login")
    assert blocked.status_code == 429
    assert blocked.json()["error"]["code"] == "RATE_LIMIT_EXCEEDED"
    assert int(blocked.headers["retry-after"]) >= 1


def test_unlisted_paths_are_not_limited():
    client = _client(rules={"/api/auth/login": (1, 60)})
    for _ in range(10):
        assert client.get("/api/events").status_code == 200


def test_separate_clients_have_separate_budgets():
    client = _client(rules={"/api/auth/login": (1, 60)})

    assert client.post("/api/auth/login", headers={"x-forwarded-for": "1.1.1.1"}).status_code == 200
    assert client.post("/api/auth/login", headers={"x-forwarded-for": "1.1.1.1"}).status_code == 429

    # A different source address still has its full budget.
    assert client.post("/api/auth/login", headers={"x-forwarded-for": "2.2.2.2"}).status_code == 200


def test_forwarded_for_uses_the_original_client():
    client = _client(rules={"/api/auth/login": (1, 60)})
    headers = {"x-forwarded-for": "9.9.9.9, 10.0.0.1, 10.0.0.2"}

    assert client.post("/api/auth/login", headers=headers).status_code == 200
    assert client.post("/api/auth/login", headers=headers).status_code == 429


def test_preflight_requests_are_never_limited():
    client = _client(rules={"/api/auth/login": (1, 60)})
    for _ in range(5):
        assert client.options("/api/auth/login").status_code != 429


def test_disabling_via_env_turns_the_limiter_off(monkeypatch):
    monkeypatch.setenv("RATE_LIMIT_ENABLED", "false")
    client = _client(rules={"/api/auth/login": (1, 60)})
    for _ in range(5):
        assert client.post("/api/auth/login").status_code == 200


def test_default_rules_cover_the_sensitive_endpoints():
    covered = RateLimitMiddleware.DEFAULT_RULES
    for path in (
        "/api/auth/login",
        "/api/auth/register",
        "/api/wallet/security/generate-otp",
        "/api/wallet/security/verify-otp",
    ):
        assert path in covered, f"{path} should be rate limited by default"
