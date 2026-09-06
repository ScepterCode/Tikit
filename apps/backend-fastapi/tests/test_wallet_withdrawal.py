"""Critical-path tests: wallet deposit -> withdrawal.

Withdrawals move real money, so the guarantees are:
  * you cannot withdraw more than your balance,
  * the transaction PIN is a genuine second factor - a user who never set one
    must not be able to withdraw,
  * a wrong PIN is refused and counted towards lockout,
  * a merely *pending* withdrawal does not deduct the balance,
  * amounts over the OTP threshold stop and demand an OTP instead of paying out.
"""
import pytest

from routers import wallet
from services.withdrawal_service import WithdrawalMethod
from services.wallet_security_service import wallet_security_service as security

USER = "user-wd-1"
EMAIL = "wd@example.com"
BALANCE = 50_000.0


class _Table:
    """Minimal Supabase table double: users.wallet_balance + payments.insert."""

    def __init__(self, store):
        self._store = store
        self._name = None

    def __call__(self, name):
        self._name = name
        return self

    def select(self, *_a, **_k):
        return self

    def eq(self, *_a, **_k):
        return self

    def execute(self):
        return type("R", (), {"data": [{"wallet_balance": self._store["balance"]}]})()

    def insert(self, record):
        self._store["inserted"].append(record)
        return type("Q", (), {"execute": staticmethod(lambda: type("R", (), {"data": [record]})())})()


class _Supabase:
    def __init__(self, store):
        self._table = _Table(store)

    def table(self, name):
        return self._table(name)


@pytest.fixture
def env(monkeypatch):
    store = {"balance": BALANCE, "inserted": [], "withdrawals": [], "otp_emails": 0}

    async def fake_user(_request):
        return {"user_id": USER, "email": EMAIL, "tier": "basic"}

    monkeypatch.setattr(wallet, "get_user_from_request", fake_user)
    monkeypatch.setattr(
        wallet.rate_limiter, "check_rate_limit", lambda *_a, **_k: (True, "")
    )

    import database
    monkeypatch.setattr(
        database.supabase_client, "get_service_client", lambda: _Supabase(store)
    )

    def fake_initiate(user_id, data):
        store["withdrawals"].append((user_id, data))
        return {
            "success": True,
            "withdrawal": {"reference": "WD-REF-1", "status": "pending"},
            "next_steps": [],
        }

    monkeypatch.setattr(wallet.withdrawal_service, "initiate_withdrawal", fake_initiate)

    # Keep OTP issuance offline - otherwise generate_otp reaches for Supabase
    # and the email service and the test waits on a network timeout.
    from services import email_service as email_mod

    async def fake_send_otp_email(**_kwargs):
        store["otp_emails"] += 1
        return {"success": True}

    monkeypatch.setattr(email_mod.email_service, "send_otp_email", fake_send_otp_email)

    # PINs are persisted to public.user_security; stand in for that table so
    # the tests exercise the real read/write path rather than a bare dict.
    security_rows = {}

    class _SecurityTable:
        def __init__(self): self._uid = None
        def select(self, *_a, **_k): return self
        def eq(self, _field, value): self._uid = value; return self
        def execute(self):
            row = security_rows.get(self._uid)
            return type("R", (), {"data": [row] if row else []})()
        def upsert(self, record, **_k):
            security_rows[record["user_id"]] = record
            return type("Q", (), {"execute": staticmethod(lambda: type("R", (), {"data": [record]})())})()

    monkeypatch.setattr(
        security, "_db",
        staticmethod(lambda: type("S", (), {"table": staticmethod(lambda _n: _SecurityTable())})()),
    )

    security.transaction_pins.pop(USER, None)
    security.failed_attempts.pop(USER, None)
    security.otp_codes.pop(USER, None)
    yield store
    security.transaction_pins.pop(USER, None)
    security.failed_attempts.pop(USER, None)
    security.otp_codes.pop(USER, None)


def _request(amount, pin):
    return wallet.WithdrawalRequest(
        amount=amount,
        method=WithdrawalMethod.BANK_TRANSFER,
        destination={"account_number": "0123456789", "bank_code": "058"},
        pin=pin,
    )


@pytest.mark.asyncio
async def test_withdrawal_above_balance_is_refused(env):
    with pytest.raises(wallet.HTTPException) as exc:
        await wallet.initiate_withdrawal(None, _request(BALANCE + 1, "1234"))

    assert exc.value.status_code == 400
    assert "insufficient" in str(exc.value.detail).lower()
    assert env["withdrawals"] == [], "no withdrawal may be created"


@pytest.mark.asyncio
async def test_user_without_a_pin_cannot_withdraw(env):
    """Regression: the endpoint used to auto-create PIN "000000" for anyone
    who had not set one, so the second factor could simply be guessed."""
    assert USER not in security.transaction_pins

    with pytest.raises(wallet.HTTPException) as exc:
        await wallet.initiate_withdrawal(None, _request(5_000, "000000"))

    assert exc.value.status_code in (401, 403)
    assert env["withdrawals"] == [], "no withdrawal without a real PIN"


