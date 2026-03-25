"""
Wallet Data Models and Enums
Unified data structures for the consolidated wallet system
"""
from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, validator
import uuid
import time

class WalletType(str, Enum):
    MAIN = "main"           # Primary spending wallet
    SAVINGS = "savings"     # High-yield savings wallet
    BUSINESS = "business"   # For organizers/business transactions
    ESCROW = "escrow"      # For disputed transactions

class TransactionType(str, Enum):
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"
    TRANSFER = "transfer"
    SPRAY_MONEY = "spray_money"
    INTEREST = "interest"
    FEE = "fee"
    TOPUP = "topup"
    REFUND = "refund"

class TransactionStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class SecurityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class WithdrawalMethod(str, Enum):
    BANK_TRANSFER = "bank_transfer"
    MOBILE_MONEY = "mobile_money"
    CASH_PICKUP = "cash_pickup"
    CRYPTO = "crypto"

class WithdrawalStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class AutoSaveRule(str, Enum):
    ROUND_UP = "round_up"           # Round up purchases to nearest ₦100
    PERCENTAGE = "percentage"       # Save percentage of income
    FIXED_AMOUNT = "fixed_amount"   # Save fixed amount daily/weekly/monthly
    GOAL_BASED = "goal_based"      # Save towards specific goal

class Wallet(BaseModel):
    """Unified wallet model"""
    id: str
    user_id: str
    type: WalletType
    name: str
    balance: float
    currency: str = "NGN"
    is_active: bool = True
    is_default: bool = False
    created_at: float
    updated_at: float
    restrictions: Dict[str, Any] = {}
    metadata: Dict[str, Any] = {}
    
    # Type-specific fields
    interest_rate: Optional[float] = None
    last_interest_calculation: Optional[float] = None
    business_info: Optional[Dict[str, Any]] = None

class Transaction(BaseModel):
    """Unified transaction model"""
    id: str
    user_id: str
    wallet_id: Optional[str] = None
    from_wallet_id: Optional[str] = None
    to_wallet_id: Optional[str] = None
    type: TransactionType
    amount: float
    fee: float = 0
    description: str
    reference: str
    status: TransactionStatus
    metadata: Dict[str, Any] = {}
    created_at: float
    updated_at: float
    
    # Additional fields for specific transaction types
    event_id: Optional[str] = None
    recipient_id: Optional[str] = None
    external_reference: Optional[str] = None

class SecurityCheck(BaseModel):
    """Security validation result"""
    is_valid: bool
    security_level: SecurityLevel
    requires_pin: bool = False
    requires_otp: bool = False
    fraud_score: int = 0
    reasons: List[str] = []
    lockout_remaining: Optional[int] = None

class Withdrawal(BaseModel):
    """Withdrawal request model"""
    id: str
    user_id: str
    amount: float
    fee: float
    total_deduction: float
    method: WithdrawalMethod
    destination: Dict[str, Any]
    processing_type: str = "standard"
    status: WithdrawalStatus
    reference: str
    estimated_completion: Optional[float] = None
    created_at: float
    updated_at: float
    metadata: Dict[str, Any] = {}
    
    # Processing fields
    processing_started_at: Optional[float] = None
    completed_at: Optional[float] = None
    cancelled_at: Optional[float] = None
    failure_reason: Optional[str] = None
    transaction_reference: Optional[str] = None

class BankAccount(BaseModel):
    """Bank account model for withdrawals"""
    id: str
    user_id: str
    account_number: str
    account_name: str
    bank_code: str
    bank_name: str
    is_verified: bool = False
    is_primary: bool = False
    created_at: float

class SavingsGoal(BaseModel):
    """Savings goal model"""
    id: str
    user_id: str
    name: str
    description: str = ""
    target_amount: float
    current_amount: float = 0
    target_date: Optional[float] = None
    category: str = "general"
    is_active: bool = True
    created_at: float
    updated_at: float
    contributions: List[Dict[str, Any]] = []
    milestones: List[Dict[str, Any]] = []
    weekly_target: Optional[float] = None
    monthly_target: Optional[float] = None

class AutoSaveRuleModel(BaseModel):
    """Auto-save rule model"""
    id: str
    user_id: str
    type: AutoSaveRule
    target_wallet: WalletType = WalletType.SAVINGS
    is_active: bool = True
    created_at: float
    updated_at: float
    total_saved: float = 0
    last_execution: Optional[float] = None
    
    # Rule-specific configuration
    round_up_to: Optional[int] = None
    percentage: Optional[float] = None
    income_sources: Optional[List[str]] = None
    amount: Optional[float] = None
    frequency: Optional[str] = None
    goal_amount: Optional[float] = None
    goal_name: Optional[str] = None
    target_date: Optional[float] = None
    weekly_target: Optional[float] = None

class WalletAnalytics(BaseModel):
    """Wallet analytics model"""
    total_balance: float
    wallet_distribution: Dict[str, Dict[str, Any]]
    savings_performance: Dict[str, Any] = {}
    auto_save_summary: Dict[str, Any] = {}
    goals_progress: List[Dict[str, Any]] = []
    spending_analytics: Dict[str, Any] = {}
    transaction_summary: Dict[str, Any] = {}

# Request/Response Models for API endpoints
class TransferRequest(BaseModel):
    from_wallet: WalletType
    to_wallet: WalletType
    amount: float
    description: str = "Internal wallet transfer"
    pin: Optional[str] = None
    
    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be positive')
        return v

class WithdrawalRequest(BaseModel):
    amount: float
    method: WithdrawalMethod
    destination: Dict[str, Any]
    processing_type: str = "standard"
    pin: str
    
    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be positive')
        return v

