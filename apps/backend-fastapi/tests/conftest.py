"""Shared pytest configuration for the FastAPI backend tests.

Sets the minimal environment required for modules that create Supabase /
config clients at import time, so tests can import routers without a real
backend.
"""
import os

os.environ.setdefault("ENVIRONMENT", "development")
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_ANON_KEY", "eyJ0ZXN0IjogMX0.signature.value")
os.environ.setdefault("SUPABASE_SERVICE_KEY", "eyJ0ZXN0IjogMX0.signature.value")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "eyJ0ZXN0IjogMX0.signature.value")
os.environ.setdefault("JWT_SECRET", "0123456789012345678901234567890123456789")
