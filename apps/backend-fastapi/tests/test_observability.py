"""Tests for Sentry wiring.

Guarantees under test:
  * With no SENTRY_DSN, init is a no-op (nothing is sent anywhere).
  * Credentials never leave the process in an event payload.
"""
import observability


def test_init_is_noop_without_dsn(monkeypatch):
    monkeypatch.delenv("SENTRY_DSN", raising=False)
    assert observability.init_sentry() is False


def test_capture_exception_is_safe_without_sentry():
    # Must not raise even when Sentry was never initialised.
    observability.capture_exception(RuntimeError("boom"))


def test_before_send_redacts_credentials():
    event = {
        "request": {
            "headers": {
                "Authorization": "Bearer super-secret",
                "x-csrf-token": "csrf-value",
                "apikey": "anon-key",
                "Accept": "application/json",
            },
            "cookies": {"session_id": "abc"},
            "query_string": "token=leaked",
            "data": {"password": "hunter2", "transaction_pin": "1234", "amount": 5000},
        },
        "extra": {"FLUTTERWAVE_SECRET_KEY": "FLWSECK-live", "event_id": "evt-1"},
    }

    out = observability._before_send(event, {})

    headers = out["request"]["headers"]
    assert headers["Authorization"] == "[redacted]"
    assert headers["x-csrf-token"] == "[redacted]"
    assert headers["apikey"] == "[redacted]"
    # Non-sensitive values survive so the report stays useful.
    assert headers["Accept"] == "application/json"

    assert out["request"]["data"]["password"] == "[redacted]"
    assert out["request"]["data"]["transaction_pin"] == "[redacted]"
    assert out["request"]["data"]["amount"] == 5000

    assert out["extra"]["FLUTTERWAVE_SECRET_KEY"] == "[redacted]"
    assert out["extra"]["event_id"] == "evt-1"

    # Query strings can carry tokens - dropped entirely.
    assert "query_string" not in out["request"]


def test_before_send_redacts_stackframe_locals():
    event = {
        "exception": {
            "values": [
                {
                    "stacktrace": {
                        "frames": [
                            {"vars": {"jwt_token": "eyJ...", "user_id": "u-1"}},
                        ]
                    }
                }
            ]
        }
    }
    out = observability._before_send(event, {})
    frame_vars = out["exception"]["values"][0]["stacktrace"]["frames"][0]["vars"]
    assert frame_vars["jwt_token"] == "[redacted]"
    assert frame_vars["user_id"] == "u-1"


def test_before_send_handles_nested_structures():
    event = {"extra": {"payload": [{"secret": "x", "keep": 1}]}}
    out = observability._before_send(event, {})
    assert out["extra"]["payload"][0]["secret"] == "[redacted]"
    assert out["extra"]["payload"][0]["keep"] == 1
