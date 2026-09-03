"""
Supabase JWT validation.

Access tokens are verified for real: the signature is checked against either
the project's shared HS256 secret (SUPABASE_JWT_SECRET) or, for projects on
asymmetric keys, the published JWKS. A token that fails verification is
rejected - there is no "decode without checking" path outside an explicit
development opt-in.
"""

import logging
import os
import time
from typing import Any, Dict, Optional

import jwt
from jwt import PyJWKClient

from config import config

logger = logging.getLogger(__name__)

SUPABASE_URL = config.SUPABASE_URL
SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY

_ISSUER = f"{SUPABASE_URL}/auth/v1"
_JWKS_URL = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
_SYMMETRIC_ALGS = ("HS256", "HS384", "HS512")
_ASYMMETRIC_ALGS = ("RS256", "RS384", "RS512", "ES256", "ES384", "ES512")

# Escape hatch for local development only: skip signature verification when no
# signing material is configured. Never honoured outside ENVIRONMENT=development.
_ALLOW_UNVERIFIED = (
    os.getenv("ENVIRONMENT", "production").lower() == "development"
    and os.getenv("ALLOW_UNVERIFIED_JWT", "false").lower() == "true"
)

_jwks_client: Optional[PyJWKClient] = None


def _get_jwks_client() -> PyJWKClient:
    """Lazily build a cached JWKS client (it caches keys internally)."""
    global _jwks_client
    if _jwks_client is None:
        _jwks_client = PyJWKClient(_JWKS_URL, cache_keys=True, lifespan=3600)
    return _jwks_client


def _decode_verified(token: str, alg: str) -> Dict[str, Any]:
    """Decode with signature verification, choosing the key by algorithm."""
    common = dict(
        algorithms=[alg],
        issuer=_ISSUER,
        # Supabase sets aud="authenticated" on user tokens but not on every
        # token type, so audience is checked explicitly below instead.
        options={
            "verify_signature": True,
            "verify_exp": True,
            "verify_iss": True,
            "verify_aud": False,
        },
    )

    if alg in _SYMMETRIC_ALGS:
        secret = config.SUPABASE_JWT_SECRET
        if not secret:
            raise ValueError(
                "SUPABASE_JWT_SECRET is not configured - cannot verify token "
                "signatures. Set it from Supabase: Project Settings -> API -> "
                "JWT Settings."
            )
        return jwt.decode(token, secret, **common)

    if alg in _ASYMMETRIC_ALGS:
        signing_key = _get_jwks_client().get_signing_key_from_jwt(token)
        return jwt.decode(token, signing_key.key, **common)

    raise ValueError(f"Unsupported token algorithm: {alg}")


def validate_token(token: str) -> Dict[str, Any]:
    """Verify a Supabase access token and return its claims.

    Raises:
        ValueError: if the token is malformed, unsigned, signed with the wrong
            key, expired, or issued by a different project.
    """
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "")

        if alg == "none":
            raise ValueError("Unsigned tokens are not accepted")

        try:
            claims = _decode_verified(token, alg)
        except ValueError:
            # Raised only when no signing material is configured.
            if not _ALLOW_UNVERIFIED:
                raise
            logger.warning(
                "ALLOW_UNVERIFIED_JWT is on - accepting a token WITHOUT "
                "signature verification. Development only."
            )
            claims = jwt.decode(
                token,
                options={
                    "verify_signature": False,
                    "verify_exp": True,
                    "verify_iss": True,
                    "verify_aud": False,
                },
                issuer=_ISSUER,
            )

        for claim in ("sub", "iss", "exp"):
            if not claims.get(claim):
                raise ValueError(f"Token missing required '{claim}' claim")

        if claims.get("iss") != _ISSUER:
            raise ValueError(f"Invalid token issuer: {claims.get('iss')}")

        aud = claims.get("aud")
        if aud and aud != "authenticated":
            raise ValueError(f"Unexpected token audience: {aud}")

        # Defence in depth - PyJWT already enforces exp when verifying.
        if float(claims["exp"]) < time.time():
            raise ValueError("Token has expired")

        logger.debug("Token verified for user %s (alg=%s)", claims.get("sub"), alg)
        return claims

    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.InvalidIssuerError:
        raise ValueError("Invalid token issuer")
    except jwt.InvalidSignatureError:
        raise ValueError("Token signature verification failed")
    except jwt.DecodeError as e:
        raise ValueError(f"Invalid token format: {e}")
    except jwt.PyJWTError as e:
        raise ValueError(f"Token validation failed: {e}")
    except ValueError:
        raise
    except Exception as e:
        # e.g. the JWKS endpoint being unreachable
        logger.error("Token validation error: %s", e)
        raise ValueError(f"Token validation failed: {e}")


