"""Security tests for POST /api/payments/verify.

The core guarantee: tickets are only issued when Flutterwave confirms the
transaction as ``successful`` and the amount paid covers the ticket price.
"""
import asyncio
import types

import pytest

from routers import payments


class _Result:
    def __init__(self, data):
        self.data = data


class _FakeTable:
    def __init__(self, store, name):
        self._store = store
        self._name = name
        self._filters = {}

    def select(self, *_args, **_kwargs):
        return self

    def eq(self, field, value):
        self._filters[field] = value
        return self

    def execute(self):
        rows = self._store.get(self._name, [])
        for field, value in self._filters.items():
            rows = [r for r in rows if r.get(field) == value]
        return _Result(rows)


class _FakeSupabase:
    def __init__(self, store):
        self._store = store

    def table(self, name):
        return _FakeTable(self._store, name)


@pytest.fixture
def patched(monkeypatch):
    created_tickets = []
    credit_calls = []

    async def fake_create_ticket(data):
        ticket = {"id": f"tkt_{len(created_tickets)}", "ticket_code": f"CODE{len(created_tickets)}", **data}
        created_tickets.append(ticket)
        return ticket

    async def fake_get_event(_event_id):
        return {"id": _event_id, "title": "Test Event", "ticket_tiers": [{"name": "General", "price": 5000}]}

    async def fake_create_booking(**_kwargs):
        return {"id": "bk_1"}

    async def fake_update_booking_status(*_a, **_k):
        return True

    async def fake_notification(**_kwargs):
        return True

    async def fake_send_ticket_confirmation(**_kwargs):
        return True

    async def fake_credit(**kwargs):
        credit_calls.append(kwargs)
        return {"success": True, "amount_credited": 4750}

    monkeypatch.setattr(payments.ticket_service, "create_ticket", fake_create_ticket)
    monkeypatch.setattr(payments.event_service, "get_event", fake_get_event)
    monkeypatch.setattr(payments.booking_service, "create_booking", fake_create_booking)
    monkeypatch.setattr(payments.booking_service, "update_booking_status", fake_update_booking_status)
    monkeypatch.setattr(payments.notification_service, "create_notification", fake_notification)
    monkeypatch.setattr(payments.email_service, "send_ticket_confirmation", fake_send_ticket_confirmation)
    monkeypatch.setattr(payments.organizer_payment_service, "credit_organizer_for_ticket_sale", fake_credit)
    monkeypatch.setattr(payments, "get_supabase_client", lambda: _FakeSupabase({"tickets": []}))

    return types.SimpleNamespace(created_tickets=created_tickets, credit_calls=credit_calls, monkeypatch=monkeypatch)


def _call_verify(tx_ref="TKT_abc_123_evt1_1_General", transaction_id="99999"):
    req = payments.PaymentVerificationRequest(transaction_id=transaction_id, tx_ref=tx_ref)
    return asyncio.get_event_loop().run_until_complete(
        payments.verify_payment(req, current_user={"user_id": "buyer1", "email": "b@x.com"})
    )


def test_missing_secret_key_blocks_ticket_issue(patched):
    patched.monkeypatch.setattr(payments.flutterwave_service, "secret_key", None, raising=False)
    with pytest.raises(payments.HTTPException) as exc:
        _call_verify()
    assert exc.value.status_code == 503
    assert patched.created_tickets == []


def test_unsuccessful_payment_blocks_ticket_issue(patched):
    patched.monkeypatch.setattr(payments.flutterwave_service, "secret_key", "FLWSECK_TEST-x", raising=False)
    patched.monkeypatch.setattr(
        payments.flutterwave_service, "verify_payment",
        lambda _tid: {"success": True, "status": "failed", "amount": 0, "currency": "NGN"},
    )
    with pytest.raises(payments.HTTPException) as exc:
        _call_verify()
    assert exc.value.status_code == 402
    assert patched.created_tickets == []


def test_underpayment_blocks_ticket_issue(patched):
    patched.monkeypatch.setattr(payments.flutterwave_service, "secret_key", "FLWSECK_TEST-x", raising=False)
    patched.monkeypatch.setattr(
        payments.flutterwave_service, "verify_payment",
        lambda _tid: {"success": True, "status": "successful", "amount": 100,
                      "currency": "NGN", "tx_ref": "TKT_abc_123_evt1_1_General"},
    )
    with pytest.raises(payments.HTTPException) as exc:
        _call_verify()
    assert exc.value.status_code == 402
    assert patched.created_tickets == []


def test_successful_payment_issues_ticket_and_credits_organizer(patched):
    patched.monkeypatch.setattr(payments.flutterwave_service, "secret_key", "FLWSECK_TEST-x", raising=False)
    patched.monkeypatch.setattr(
        payments.flutterwave_service, "verify_payment",
        lambda _tid: {"success": True, "status": "successful", "amount": 5000,
                      "currency": "NGN", "tx_ref": "TKT_abc_123_evt1_1_General"},
    )
    result = _call_verify()
    assert result["success"] is True
    assert result["tickets_created"] == 1
    assert len(patched.created_tickets) == 1
    assert len(patched.credit_calls) == 1
    assert patched.credit_calls[0]["event_id"] == "evt1"


def test_tx_ref_mismatch_is_rejected(patched):
    patched.monkeypatch.setattr(payments.flutterwave_service, "secret_key", "FLWSECK_TEST-x", raising=False)
    patched.monkeypatch.setattr(
        payments.flutterwave_service, "verify_payment",
        lambda _tid: {"success": True, "status": "successful", "amount": 5000,
                      "currency": "NGN", "tx_ref": "SOMEONE_ELSES_REF"},
    )
    with pytest.raises(payments.HTTPException) as exc:
        _call_verify()
    assert exc.value.status_code == 400
    assert patched.created_tickets == []
