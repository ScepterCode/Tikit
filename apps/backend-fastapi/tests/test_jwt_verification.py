"""Signature-verification tests for Supabase access tokens.

Until this landed the validator decoded tokens with
`verify_signature: False`, so anyone could mint a token for any user id and
be authenticated as them. These tests pin the guarantees:
  * a token signed with the wrong key is rejected,
  * `alg: none` is rejected,
  * expiry and issuer are enforced,
  * with no signing secret configured the validator FAILS CLOSED,
  * the caller's role never comes from client-writable token metadata.
"""
import time

import jwt
import pytest

import jwt_validator
from config import config

SECRET = "test-jwt-secret-test-jwt-secret-test-jwt"
ISSUER = jwt_validator._ISSUER
USER_ID = "11111111-2222-3333-4444-555555555555"


def _token(secret=SECRET, alg="HS256", **overrides):
    claims = {
        "sub": USER_ID,
        "iss": ISSUER,
        "aud": "authenticated",
        "exp": int(time.time()) + 3600,
        "iat": int(time.time()),
        "email": "user@example.com",
    }
    claims.update(overrides)
    return jwt.encode(claims, secret, algorithm=alg)


@pytest.fixture
def signed(monkeypatch):
    monkeypatch.setattr(config, "SUPABASE_JWT_SECRET", SECRET)
    monkeypatch.setattr(jwt_validator, "_ALLOW_UNVERIFIED", False)


def test_valid_token_is_accepted(signed):
    claims = jwt_validator.validate_token(_token())
    assert claims["sub"] == USER_ID


def test_token_signed_with_the_wrong_key_is_rejected(signed):
    forged = _token(secret="attacker-key-attacker-key-attacker-key")
    with pytest.raises(ValueError):
        jwt_validator.validate_token(forged)


def test_unsigned_alg_none_token_is_rejected(signed):
    forged = jwt.encode(
        {"sub": USER_ID, "iss": ISSUER, "exp": int(time.time()) + 3600},
        key="",
        algorithm="none",
    )
    with pytest.raises(ValueError, match="[Uu]nsigned"):
        jwt_validator.validate_token(forged)


def test_expired_token_is_rejected(signed):
    with pytest.raises(ValueError, match="expired"):
        jwt_validator.validate_token(_token(exp=int(time.time()) - 10))


def test_token_from_another_issuer_is_rejected(signed):
    with pytest.raises(ValueError):
        jwt_validator.validate_token(_token(iss="https://evil.supabase.co/auth/v1"))


def test_wrong_audience_is_rejected(signed):
    with pytest.raises(ValueError, match="audience"):
        jwt_validator.validate_token(_token(aud="anon"))


def test_missing_secret_fails_closed(monkeypatch):
    """No signing material must mean 'reject', never 'skip verification'."""
    monkeypatch.setattr(config, "SUPABASE_JWT_SECRET", "")
    monkeypatch.setattr(jwt_validator, "_ALLOW_UNVERIFIED", False)

    with pytest.raises(ValueError, match="SUPABASE_JWT_SECRET"):
        jwt_validator.validate_token(_token())


def test_dev_escape_hatch_is_opt_in_only(monkeypatch):
    """ALLOW_UNVERIFIED_JWT lets local dev run without the secret."""
    monkeypatch.setattr(config, "SUPABASE_JWT_SECRET", "")
    monkeypatch.setattr(jwt_validator, "_ALLOW_UNVERIFIED", True)

    claims = jwt_validator.validate_token(_token())
    assert claims["sub"] == USER_ID


# --- privilege escalation ---------------------------------------------------

def test_role_is_not_taken_from_client_writable_metadata(signed, monkeypatch):
    """Regression: role came from `user_metadata`, which a user can set
    themselves with supabase.auth.updateUser({data:{role:'admin'}})."""
    monkeypatch.setattr(jwt_validator, "_load_user_profile", lambda _uid: {"role": "attendee"})

    token = _token(user_metadata={"role": "admin", "first_name": "Mallory"})
    user = jwt_validator.extract_user_from_token(token)

    assert user["role"] == "attendee", "role must come from the database, not the token"
    assert user["first_name"] == "Mallory"  # display-only fields are still fine


def test_role_comes_from_the_users_table(signed, monkeypatch):
    monkeypatch.setattr(
        jwt_validator, "_load_user_profile",
        lambda _uid: {"role": "organizer", "email": "org@example.com"},
    )
    user = jwt_validator.extract_user_from_token(_token())
    assert user["role"] == "organizer"
    assert user["email"] == "org@example.com"


def test_unknown_user_falls_back_to_least_privilege(signed, monkeypatch):
    monkeypatch.setattr(jwt_validator, "_load_user_profile", lambda _uid: {})
    user = jwt_validator.extract_user_from_token(_token(user_metadata={"role": "admin"}))
    assert user["role"] == "attendee"


def test_wallet_balance_is_never_taken_from_the_token(signed, monkeypatch):
    monkeypatch.setattr(jwt_validator, "_load_user_profile", lambda _uid: {})
    user = jwt_validator.extract_user_from_token(
        _token(user_metadata={"wallet_balance": 999_999})
    )
    assert user["wallet_balance"] == 0


# --- the other verification path -------------------------------------------

def test_auth_service_rejects_a_forged_token(signed, monkeypatch):
    """middleware/auth.py authenticates through auth_service.verify_token,
    which also used to decode with verify_signature=False."""
    from services.auth_service import auth_service

    class _Supabase:
        def table(self, _name):
            raise AssertionError("must not reach the database with a bad token")

    monkeypatch.setattr(auth_service, "supabase", _Supabase())

    forged = _token(secret="attacker-key-attacker-key-attacker-key")
    assert auth_service.verify_token(forged) is None


def test_auth_service_accepts_a_correctly_signed_token(signed, monkeypatch):
    from services.auth_service import auth_service

    row = {"id": USER_ID, "role": "organizer", "phone_number": "+2340000000000",
           "state": "Lagos", "email": "org@example.com"}

    class _Q:
        def select(self, *_a, **_k): return self
        def eq(self, *_a, **_k): return self
        def execute(self): return type("R", (), {"data": [row]})()

    monkeypatch.setattr(
        auth_service, "supabase",
        type("S", (), {"table": staticmethod(lambda _n: _Q())})(),
    )

    payload = auth_service.verify_token(_token())
    assert payload is not None
    assert payload["user_id"] == USER_ID
    assert payload["role"] == "organizer"
