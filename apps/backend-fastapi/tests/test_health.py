"""Tests for /health - the endpoint Render uses as its healthCheckPath.

Guarantee under test: the check actually exercises Supabase and reports 503
when the database is unreachable, so a broken deploy is not marked healthy.
"""
import json

import pytest

import main


class _FailingTable:
    def select(self, *_a, **_k):
        return self

    def limit(self, *_a, **_k):
        return self

    def execute(self):
        raise RuntimeError("connection refused")


class _OkTable(_FailingTable):
    def execute(self):
        return type("Result", (), {"data": []})()


def _client(table):
    return type("Client", (), {"table": staticmethod(lambda _name: table)})()


@pytest.mark.asyncio
async def test_health_ok_when_supabase_reachable(monkeypatch):
    monkeypatch.setattr(main, "get_supabase_client", lambda: _client(_OkTable()))
    response = await main.health_check()
    body = json.loads(response.body)

    assert response.status_code == 200
    assert body["status"] == "ok"
    assert body["services"]["supabase"] == "connected"


@pytest.mark.asyncio
async def test_health_is_503_when_supabase_unreachable(monkeypatch):
    monkeypatch.setattr(main, "get_supabase_client", lambda: _client(_FailingTable()))
    response = await main.health_check()
    body = json.loads(response.body)

    assert response.status_code == 503, "a deploy with no database must not report healthy"
    assert body["status"] == "degraded"
    assert "error" in body["services"]["supabase"]


@pytest.mark.asyncio
async def test_health_tolerates_missing_redis(monkeypatch):
    """Redis is optional - its absence must not degrade the service."""
    monkeypatch.setattr(main, "get_supabase_client", lambda: _client(_OkTable()))
    response = await main.health_check()
    body = json.loads(response.body)

    assert response.status_code == 200
    assert body["services"]["redis"] in ("not_configured", "connected") or body[
        "services"
    ]["redis"].startswith("error")
