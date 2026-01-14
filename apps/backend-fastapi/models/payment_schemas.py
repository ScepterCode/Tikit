"""
Payment-related Pydantic models for request/response schemas
"""
from pydantic import BaseModel, validator, EmailStr
from typing import Optional, Dict, Any, Literal, List
from datetime import datetime
from decimal import Decimal

# Payment Models
class PaymentBase(BaseModel):
    amount: float
    currency: str = "NGN"
    payment_method: str
    status: Literal["pending", "successful", "failed", "cancelled"] = "pending"

class PaymentInitializeRequest(BaseModel):
    amount: float
    email: EmailStr
    event_id: Optional[str] = None
    tier_id: Optional[str] = None
    quantity: int = 1
    metadata: Optional[Dict[str, Any]] = None
    
    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be positive')
        return v
    
    @validator('quantity')
    def validate_quantity(cls, v):
        if v < 1 or v > 100:
            raise ValueError('Quantity must be between 1 and 100')
        return v

class PaymentInitializeResponse(BaseModel):
    payment_id: str
    reference: str
    authorization_url: str
    access_code: str
    amount: float
    currency: str
    status: str

class PaymentVerifyRequest(BaseModel):
    reference: str

class PaymentVerifyResponse(BaseModel):
    payment_id: str
    reference: str
    amount: float
    status: str
    gateway_response: str
    paid_at: Optional[datetime] = None
    channel: Optional[str] = None
    fees: Optional[float] = None
    customer: Optional[Dict[str, Any]] = None

class PaymentResponse(BaseModel):
    id: str
    user_id: str
    event_id: Optional[str] = None
    tier_id: Optional[str] = None
    amount: float
    currency: str
    payment_method: str
    status: str
    reference: str
    gateway_response: Optional[str] = None
    paid_at: Optional[datetime] = None
    created_at: datetime
    metadata: Optional[Dict[str, Any]] = None

# Airtime Payment Models
class AirtimePaymentRequest(BaseModel):
    phone_number: str
    amount: float
    metadata: Optional[Dict[str, Any]] = None
    
    @validator('phone_number')
    def validate_phone_number(cls, v):
        import re
        if not re.match(r'^\+?234[0-9]{10}$', v):
            raise ValueError('Invalid Nigerian phone number format')
        return v
    
    @validator('amount')
    def validate_amount(cls, v):
        if not 50 <= v <= 10000:
            raise ValueError('Airtime amount must be between ₦50 and ₦10,000')
        return v

class AirtimePaymentResponse(BaseModel):
    payment_id: str
    phone_number: str
    amount: float
    status: str
    reference: str
    message: str

# Sponsorship Models
class SponsorshipRequest(BaseModel):
    requester_phone: str
    sponsor_phone: str
    amount: float
    event_id: Optional[str] = None
    message: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    
    @validator('requester_phone', 'sponsor_phone')
    def validate_phone_numbers(cls, v):
        import re
        if not re.match(r'^\+?234[0-9]{10}$', v):
            raise ValueError('Invalid Nigerian phone number format')
        return v
    
    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be positive')
        return v

class SponsorshipApprovalRequest(BaseModel):
    code: str
    otp: str
    
    @validator('otp')
    def validate_otp(cls, v):
        if len(v) != 6 or not v.isdigit():
            raise ValueError('OTP must be exactly 6 digits')
        return v

class SponsorshipResponse(BaseModel):
    id: str
    requester_phone: str
    sponsor_phone: str
    amount: float
    status: str
    code: str
    event_id: Optional[str] = None
    message: Optional[str] = None
    created_at: datetime
    approved_at: Optional[datetime] = None

# Wallet Models
class WalletTopupRequest(BaseModel):
    amount: float
    payment_method: str = "paystack"
    
    @validator('amount')
    def validate_amount(cls, v):
        if not 100 <= v <= 500000:
            raise ValueError('Wallet topup amount must be between ₦100 and ₦500,000')
        return v

class WalletWithdrawRequest(BaseModel):
    amount: float
    bank_code: str
    account_number: str
    account_name: str
    
    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be positive')
        return v
    
    @validator('account_number')
    def validate_account_number(cls, v):
        if len(v) != 10 or not v.isdigit():
            raise ValueError('Account number must be exactly 10 digits')
        return v

class WalletResponse(BaseModel):
    user_id: str
    balance: float
    currency: str = "NGN"
    last_updated: datetime

# Payment History Models
class PaymentHistoryResponse(BaseModel):
    payments: List[PaymentResponse]
    total: int
    page: int
    limit: int
    has_next: bool
    has_prev: bool

# Webhook Models
class WebhookPayload(BaseModel):
    event: str
    data: Dict[str, Any]