@pytest.mark.asyncio
async def test_wrong_pin_is_refused_and_counted(env):
    security.set_transaction_pin(USER, "4321")

    with pytest.raises(wallet.HTTPException) as exc:
        await wallet.initiate_withdrawal(None, _request(5_000, "1111"))

    assert exc.value.status_code == 401
    assert env["withdrawals"] == []
    assert security.failed_attempts.get(USER, {}).get("count", 0) >= 1


@pytest.mark.asyncio
async def test_correct_pin_creates_a_pending_withdrawal_without_deducting(env):
    security.set_transaction_pin(USER, "4321")

    result = await wallet.initiate_withdrawal(None, _request(5_000, "4321"))

    assert result["success"] is True
    assert result["withdrawal"]["status"] == "pending"
    assert len(env["withdrawals"]) == 1

    # Balance is untouched until the payout is confirmed.
    assert result["current_balance"] == BALANCE
    assert env["balance"] == BALANCE

    # The ledger row is recorded as pending, for the negative amount.
    assert len(env["inserted"]) == 1
    row = env["inserted"][0]
    assert row["status"] == "pending"
    assert row["amount"] == -5_000
    assert row["payment_type"] == "withdrawal"


@pytest.mark.asyncio
async def test_large_withdrawal_requires_otp_instead_of_paying_out(env):
    """Amounts over the OTP threshold must stop and demand a second factor."""
    security.set_transaction_pin(USER, "4321")

    result = await wallet.initiate_withdrawal(None, _request(20_000, "4321"))

    assert result["success"] is False
    assert result["requires_otp"] is True
    assert result["otp_expires_in"] == security.OTP_EXPIRY
    assert env["withdrawals"] == [], "must not pay out before OTP verification"
    assert USER in security.otp_codes, "an OTP should have been issued"
    assert env["otp_emails"] == 1, "the OTP should be delivered, not returned"


# --- /withdraw-flutterwave: the endpoint the frontend actually calls ---------

def _flw_payload(amount=5_000, **overrides):
    payload = {
        "amount": amount,
        "account_number": "0123456789",
        "bank_code": "058",
    }
    payload.update(overrides)
    return payload


@pytest.mark.asyncio
async def test_flutterwave_withdrawal_requires_a_pin_field(env):
    """Regression: the PIN defaulted to "000000" when the field was absent."""
    security.set_transaction_pin(USER, "4321")

    with pytest.raises(wallet.HTTPException) as exc:
        await wallet.withdraw_with_flutterwave(None, _flw_payload())

    assert exc.value.status_code == 400
    assert "pin" in str(exc.value.detail).lower()


@pytest.mark.asyncio
async def test_flutterwave_withdrawal_refused_when_no_pin_was_ever_set(env):
    assert USER not in security.transaction_pins

    with pytest.raises(wallet.HTTPException) as exc:
        await wallet.withdraw_with_flutterwave(None, _flw_payload(pin="000000"))

    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_flutterwave_withdrawal_refuses_wrong_pin(env):
    security.set_transaction_pin(USER, "4321")

    with pytest.raises(wallet.HTTPException) as exc:
        await wallet.withdraw_with_flutterwave(None, _flw_payload(pin="1111"))

    assert exc.value.status_code == 401


@pytest.mark.asyncio
async def test_flutterwave_withdrawal_above_balance_is_refused(env):
    security.set_transaction_pin(USER, "4321")

    with pytest.raises(wallet.HTTPException) as exc:
        await wallet.withdraw_with_flutterwave(
            None, _flw_payload(amount=BALANCE + 1, pin="4321")
        )

    assert exc.value.status_code == 400
    assert "insufficient" in str(exc.value.detail).lower()


# --- PIN persistence --------------------------------------------------------

@pytest.mark.asyncio
async def test_pin_survives_a_process_restart(env):
    """Regression: PINs lived only in wallet_security_service.transaction_pins,
    so every deploy wiped them and - once withdrawals started requiring a
    deliberately-set PIN - locked every user out of their money."""
    security.set_transaction_pin(USER, "4321")

    # Simulate a restart: the in-process cache is gone, the table is not.
    security.transaction_pins.clear()

    assert security.has_transaction_pin(USER), "PIN must be readable after a restart"
    assert security.verify_pin(USER, "4321")
    assert not security.verify_pin(USER, "1111")


@pytest.mark.asyncio
async def test_withdrawal_works_after_a_restart(env):
    security.set_transaction_pin(USER, "4321")
    security.transaction_pins.clear()

    result = await wallet.initiate_withdrawal(None, _request(5_000, "4321"))
    assert result["success"] is True


def test_setting_a_pin_reports_failure_when_it_cannot_be_saved(env, monkeypatch):
    """A PIN that was never persisted must not report success - otherwise the
    user believes they are set up and the next withdrawal 403s."""
    monkeypatch.setattr(security, "_db", staticmethod(lambda: None))
    result = security.set_transaction_pin(USER, "4321")
    assert result["success"] is False


def test_pin_is_never_stored_in_plaintext(env):
    security.set_transaction_pin(USER, "4321")
    stored = security.transaction_pins[USER]
    assert "4321" not in stored
    assert stored.count(":") == 1  # salt:hash
