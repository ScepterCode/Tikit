"""
Enhanced Wallet Router with Security and Withdrawal Features
"""
from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel, validator
from typing import Optional, Dict, Any, List
from datetime import datetime

# Import services
from services.wallet_security_service import wallet_security_service
from services.withdrawal_service import withdrawal_service, WithdrawalMethod
from auth_utils import get_user_from_request, user_database

router = APIRouter(prefix="/api/wallet", tags=["wallet"])

# Request Models
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

class WithdrawalRequest(BaseModel):
    amount: float
    method: WithdrawalMethod
    destination: Dict[str, Any]
    processing_type: Optional[str] = "standard"
    pin: str
    
    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be positive')
        return v

class BankAccountRequest(BaseModel):
    account_number: str
    bank_code: str
    account_name: Optional[str] = None

class OTPRequest(BaseModel):
    purpose: Optional[str] = "transaction"

class VerifyOTPRequest(BaseModel):
    otp_code: str

# Security Endpoints
@router.post("/security/set-pin")
async def set_transaction_pin(request: Request, pin_data: SetPinRequest):
    """Set transaction PIN for enhanced security"""
    try:
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        # Validate PIN confirmation
        if pin_data.pin != pin_data.confirm_pin:
            raise HTTPException(
                status_code=400,
                detail="PIN confirmation does not match"
            )
        
        result = wallet_security_service.set_transaction_pin(user_id, pin_data.pin)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "message": result["message"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/security/verify-pin")
async def verify_transaction_pin(request: Request, pin_data: VerifyPinRequest):
    """Verify transaction PIN"""
    try:
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        is_valid = wallet_security_service.verify_pin(user_id, pin_data.pin)
        
        if not is_valid:
            wallet_security_service.record_failed_attempt(user_id, "pin")
            raise HTTPException(
                status_code=401,
                detail="Invalid transaction PIN"
            )
        
        return {
            "success": True,
            "message": "PIN verified successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/security/generate-otp")
async def generate_otp(request: Request, otp_data: OTPRequest):
    """Generate OTP for transaction verification"""
    try:
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        result = wallet_security_service.generate_otp(user_id, otp_data.purpose)
        
        return {
            "success": True,
            "message": result["message"],
            "expires_in": result["expires_in"]
            # Note: In production, OTP would be sent via SMS/Email, not returned
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/security/verify-otp")
async def verify_otp(request: Request, otp_data: VerifyOTPRequest):
    """Verify OTP code"""
    try:
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        result = wallet_security_service.verify_otp(user_id, otp_data.otp_code)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "message": result["message"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/security/status")
async def get_security_status(request: Request):
    """Get user's wallet security status"""
    try:
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        status = wallet_security_service.get_security_status(user_id)
        
        return {
            "success": True,
            "data": status
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Bank Account Management
@router.post("/bank-accounts")
async def add_bank_account(request: Request, account_data: BankAccountRequest):
    """Add bank account for withdrawals"""
    try:
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        result = withdrawal_service.add_bank_account(user_id, account_data.dict())
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "message": result["message"],
            "account": result["account"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/bank-accounts")
async def get_bank_accounts(request: Request):
    """Get user's bank accounts"""
    try:
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        accounts = withdrawal_service.bank_accounts.get(user_id, [])
        
        return {
            "success": True,
            "data": {
                "accounts": accounts,
                "count": len(accounts)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Withdrawal Endpoints
@router.post("/withdraw")
async def initiate_withdrawal(request: Request, withdrawal_data: WithdrawalRequest):
    """Initiate wallet withdrawal"""
    try:
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        # Security validation
        security_check = wallet_security_service.validate_transaction_security(
            user_id, 
            {
                "amount": withdrawal_data.amount,
                "type": "withdrawal",
                "user_tier": user.get("tier", "basic")
            }
        )
        
        if not security_check["success"]:
            raise HTTPException(status_code=400, detail=security_check["error"])
        
        # Verify PIN
        if not wallet_security_service.verify_pin(user_id, withdrawal_data.pin):
            wallet_security_service.record_failed_attempt(user_id, "pin")
            raise HTTPException(status_code=401, detail="Invalid transaction PIN")
        
        # Generate OTP if required
        if security_check.get("requires_otp", False):
            otp_result = wallet_security_service.generate_otp(user_id, "withdrawal")
            return {
                "success": False,
                "requires_otp": True,
                "message": "OTP verification required for this withdrawal",
                "otp_expires_in": otp_result["expires_in"]
            }
        
        # Initiate withdrawal
        result = withdrawal_service.initiate_withdrawal(user_id, withdrawal_data.dict())
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "message": result["message"],
            "withdrawal": result["withdrawal"],
            "next_steps": result["next_steps"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/withdrawals")
async def get_withdrawals(request: Request, limit: int = 20, offset: int = 0):
    """Get user's withdrawal history"""
    try:
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        result = withdrawal_service.get_user_withdrawals(user_id, limit, offset)
        
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/withdrawals/{withdrawal_id}")
async def get_withdrawal_status(request: Request, withdrawal_id: str):
    """Get specific withdrawal status"""
    try:
        user = await get_user_from_request(request)
        
        result = withdrawal_service.get_withdrawal_status(withdrawal_id)
        
        if not result["success"]:
            raise HTTPException(status_code=404, detail=result["error"])
        
        # Verify ownership
        if result["withdrawal"]["user_id"] != user["user_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return {
            "success": True,
            "data": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/withdrawals/{withdrawal_id}/cancel")
async def cancel_withdrawal(request: Request, withdrawal_id: str):
    """Cancel a pending withdrawal"""
    try:
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        result = withdrawal_service.cancel_withdrawal(withdrawal_id, user_id)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "message": result["message"],
            "withdrawal": result["withdrawal"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/withdrawal-methods")
async def get_withdrawal_methods():
    """Get available withdrawal methods and their details"""
    try:
        methods = []
        
        for method in WithdrawalMethod:
            method_info = {
                "method": method.value,
                "name": method.value.replace("_", " ").title(),
                "limits": withdrawal_service.WITHDRAWAL_LIMITS[method],
                "fees": withdrawal_service.WITHDRAWAL_FEES[method],
                "processing_times": {
                    "instant": "5-15 minutes",
                    "standard": "2-24 hours"
                }
            }
            methods.append(method_info)
        
        return {
            "success": True,
            "data": {
                "methods": methods,
                "supported_banks": withdrawal_service.SUPPORTED_BANKS,
                "mobile_providers": withdrawal_service.MOBILE_PROVIDERS
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
# ============================================================================
# PHASE 2: ENHANCED FEATURES
# ============================================================================

# Import Phase 2 services
from services.transaction_history_service import transaction_history_service, TransactionType
from services.multi_wallet_service import multi_wallet_service, WalletType, AutoSaveRule
from services.advanced_spray_money_service import advanced_spray_money_service, SprayType, SprayEffect

# Enhanced Transaction History Endpoints
@router.get("/transactions/enhanced")
async def get_enhanced_transactions(
    request: Request,
    limit: int = 50,
    offset: int = 0,
    start_date: Optional[float] = None,
    end_date: Optional[float] = None,
    transaction_type: Optional[str] = None,
    category: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None
):
    """Get enhanced transaction history with advanced filtering"""
    try:
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        # Build filters
        filters = {"limit": limit, "offset": offset}
        if start_date:
            filters["start_date"] = start_date
        if end_date:
            filters["end_date"] = end_date
        if transaction_type:
            filters["type"] = transaction_type
        if category:
            filters["category"] = category
        if min_amount:
            filters["min_amount"] = min_amount
        if max_amount:
            filters["max_amount"] = max_amount
        
        result = transaction_history_service.get_user_transactions(user_id, filters)
        
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/transactions/analytics")
async def get_spending_analytics(request: Request, period: str = "month"):
    """Get comprehensive spending analytics"""
    try:
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        analytics = transaction_history_service.get_spending_analytics(user_id, period)
        
        return {
            "success": True,
            "data": analytics
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/transactions/search")
async def search_transactions(request: Request, query: str):
    """Search transactions by description, reference, or metadata"""
    try:
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        results = transaction_history_service.search_transactions(user_id, query)
        
        return {
            "success": True,
            "data": {
                "results": results,
                "count": len(results),
                "query": query
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/transactions/export")
async def export_transactions(
    request: Request,
    format: str = "json",
    start_date: Optional[float] = None,
    end_date: Optional[float] = None
):
    """Export transaction history in various formats"""
    try:
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        # Build filters for export
        filters = {}
        if start_date:
            filters["start_date"] = start_date
        if end_date:
            filters["end_date"] = end_date
        
        export_data = transaction_history_service.export_transactions(user_id, format, filters)
        
        return {
            "success": True,
            "data": export_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Multi-Wallet System Endpoints
@router.get("/multi-wallets")
async def get_user_wallets(request: Request):
    """Get all wallets for user"""
    try:
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        result = multi_wallet_service.get_user_wallets(user_id)
        
        if not result["success"]:
            # Initialize wallets if they don't exist
            # Get current balance from old wallet system
            current_balance = user_database.get(user_id, {}).get("wallet_balance", 0)
            user_data = user.copy()
            user_data["initial_balance"] = current_balance
            
            init_result = multi_wallet_service.initialize_user_wallets(user_id, user_data)
            if init_result["success"]:
                result = multi_wallet_service.get_user_wallets(user_id)
        
        return {
            "success": True,
            "data": result["data"] if result["success"] else {}
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/multi-wallets/transfer")
async def transfer_between_wallets(request: Request, transfer_data: Dict[str, Any]):
    """Transfer funds between user's wallets"""
    try:
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        result = multi_wallet_service.transfer_between_wallets(user_id, transfer_data)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "message": result["message"],
            "data": result["data"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/multi-wallets/auto-save")
async def set_auto_save_rule(request: Request, rule_data: Dict[str, Any]):
    """Set up automatic savings rule"""
    try:
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        result = multi_wallet_service.set_auto_save_rule(user_id, rule_data)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "message": result["message"],
            "data": result["data"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/multi-wallets/savings-goal")
async def create_savings_goal(request: Request, goal_data: Dict[str, Any]):
    """Create a savings goal"""
    try:
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        result = multi_wallet_service.create_savings_goal(user_id, goal_data)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "message": result["message"],
            "data": result["data"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/multi-wallets/contribute-goal/{goal_id}")
async def contribute_to_goal(request: Request, goal_id: str, contribution_data: Dict[str, Any]):
    """Contribute to a savings goal"""
    try:
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        amount = contribution_data["amount"]
        source_wallet = contribution_data.get("source_wallet", WalletType.MAIN)
        
        result = multi_wallet_service.contribute_to_goal(user_id, goal_id, amount, source_wallet)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "message": result["message"],
            "data": result["data"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/multi-wallets/calculate-interest")
async def calculate_daily_interest(request: Request):
    """Calculate and apply daily interest to savings wallet"""
    try:
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        result = multi_wallet_service.calculate_daily_interest(user_id)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "message": result["message"],
            "data": result["data"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/multi-wallets/analytics")
async def get_wallet_analytics(request: Request, wallet_type: Optional[str] = None):
    """Get analytics for user's wallets"""
    try:
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        result = multi_wallet_service.get_wallet_analytics(user_id, wallet_type)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "data": result["data"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Advanced Spray Money Endpoints
@router.post("/spray-money/advanced")
async def create_advanced_spray(request: Request, spray_data: Dict[str, Any]):
    """Create advanced spray with special effects"""
    try:
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        result = advanced_spray_money_service.create_advanced_spray(user_id, spray_data)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "message": result["message"],
            "data": result["data"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/spray-money/competition")
async def create_spray_competition(request: Request, competition_data: Dict[str, Any]):
    """Create a spray money competition"""
    try:
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        # Verify user is organizer
        if user["role"] != "organizer":
            raise HTTPException(status_code=403, detail="Only organizers can create competitions")
        
        result = advanced_spray_money_service.create_spray_competition(user_id, competition_data)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "message": result["message"],
            "data": result["data"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/spray-money/competition/{competition_id}/join")
async def join_spray_competition(request: Request, competition_id: str):
    """Join a spray money competition"""
    try:
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        result = advanced_spray_money_service.join_spray_competition(user_id, competition_id)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "message": result["message"],
            "data": result["data"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/spray-money/leaderboard/{event_id}")
async def get_enhanced_spray_leaderboard(
    request: Request,
    event_id: str,
    period: str = "all_time",
    limit: int = 10
):
    """Get enhanced spray money leaderboard"""
    try:
        result = advanced_spray_money_service.get_spray_leaderboard(event_id, period, limit)
        
        return {
            "success": True,
            "data": result["data"] if result["success"] else {}
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/spray-money/analytics/{event_id}")
async def get_spray_analytics(request: Request, event_id: str):
    """Get comprehensive spray money analytics"""
    try:
        user = await get_user_from_request(request)
        
        # Verify user has access to event analytics
        if user["role"] not in ["organizer", "admin"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        result = advanced_spray_money_service.get_spray_analytics(event_id)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "data": result["data"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/multi-wallets/reset-interest")
async def reset_interest_calculation(request: Request):
    """Reset interest calculation timestamp for testing purposes"""
    try:
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        result = multi_wallet_service.reset_interest_calculation(user_id)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "message": result["message"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))