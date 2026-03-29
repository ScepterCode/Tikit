"""
Enhanced Wallet Router with Security and Withdrawal Features
"""
from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel, validator
from typing import Optional, Dict, Any, List
from datetime import datetime
import time

# Import services
from services.wallet_security_service import wallet_security_service
from services.withdrawal_service import withdrawal_service, WithdrawalMethod
from services.flutterwave_withdrawal_service import flutterwave_withdrawal_service
from auth_utils import get_user_from_request, user_database

router = APIRouter(tags=["wallet"])

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
@router.get("/balance")
async def get_wallet_balance(request: Request):
    """Get user's wallet balance"""
    try:
        user = await get_user_from_request(request)
        user_id = user["user_id"]

        # Get balance from user database
        user_data = user_database.get(user_id)
        if not user_data:
            return {
                "success": True,
                "balance": 0.0,
                "currency": "NGN"
            }

        balance = user_data.get("wallet_balance", 0.0)

        return {
            "success": True,
            "balance": balance,
            "currency": "NGN",
            "formatted": f"₦{balance:,.2f}"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/fund")
async def fund_wallet(request: Request, fund_data: Dict[str, Any]):
    """Fund wallet via payment gateway"""
    try:
        user = await get_user_from_request(request)
        user_id = user["user_id"]

        amount = fund_data.get("amount", 0)
        if amount <= 0:
            raise HTTPException(status_code=400, detail="Invalid amount")

        # This would integrate with payment gateway
        # For now, return success to indicate endpoint exists
        return {
            "success": True,
            "message": "Wallet funding initiated",
            "amount": amount,
            "reference": f"FUND_{user_id}_{int(datetime.now().timestamp())}"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/transactions")
async def get_wallet_transactions(request: Request, limit: int = 20, offset: int = 0):
    """Get wallet transaction history"""
    try:
        user = await get_user_from_request(request)
        user_id = user["user_id"]

        # This would fetch from database
        # For now, return empty list to indicate endpoint exists
        return {
            "success": True,
            "transactions": [],
            "total": 0,
            "limit": limit,
            "offset": offset
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
    """Initiate wallet withdrawal - creates pending request, does NOT deduct balance yet"""
    try:
        user = await get_user_from_request(request)
        user_id = user.get("id") or user.get("user_id")
        user_email = user.get("email")
        
        print(f"🔍 Withdrawal request from: {user_email} (ID: {user_id})")
        print(f"   Amount: ₦{withdrawal_data.amount:,.2f}, Method: {withdrawal_data.method}")
        
        # Get Supabase client for balance check
        from database import supabase_client
        supabase = supabase_client.get_service_client()
        
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not available")
        
        # Get current balance
        user_result = supabase.table('users').select('wallet_balance').eq('id', user_id).execute()
        
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        current_balance = float(user_result.data[0].get('wallet_balance', 0))
        print(f"   Current balance: ₦{current_balance:,.2f}")
        
        # Check if sufficient balance (but DON'T deduct yet)
        if current_balance < withdrawal_data.amount:
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient balance. Available: ₦{current_balance:,.2f}"
            )
        
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
        
        # Verify PIN - auto-create default PIN if none exists
        if user_id not in wallet_security_service.transaction_pins:
            # Auto-create default PIN for development
            wallet_security_service.set_transaction_pin(user_id, "000000")
            print(f"✅ Auto-created default PIN for user: {user_id}")
        
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
        
        # Initiate withdrawal (creates pending request, does NOT deduct balance)
        result = withdrawal_service.initiate_withdrawal(user_id, withdrawal_data.dict())
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        print(f"✅ Withdrawal request created (PENDING - balance NOT deducted yet)")
        print(f"   Reference: {result['withdrawal']['reference']}")
        print(f"   Status: {result['withdrawal']['status']}")
        
        # Record transaction as PENDING (balance will be deducted when confirmed)
        try:
            payment_record = {
                'user_id': user_id,
                'amount': -withdrawal_data.amount,  # Negative for withdrawal
                'payment_method': withdrawal_data.method,
                'transaction_reference': result["withdrawal"]["reference"],
                'status': 'pending',  # PENDING - not completed yet
                'payment_type': 'withdrawal',
                'created_at': time.time()
            }
            supabase.table('payments').insert(payment_record).execute()
            print(f"✅ Withdrawal transaction recorded as PENDING")
        except Exception as e:
            print(f"⚠️  Could not create transaction record: {e}")
        
        return {
            "success": True,
            "message": "Withdrawal request submitted. You will be contacted to confirm your bank details.",
            "withdrawal": result["withdrawal"],
            "next_steps": result["next_steps"],
            "current_balance": current_balance,  # Balance unchanged
            "note": "Your balance will be deducted once the withdrawal is processed and confirmed."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Withdrawal error: {e}")
        import traceback
        traceback.print_exc()
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


# ============================================================================
# FLUTTERWAVE WITHDRAWAL ENDPOINTS
# ============================================================================

@router.get("/banks")
async def get_nigerian_banks():
    """Get list of Nigerian banks for withdrawal"""
    try:
        result = flutterwave_withdrawal_service.get_nigerian_banks()
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return {
            "success": True,
            "data": {
                "banks": result["banks"],
                "count": result["count"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify-bank-account")
async def verify_bank_account(request: Request, account_data: Dict[str, Any]):
    """Verify bank account before withdrawal"""
    try:
        account_number = account_data.get("account_number")
        bank_code = account_data.get("bank_code")
        
        if not account_number or not bank_code:
            raise HTTPException(
                status_code=400,
                detail="Account number and bank code are required"
            )
        
        result = flutterwave_withdrawal_service.verify_bank_account(
            account_number, 
            bank_code
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "data": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/withdraw-flutterwave")
async def withdraw_with_flutterwave(request: Request, withdrawal_data: Dict[str, Any]):
    """
    Process withdrawal using Flutterwave Transfer API
    Flutterwave automatically verifies the account during transfer
    """
    try:
        user = await get_user_from_request(request)
        user_id = user.get("id") or user.get("user_id")
        user_email = user.get("email")
        
        # Extract withdrawal details
        amount = float(withdrawal_data.get("amount", 0))
        account_number = withdrawal_data.get("account_number")
        bank_code = withdrawal_data.get("bank_code")
        pin = withdrawal_data.get("pin", "000000")
        
        print(f"🔍 Flutterwave withdrawal request from: {user_email}")
        print(f"   Amount: ₦{amount:,.2f}")
        print(f"   Account: {account_number}, Bank: {bank_code}")
        
        # Validate inputs
        if not amount or amount <= 0:
            raise HTTPException(status_code=400, detail="Invalid amount")
        
        if not account_number or len(account_number) != 10:
            raise HTTPException(
                status_code=400,
                detail="Account number must be 10 digits"
            )
        
        if not bank_code:
            raise HTTPException(
                status_code=400,
                detail="Bank selection is required"
            )
        
        # Get Supabase client
        from database import supabase_client
        supabase = supabase_client.get_service_client()
        
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not available")
        
        # Get current balance
        user_result = supabase.table('users').select('wallet_balance').eq('id', user_id).execute()
        
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        current_balance = float(user_result.data[0].get('wallet_balance', 0))
        print(f"   Current balance: ₦{current_balance:,.2f}")
        
        # Check minimum withdrawal
        if amount < 100:
            raise HTTPException(
                status_code=400,
                detail="Minimum withdrawal amount is ₦100"
            )
        
        # Check if sufficient balance
        if current_balance < amount:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient balance. Available: ₦{current_balance:,.2f}"
            )
        
        # Verify PIN
        if user_id not in wallet_security_service.transaction_pins:
            wallet_security_service.set_transaction_pin(user_id, "000000")
            print(f"✅ Auto-created default PIN for user: {user_id}")
        
        if not wallet_security_service.verify_pin(user_id, pin):
            wallet_security_service.record_failed_attempt(user_id, "pin")
            raise HTTPException(status_code=401, detail="Invalid transaction PIN")
        
        # BUG FIX #2: Check Flutterwave account balance before accepting withdrawal
        print(f"🔍 Checking Flutterwave account balance...")
        flutterwave_balance_result = flutterwave_withdrawal_service.get_account_balance()
        
        if not flutterwave_balance_result['success']:
            print(f"⚠️  Could not verify Flutterwave balance")
            raise HTTPException(
                status_code=503,
                detail="Withdrawal service temporarily unavailable. Please try again later."
            )
        
        flutterwave_available = flutterwave_balance_result['available']
        flutterwave_ledger = flutterwave_balance_result.get('ledger', 0)
        print(f"   Flutterwave available balance: ₦{flutterwave_available:,.2f}")
        print(f"   Flutterwave collection balance: ₦{flutterwave_ledger:,.2f}")
        
        # Check if sufficient balance in Flutterwave account (including fee)
        transfer_fee = 10.75  # Flutterwave standard fee
        total_required = amount + transfer_fee
        
        if flutterwave_available < total_required:
            if flutterwave_ledger >= total_required:
                print(f"⚠️  Funds in collection balance need to be settled to available balance")
                raise HTTPException(
                    status_code=503,
                    detail=f"Funds are in collection balance (₦{flutterwave_ledger:,.2f}). Please settle funds to available balance on Flutterwave dashboard, then try again."
                )
            else:
                print(f"❌ Insufficient Flutterwave balance: Need ₦{total_required:,.2f}, Have ₦{flutterwave_available:,.2f}")
                raise HTTPException(
                    status_code=503,
                    detail="Withdrawal service temporarily unavailable. Please contact support or try again later."
                )
        
        print(f"✅ Flutterwave balance sufficient: ₦{flutterwave_available:,.2f} >= ₦{total_required:,.2f}")
        
        # Initiate Flutterwave transfer
        # Flutterwave will verify the account automatically during transfer
        transfer_data = {
            'amount': amount,
            'account_number': account_number,
            'bank_code': bank_code,
            'narration': f'Grooovy Wallet Withdrawal - {user_email}'
        }
        
        print(f"🔄 Initiating Flutterwave transfer (with automatic verification)...")
        transfer_result = flutterwave_withdrawal_service.initiate_transfer(transfer_data)
        
        if not transfer_result["success"]:
            error_msg = transfer_result['error']
            print(f"❌ Transfer failed: {error_msg}")
            
            # Provide user-friendly error messages
            if 'account' in error_msg.lower() or 'invalid' in error_msg.lower():
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid bank account details. Please check your account number and bank selection. ({error_msg})"
                )
            elif 'whitelist' in error_msg.lower() or 'ip' in error_msg.lower():
                raise HTTPException(
                    status_code=400,
                    detail=f"Transfer blocked: {error_msg}. Please contact support to whitelist your IP address."
                )
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Transfer failed: {error_msg}"
                )
        
        # CRITICAL: Check the actual transfer status before deducting balance
        transfer_status = transfer_result.get('status', '').upper()
        transfer_id = transfer_result.get('transfer_id')
        
        print(f"📊 Transfer Status: {transfer_status}")
        print(f"📊 Transfer ID: {transfer_id}")
        
        # ONLY deduct balance if transfer is SUCCESSFUL or PENDING (actively processing)
        # Do NOT deduct for NEW (just queued), FAILED, or unknown status
        if transfer_status not in ['SUCCESSFUL', 'PENDING']:
            # Transfer not confirmed - do NOT deduct balance
            error_msg = transfer_result.get('complete_message', 'Transfer not confirmed')
            print(f"❌ Transfer not confirmed: {transfer_status} - {error_msg}")
            
            if transfer_status == 'NEW':
                raise HTTPException(
                    status_code=400,
                    detail=f"Transfer queued but not processed. This usually means IP whitelisting is required. Your balance has NOT been deducted. Please contact support."
                )
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Transfer failed: {error_msg}. Your balance has NOT been deducted."
                )
        
        # Transfer is confirmed as processing or successful
        print(f"✅ Transfer confirmed with status: {transfer_status}")
        
        # Deduct from wallet ONLY after confirming transfer is processing
        new_balance = current_balance - amount
        supabase.table('users').update({
            'wallet_balance': new_balance
        }).eq('id', user_id).execute()
        
        account_name = transfer_result.get('full_name', 'Account Holder')
        
        print(f"✅ Withdrawal successful: ₦{amount:,.2f}")
        print(f"   Sent to: {account_name}")
        print(f"   New balance: ₦{new_balance:,.2f}")
        print(f"   Transfer ID: {transfer_result['transfer_id']}")
        
        # Record transaction
        try:
            payment_record = {
                'user_id': user_id,
                'amount': -amount,
                'payment_method': 'flutterwave_transfer',
                'transaction_reference': transfer_result['reference'],
                'status': 'completed',
                'payment_type': 'withdrawal',
                'created_at': time.time()
            }
            supabase.table('payments').insert(payment_record).execute()
            print(f"✅ Withdrawal transaction recorded")
        except Exception as e:
            print(f"⚠️  Could not create transaction record: {e}")
        
        return {
            "success": True,
            "message": f"₦{amount:,.2f} successfully sent to {account_name}",
            "data": {
                "transfer_id": transfer_result['transfer_id'],
                "reference": transfer_result['reference'],
                "amount": amount,
                "fee": transfer_result.get('fee', 0),
                "account_name": account_name,
                "account_number": account_number,
                "new_balance": new_balance,
                "status": transfer_result['status']
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Flutterwave withdrawal error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/transfer-fee")
async def get_transfer_fee(amount: float):
    """Get Flutterwave transfer fee for withdrawal amount"""
    try:
        result = flutterwave_withdrawal_service.get_transfer_fee(amount)
        
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/my-ip")
async def get_my_server_ip():
    """
    Get the public IP address of this server
    Useful for finding out what IP to whitelist on Flutterwave
    """
    try:
        import requests
        
        # Get IP from external service
        response = requests.get('https://api.ipify.org?format=json', timeout=10)
        data = response.json()
        
        return {
            "success": True,
            "ip": data['ip'],
            "note": "This is the IP address that Flutterwave sees when this server makes API calls",
            "action": "Whitelist this IP on Flutterwave Dashboard → Settings → Whitelisted IP addresses"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "note": "Could not determine server IP"
        }

# ============================================================================
# BUG FIX #3: WEBHOOK FOR FAILED TRANSFERS
# ============================================================================

@router.post("/webhook/flutterwave")
async def flutterwave_webhook(request: Request):
    """
    Handle Flutterwave webhook notifications for transfer status updates
    This automatically refunds users if transfers fail
    """
    try:
        # Get webhook data
        webhook_data = await request.json()
        
        print(f"🔔 Flutterwave webhook received:")
        print(f"   Event: {webhook_data.get('event')}")
        
        event_type = webhook_data.get('event')
        
        # Handle transfer completion events
        if event_type == 'transfer.completed':
            transfer_data = webhook_data.get('data', {})
            transfer_id = transfer_data.get('id')
            status = transfer_data.get('status')
            reference = transfer_data.get('reference')
            amount = float(transfer_data.get('amount', 0))
            
            print(f"   Transfer ID: {transfer_id}")
            print(f"   Status: {status}")
            print(f"   Reference: {reference}")
            print(f"   Amount: ₦{amount:,.2f}")
            
            # Get Supabase client
            from database import supabase_client
            supabase = supabase_client.get_service_client()
            
            if not supabase:
                print(f"❌ Database not available")
                return {"success": False, "error": "Database not available"}
            
            # Find the payment record
            payment_result = supabase.table('payments').select('*').eq('transaction_reference', reference).execute()
            
            if not payment_result.data:
                print(f"⚠️  Payment record not found for reference: {reference}")
                return {"success": True, "message": "Payment record not found"}
            
            payment = payment_result.data[0]
            user_id = payment['user_id']
            payment_amount = abs(float(payment['amount']))
            
            # If transfer failed, refund the user
            if status in ['FAILED', 'REVERSED']:
                print(f"❌ Transfer failed - refunding user {user_id}")
                
                # Get user's current balance
                user_result = supabase.table('users').select('wallet_balance, email').eq('id', user_id).execute()
                
                if user_result.data:
                    current_balance = float(user_result.data[0]['wallet_balance'])
                    user_email = user_result.data[0]['email']
                    refund_balance = current_balance + payment_amount
                    
                    # Refund the balance
                    supabase.table('users').update({
                        'wallet_balance': refund_balance
                    }).eq('id', user_id).execute()
                    
                    # Update payment status
                    supabase.table('payments').update({
                        'status': 'refunded'
                    }).eq('transaction_reference', reference).execute()
                    
                    print(f"✅ Refunded ₦{payment_amount:,.2f} to {user_email}")
                    print(f"   Previous balance: ₦{current_balance:,.2f}")
                    print(f"   New balance: ₦{refund_balance:,.2f}")
                    
                    # Create refund transaction record
                    try:
                        refund_record = {
                            'user_id': user_id,
                            'amount': payment_amount,
                            'payment_method': 'refund',
                            'transaction_reference': f"REFUND_{reference}",
                            'status': 'completed',
                            'payment_type': 'refund',
                            'created_at': time.time()
                        }
                        supabase.table('payments').insert(refund_record).execute()
                        print(f"✅ Refund transaction recorded")
                    except Exception as e:
                        print(f"⚠️  Could not create refund record: {e}")
                    
                    return {
                        "success": True,
                        "message": "User refunded successfully",
                        "refund_amount": payment_amount
                    }
                else:
                    print(f"❌ User not found: {user_id}")
                    return {"success": False, "error": "User not found"}
            
            # If transfer succeeded, update payment status
            elif status == 'SUCCESSFUL':
                print(f"✅ Transfer successful - updating payment status")
                
                supabase.table('payments').update({
                    'status': 'completed'
                }).eq('transaction_reference', reference).execute()
                
                return {
                    "success": True,
                    "message": "Payment status updated"
                }
            
            # For other statuses (PENDING, NEW), do nothing
            else:
                print(f"ℹ️  Transfer status: {status} - no action needed")
                return {
                    "success": True,
                    "message": f"Status {status} acknowledged"
                }
        
        # Handle other webhook events
        else:
            print(f"ℹ️  Unhandled event type: {event_type}")
            return {
                "success": True,
                "message": f"Event {event_type} acknowledged"
            }
        
    except Exception as e:
        print(f"❌ Webhook error: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e)
        }

# ============================================================================
# WALLET-TO-WALLET TRANSFER (Send Money Feature)
# ============================================================================

class TransferRequest(BaseModel):
    amount: float
    recipient: str  # Can be email, phone, or user_id
    description: Optional[str] = "Money transfer"
    transfer_type: str = "external"
    
    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be positive')
        if v < 10:
            raise ValueError('Minimum transfer amount is ₦10')
        return v

@router.post("/unified/transfer")
async def transfer_money(request: Request, transfer_data: TransferRequest):
    """
    Transfer money to another user (wallet-to-wallet transfer)
    """
    try:
        user = await get_user_from_request(request)
        sender_id = user.get("id") or user.get("user_id")
        sender_email = user.get("email")
        
        print(f"🔍 Transfer request from: {sender_email}")
        print(f"   Amount: ₦{transfer_data.amount:,.2f}")
        print(f"   Recipient: {transfer_data.recipient}")
        
        # Get Supabase client
        from database import supabase_client
        supabase = supabase_client.get_service_client()
        
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not available")
        
        # Get sender's balance
        sender_result = supabase.table('users').select('wallet_balance, email').eq('id', sender_id).execute()
        
        if not sender_result.data:
            raise HTTPException(status_code=404, detail="Sender not found")
        
        sender_balance = float(sender_result.data[0].get('wallet_balance', 0))
        
        # Check if sufficient balance
        if sender_balance < transfer_data.amount:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient balance. Available: ₦{sender_balance:,.2f}"
            )
        
        # Find recipient by email, phone, or user_id
        recipient_query = supabase.table('users').select('id, email, wallet_balance')
        
        # Try to find by email first
        if '@' in transfer_data.recipient:
            recipient_result = recipient_query.eq('email', transfer_data.recipient).execute()
        # Try by phone number
        elif transfer_data.recipient.replace('+', '').replace('-', '').replace(' ', '').isdigit():
            recipient_result = recipient_query.eq('phone', transfer_data.recipient).execute()
        # Try by user_id
        else:
            recipient_result = recipient_query.eq('id', transfer_data.recipient).execute()
        
        if not recipient_result.data:
            raise HTTPException(
                status_code=404,
                detail=f"Recipient not found: {transfer_data.recipient}"
            )
        
        recipient = recipient_result.data[0]
        recipient_id = recipient['id']
        recipient_email = recipient['email']
        recipient_balance = float(recipient.get('wallet_balance', 0))
        
        # Prevent self-transfer
        if sender_id == recipient_id:
            raise HTTPException(
                status_code=400,
                detail="Cannot transfer money to yourself"
            )
        
        print(f"   Recipient found: {recipient_email}")
        print(f"   Sender balance: ₦{sender_balance:,.2f}")
        print(f"   Recipient balance: ₦{recipient_balance:,.2f}")
        
        # Perform transfer (deduct from sender, add to recipient)
        new_sender_balance = sender_balance - transfer_data.amount
        new_recipient_balance = recipient_balance + transfer_data.amount
        
        # Update sender balance
        supabase.table('users').update({
            'wallet_balance': new_sender_balance
        }).eq('id', sender_id).execute()
        
        # Update recipient balance
        supabase.table('users').update({
            'wallet_balance': new_recipient_balance
        }).eq('id', recipient_id).execute()
        
        # Generate transaction reference
        import uuid
        tx_ref = f"TRF_{uuid.uuid4().hex[:12]}_{int(time.time())}"
        
        # Record transaction for sender (debit)
        try:
            sender_payment = {
                'user_id': sender_id,
                'amount': -transfer_data.amount,
                'payment_method': 'wallet_transfer',
                'transaction_reference': tx_ref,
                'status': 'completed',
                'payment_type': 'transfer_out',
                'created_at': time.time()
            }
            supabase.table('payments').insert(sender_payment).execute()
        except Exception as e:
            print(f"⚠️  Could not create sender transaction record: {e}")
        
        # Record transaction for recipient (credit)
        try:
            recipient_payment = {
                'user_id': recipient_id,
                'amount': transfer_data.amount,
                'payment_method': 'wallet_transfer',
                'transaction_reference': tx_ref,
                'status': 'completed',
                'payment_type': 'transfer_in',
                'created_at': time.time()
            }
            supabase.table('payments').insert(recipient_payment).execute()
        except Exception as e:
            print(f"⚠️  Could not create recipient transaction record: {e}")
        
        print(f"✅ Transfer successful!")
        print(f"   Sender new balance: ₦{new_sender_balance:,.2f}")
        print(f"   Recipient new balance: ₦{new_recipient_balance:,.2f}")
        
        return {
            "success": True,
            "message": f"₦{transfer_data.amount:,.2f} sent successfully to {recipient_email}",
            "data": {
                "transaction_reference": tx_ref,
                "amount": transfer_data.amount,
                "recipient_email": recipient_email,
                "sender_new_balance": new_sender_balance,
                "recipient_new_balance": new_recipient_balance,
                "description": transfer_data.description,
                "timestamp": time.time()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Transfer error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