class SetPinRequest(BaseModel):
    pin: str
    confirm_pin: str
    
    @validator('pin')
    def validate_pin(cls, v):
        if not v.isdigit() or len(v) < 4 or len(v) > 6:
            raise ValueError('PIN must be 4-6 digits')
        return v

class VerifyPinRequest(BaseModel):
    pin: str

class OTPRequest(BaseModel):
    purpose: str = "transaction"

class VerifyOTPRequest(BaseModel):
    otp_code: str

class BankAccountRequest(BaseModel):
    account_number: str
    bank_code: str
    account_name: Optional[str] = None

class SavingsGoalRequest(BaseModel):
    name: str
    description: str = ""
    target_amount: float
    target_date: Optional[str] = None
    category: str = "general"
    
    @validator('target_amount')
    def validate_target_amount(cls, v):
        if v <= 0:
            raise ValueError('Target amount must be positive')
        return v

class ContributeGoalRequest(BaseModel):
    amount: float
    source_wallet: WalletType = WalletType.MAIN
    
    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be positive')
        return v

class AutoSaveRuleRequest(BaseModel):
    type: AutoSaveRule
    target_wallet: WalletType = WalletType.SAVINGS
    
    # Optional rule-specific fields
    round_up_to: Optional[int] = 100
    percentage: Optional[float] = None
    income_sources: Optional[List[str]] = None
    amount: Optional[float] = None
    frequency: Optional[str] = None
    goal_amount: Optional[float] = None
    goal_name: Optional[str] = None
    target_date: Optional[str] = None

# Utility functions for model creation
def create_wallet_id() -> str:
    """Generate unique wallet ID"""
    return str(uuid.uuid4())

def create_transaction_id() -> str:
    """Generate unique transaction ID"""
    return str(uuid.uuid4())

def create_reference(prefix: str = "TXN") -> str:
    """Generate transaction reference"""
    timestamp = int(time.time())
    random_id = str(uuid.uuid4())[:8].upper()
    return f"{prefix}{timestamp}{random_id}"

def get_current_timestamp() -> float:
    """Get current timestamp"""
    return time.time()

# Constants
WALLET_LIMITS = {
    WalletType.MAIN: {
        "daily_spend_limit": 500000,
        "transaction_limit": 100000,
        "requires_pin": True
    },
    WalletType.SAVINGS: {
        "withdrawal_notice_period": 24,
        "min_balance": 1000,
        "requires_pin": True
    },
    WalletType.BUSINESS: {
        "requires_verification": True,
        "requires_pin": True,
        "business_only": True
    },
    WalletType.ESCROW: {
        "requires_admin_approval": True,
        "auto_release_period": 168  # 7 days in hours
    }
}

INTEREST_RATES = {
    WalletType.MAIN: 0.0,      # No interest
    WalletType.SAVINGS: 8.5,   # 8.5% annual interest
    WalletType.BUSINESS: 2.0,  # 2% annual interest
    WalletType.ESCROW: 0.0     # No interest
}

TRANSFER_LIMITS = {
    "daily_limit": 1000000,    # ₦1M daily transfer limit
    "monthly_limit": 10000000, # ₦10M monthly transfer limit
    "min_transfer": 100,       # ₦100 minimum transfer
}

TRANSFER_FEES = {
    "internal": 0,             # Free internal transfers
    "external": 50,            # ₦50 for external transfers
    "instant": 100             # ₦100 for instant transfers
}

WITHDRAWAL_LIMITS = {
    WithdrawalMethod.BANK_TRANSFER: {"min": 100, "max": 2000000},
    WithdrawalMethod.MOBILE_MONEY: {"min": 50, "max": 500000},
    WithdrawalMethod.CASH_PICKUP: {"min": 500, "max": 100000},
    WithdrawalMethod.CRYPTO: {"min": 1000, "max": 5000000}
}

WITHDRAWAL_FEES = {
    WithdrawalMethod.BANK_TRANSFER: {
        "instant": 200,  # ₦200 for instant transfer
        "standard": 50   # ₦50 for next business day
    },
    WithdrawalMethod.MOBILE_MONEY: {
        "instant": 100,
        "standard": 25
    },
    WithdrawalMethod.CASH_PICKUP: {
        "instant": 150,
        "standard": 75
    },
    WithdrawalMethod.CRYPTO: {
        "instant": 0.5,  # 0.5% of amount
        "standard": 0.2  # 0.2% of amount
    }
}

SUPPORTED_BANKS = {
    "044": "Access Bank",
    "014": "Afribank Nigeria Plc",
    "023": "Citibank Nigeria Limited",
    "050": "Ecobank Nigeria Plc",
    "011": "First Bank of Nigeria Limited",
    "214": "First City Monument Bank Limited",
    "070": "Fidelity Bank Plc",
    "058": "Guaranty Trust Bank Plc",
    "030": "Heritage Banking Company Ltd",
    "082": "Keystone Bank Limited",
    "076": "Polaris Bank Limited",
    "221": "Stanbic IBTC Bank Plc",
    "068": "Standard Chartered Bank Nigeria Ltd",
    "232": "Sterling Bank Plc",
    "032": "Union Bank of Nigeria Plc",
    "033": "United Bank for Africa Plc",
    "215": "Unity Bank Plc",
    "035": "Wema Bank Plc",
    "057": "Zenith Bank Plc"
}

MOBILE_PROVIDERS = {
    "mtn": "MTN Mobile Money",
    "airtel": "Airtel Money",
    "glo": "Glo Mobile Money",
    "9mobile": "9mobile Easy Wallet"
}