def _load_user_profile(user_id: Optional[str]) -> Dict[str, Any]:
    """Load the authoritative user row. Returns {} when it cannot be read.

    Failing to an empty profile means the caller falls back to the least
    privileged role rather than to whatever the token claimed.
    """
    if not user_id:
        return {}
    try:
        from services.supabase_client import get_supabase_client

        supabase = get_supabase_client()
        if not supabase:
            return {}
        result = supabase.table("users").select("*").eq("id", user_id).execute()
        if result.data:
            return result.data[0]
        logger.warning("No users row for %s - defaulting to attendee", user_id)
    except Exception as e:
        logger.warning("Could not load profile for %s: %s", user_id, e)
    return {}


def extract_user_from_token(token: str) -> Dict[str, Any]:
    """
    Extract user information from validated token
    
    Args:
        token: JWT token from Authorization header
        
    Returns:
        Dictionary with user information
    """
    try:
        claims = validate_token(token)

        user_meta = claims.get("user_metadata") or {}
        user_id = claims.get("sub")

        # SECURITY: `user_metadata` is writable by the user themselves via
        # supabase.auth.updateUser({data: {...}}), so it must never decide
        # authorisation - a user could simply set role="admin". The `users`
        # table is the authority; anything we cannot confirm there is treated
        # as an ordinary attendee.
        profile = _load_user_profile(user_id)
        role = profile.get("role") or "attendee"

        user_info = {
            "id": user_id,
            "email": profile.get("email") or claims.get("email"),
            "phone_number": profile.get("phone_number") or claims.get("phone"),
            # Display-only fields may come from the token; they grant nothing.
            "first_name": profile.get("first_name") or user_meta.get("first_name"),
            "last_name": profile.get("last_name") or user_meta.get("last_name"),
            "role": role,
            "state": profile.get("state") or user_meta.get("state"),
            "organization_name": profile.get("organization_name") or user_meta.get("organization_name"),
            "organization_type": profile.get("organization_type") or user_meta.get("organization_type"),
            # Balances are read from the database at point of use, never a token.
            "wallet_balance": profile.get("wallet_balance", 0),
            "is_verified": claims.get("email_confirmed_at") is not None,
            "created_at": profile.get("created_at") or claims.get("created_at"),
        }

        logger.debug("Extracted user %s (role=%s)", user_id, role)
        return user_info
    except Exception as e:
        logger.warning("Error extracting user from token: %s", e)
        raise

def get_token_from_header(auth_header: str) -> Optional[str]:
    """
    Extract JWT token from Authorization header
    
    Args:
        auth_header: Authorization header value
        
    Returns:
        JWT token or None if not found
    """
    if not auth_header:
        return None
    
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    
    return parts[1]

def validate_request_token(request) -> Dict[str, Any]:
    """
    Validate token from request and return user info
    
    Args:
        request: FastAPI request object
        
    Returns:
        Dictionary with user information
        
    Raises:
        ValueError: If token is missing or invalid
    """
    auth_header = request.headers.get("Authorization", "")
    token = get_token_from_header(auth_header)
    
    if not token:
        raise ValueError("Missing or invalid Authorization header")
    
    return extract_user_from_token(token)
