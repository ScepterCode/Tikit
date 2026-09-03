"""Critical-path tests: OTP issue -> verify.

OTP is the second factor on wallet transactions, so the guarantees are:
  * the code is never returned to the caller,
  * a correct code works exactly once (no replay),
  * wrong codes burn attempts and the code self-destructs at the limit,
  * expired codes are refused,
  * the router calls the service with a signature it actually has.
"""
import inspect
import time

import pytest

from routers import wallet
from services.wallet_security_service import wallet_security_service as security

USER = "user-otp-1"


@pytest.fixture(autouse=True)
def clean_state(monkeypatch):
    # Keep delivery offline - otherwise generate_otp reaches for Supabase and
    # the email service and the tests wait on network timeouts.
    from services import email_service as email_mod

    sent = []

    async def fake_send_otp_email(**kwargs):
        sent.append(kwargs)
        return {"success": True}

    monkeypatch.setattr(email_mod.email_service, "send_otp_email", fake_send_otp_email)

    security.otp_codes.pop(USER, None)
    security.failed_attempts.pop(USER, None)
    yield sent
    security.otp_codes.pop(USER, None)
    security.failed_attempts.pop(USER, None)


async def _issue(purpose="withdrawal"):
    return await security.generate_otp(USER, purpose, user_email="otp@example.com")


@pytest.mark.asyncio
async def test_generate_otp_stores_a_code_but_never_returns_it(clean_state):
    result = await _issue()

    assert result["success"] is True
    assert result["expires_in"] == security.OTP_EXPIRY
    # The code must never travel back to the client.
    assert "code" not in result
    assert "otp" not in result
    assert "otp_code" not in result
    assert security.otp_codes[USER]["code"].isdigit()
    assert len(security.otp_codes[USER]["code"]) == 6

    # It reaches the user by email instead.
    assert len(clean_state) == 1
    assert clean_state[0]["otp_code"] == security.otp_codes[USER]["code"]
    assert result["email_sent"] is True


@pytest.mark.asyncio
async def test_correct_otp_verifies_once_then_cannot_be_replayed():
    await _issue()
    code = security.otp_codes[USER]["code"]

    first = security.verify_otp(USER, code)
    assert first["success"] is True

    replay = security.verify_otp(USER, code)
    assert replay["success"] is False, "an OTP must not be reusable"


@pytest.mark.asyncio
async def test_wrong_otp_burns_attempts_then_destroys_the_code():
    await _issue()
    code = security.otp_codes[USER]["code"]
    wrong = "000000" if code != "000000" else "111111"

    for expected_remaining in (2, 1, 0):
        result = security.verify_otp(USER, wrong)
        assert result["success"] is False
        assert result["attempts_remaining"] == expected_remaining

    # Next attempt - even with the *correct* code - finds nothing left.
    assert security.verify_otp(USER, code)["success"] is False
    assert USER not in security.otp_codes


@pytest.mark.asyncio
async def test_expired_otp_is_refused():
    await _issue()
    code = security.otp_codes[USER]["code"]
    security.otp_codes[USER]["expires_at"] = time.time() - 1

    result = security.verify_otp(USER, code)
    assert result["success"] is False
    assert "expired" in result["error"].lower()
    assert USER not in security.otp_codes


def test_verify_otp_without_an_issued_code_is_refused():
    assert security.verify_otp(USER, "123456")["success"] is False


def test_router_calls_generate_otp_with_a_signature_it_has():
    """Regression: the router passed a third `user_email` argument that
    generate_otp never accepted, so /security/generate-otp always 500'd."""
    sig = inspect.signature(security.generate_otp)
    source = inspect.getsource(wallet.generate_otp)

    assert "await wallet_security_service.generate_otp(" in source

    # Count the positional args the router passes.
    call = source.split("wallet_security_service.generate_otp(", 1)[1]
    call = call.split(")", 1)[0]
    passed = [a for a in call.split(",") if a.strip()]
    assert len(passed) <= len(sig.parameters), (
        f"router passes {len(passed)} args to generate_otp{sig}"
    )
