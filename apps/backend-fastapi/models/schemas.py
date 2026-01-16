"""
Pydantic models for request/response schemas
"""
from pydantic import BaseModel, EmailStr, validator
from typing import Optional, Literal
from datetime import datetime
import re

# User Models
class UserBase(BaseModel):
    phone_number: str
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    state: str
    preferred_language: Optional[Literal["en", "ha", "ig", "yo", "pcm"]] = "en"
    role: Literal["attendee", "organizer"]  # No default - role must be explicitly provided
    organization_name: Optional[str] = None
    organization_type: Optional[Literal["individual", "company", "religious", "educational", "ngo", "other"]] = None

    @validator('phone_number')
    def validate_phone_number(cls, v):
        # Nigerian phone number validation
        pattern = r'^(\+?234|0)[789]\d{9}$'
        if not re.match(pattern, v):
            raise ValueError('Invalid Nigerian phone number format. Use +234XXXXXXXXXX or 0XXXXXXXXXX')
        return v

class UserCreate(UserBase):
    password: str
    referred_by: Optional[str] = None

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v

class UserResponse(BaseModel):
    id: str
    phone_number: str
    first_name: str
    last_name: str
    email: Optional[str] = None
    state: str
    role: str
    wallet_balance: float = 0.0
    referral_code: str = ""
    organization_name: Optional[str] = None
    organization_type: Optional[str] = None
    is_verified: bool = False
    created_at: datetime

# Auth Models
class LoginRequest(BaseModel):
    phone_number: str
    password: str

    @validator('phone_number')
    def validate_phone_number(cls, v):
        pattern = r'^(\+?234|0)[789]\d{9}$'
        if not re.match(pattern, v):
            raise ValueError('Invalid Nigerian phone number format. Use +234XXXXXXXXXX or 0XXXXXXXXXX')
        return v

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class OTPRequest(BaseModel):
    phone_number: str

    @validator('phone_number')
    def validate_phone_number(cls, v):
        pattern = r'^\+234\d{10}$'
        if not re.match(pattern, v):
            raise ValueError('Invalid Nigerian phone number format. Use +234XXXXXXXXXX')
        return v

class OTPVerifyRequest(BaseModel):
    phone_number: str
    code: str

    @validator('phone_number')
    def validate_phone_number(cls, v):
        pattern = r'^\+234\d{10}$'
        if not re.match(pattern, v):
            raise ValueError('Invalid Nigerian phone number format')
        return v

    @validator('code')
    def validate_code(cls, v):
        if len(v) != 6:
            raise ValueError('OTP code must be 6 digits')
        return v

# Response Models
class SuccessResponse(BaseModel):
    success: bool = True
    message: str

class ErrorResponse(BaseModel):
    success: bool = False
    error: dict