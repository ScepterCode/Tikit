"""Payment-verification tests for the membership router.

Guarantee under test: a paid tier is never activated without a payment that
Flutterwave confirms as successful. Previously `/process-payment` trusted the
client-supplied reference and `/upgrade` accepted no reference at all.
"""
import pytest

from routers import membership


def test_missing_reference_is_rejected():
    with pytest.raises(membership.HTTPException) as exc:
        membership._verify_membership_payment(None, "special")
    assert exc.value.status_code == 402


def test_empty_reference_is_rejected():
    with pytest.raises(membership.HTTPException) as exc:
        membership._verify_membership_payment("", "special")
    assert exc.value.status_code == 402


def test_unconfigured_gateway_is_503(monkeypatch):
    monkeypatch.setattr(membership.flutterwave_service, "secret_key", None, raising=False)
    with pytest.raises(membership.HTTPException) as exc:
        membership._verify_membership_payment("tx-123", "special")
    assert exc.value.status_code == 503


def test_unsuccessful_payment_is_rejected(monkeypatch):
    monkeypatch.setattr(membership.flutterwave_service, "secret_key", "FLWSECK_TEST-x", raising=False)
    monkeypatch.setattr(
        membership.flutterwave_service, "verify_payment",
        lambda _ref: {"success": True, "status": "failed"},
    )
    monkeypatch.setattr(
        membership.flutterwave_service, "verify_transaction_by_reference",
        lambda _ref: {"success": False},
    )
    with pytest.raises(membership.HTTPException) as exc:
        membership._verify_membership_payment("tx-123", "special")
    assert exc.value.status_code == 402


def test_non_ngn_currency_is_rejected(monkeypatch):
    monkeypatch.setattr(membership.flutterwave_service, "secret_key", "FLWSECK_TEST-x", raising=False)
    monkeypatch.setattr(
        membership.flutterwave_service, "verify_payment",
        lambda _ref: {"success": True, "status": "successful", "currency": "USD", "amount": 10},
    )
    with pytest.raises(membership.HTTPException) as exc:
        membership._verify_membership_payment("tx-123", "special")
    assert exc.value.status_code == 400


def test_successful_payment_is_accepted(monkeypatch):
    monkeypatch.setattr(membership.flutterwave_service, "secret_key", "FLWSECK_TEST-x", raising=False)
    monkeypatch.setattr(
        membership.flutterwave_service, "verify_payment",
        lambda _ref: {"success": True, "status": "successful", "currency": "NGN", "amount": 15000},
    )
    result = membership._verify_membership_payment("tx-123", "special")
    assert result["status"] == "successful"
    assert result["amount"] == 15000


def test_falls_back_to_reference_lookup(monkeypatch):
    """A tx_ref (not a numeric transaction id) still verifies."""
    monkeypatch.setattr(membership.flutterwave_service, "secret_key", "FLWSECK_TEST-x", raising=False)
    monkeypatch.setattr(
        membership.flutterwave_service, "verify_payment",
        lambda _ref: {"success": False, "error": "not found"},
    )
    monkeypatch.setattr(
        membership.flutterwave_service, "verify_transaction_by_reference",
        lambda _ref: {"success": True, "status": "successful", "currency": "NGN", "amount": 15000},
    )
    result = membership._verify_membership_payment("MEMB_abc123", "legend")
    assert result["status"] == "successful"
