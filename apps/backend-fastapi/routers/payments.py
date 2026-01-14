"""
Payment Routes
Handles payment processing, wallet management, and financial transactions
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import List, Optional
import logging
from datetime import datetime, timedelta

from models.payment_schemas import (
    PaymentRequest, PaymentResponse, WalletBalance, 
    TransactionHistory, RefundRequest, PaymentMethod
)
from services.payment_service import PaymentService
from middleware.auth import get_current_user, require_role
from services.supabase_client import supabase_service

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/process", response_model=PaymentResponse)
async def process_payment(
    payment_request: PaymentRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Process a payment for tickets or services"""
    try:
        payment_service = PaymentService()
        
        # Validate payment request
        if payment_request.amount <= 0:
            raise HTTPException(
                status_code=400,
                detail="Payment amount must be greater than zero"
            )
        
        # Check user wallet balance if using wallet payment
        if payment_request.payment_method == "wallet":
            user = await supabase_service.get_user_by_id(current_user["user_id"])
            if not user or user["wallet_balance"] < payment_request.amount:
                raise HTTPException(
                    status_code=400,
                    detail="Insufficient wallet balance"
                )
        
        # Process payment
        result = await payment_service.process_payment(
            user_id=current_user["user_id"],
            amount=payment_request.amount,
            payment_method=payment_request.payment_method,
            reference=payment_request.reference,
            metadata=payment_request.metadata
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=400,
                detail=result["message"]
            )
        
        # Send confirmation email/SMS in background
        background_tasks.add_task(
            payment_service.send_payment_confirmation,
            current_user["user_id"],
            result["transaction_id"]
        )
        
        return PaymentResponse(
            success=True,
            transaction_id=result["transaction_id"],
            reference=result["reference"],
            amount=payment_request.amount,
            status="completed",
            payment_method=payment_request.payment_method,
            message="Payment processed successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Payment processing error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Payment processing failed"
        )

@router.get("/wallet/balance", response_model=WalletBalance)
async def get_wallet_balance(current_user: dict = Depends(get_current_user)):
    """Get user's wallet balance"""
    try:
        user = await supabase_service.get_user_by_id(current_user["user_id"])
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return WalletBalance(
            user_id=current_user["user_id"],
            balance=user.get("wallet_balance", 0),
            currency="NGN",
            last_updated=user.get("updated_at", datetime.utcnow())
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Wallet balance error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve wallet balance"
        )

@router.post("/wallet/topup")
async def topup_wallet(
    amount: float,
    payment_method: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Top up user's wallet"""
    try:
        if amount <= 0:
            raise HTTPException(
                status_code=400,
                detail="Top-up amount must be greater than zero"
            )
        
        payment_service = PaymentService()
        
        # Process wallet top-up
        result = await payment_service.topup_wallet(
            user_id=current_user["user_id"],
            amount=amount,
            payment_method=payment_method
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=400,
                detail=result["message"]
            )
        
        # Send confirmation
        background_tasks.add_task(
            payment_service.send_topup_confirmation,
            current_user["user_id"],
            amount
        )
        
        return {
            "success": True,
            "message": "Wallet topped up successfully",
            "transaction_id": result["transaction_id"],
            "new_balance": result["new_balance"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Wallet top-up error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Wallet top-up failed"
        )

@router.get("/transactions", response_model=List[TransactionHistory])
async def get_transaction_history(
    limit: int = 20,
    offset: int = 0,
    transaction_type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get user's transaction history"""
    try:
        payment_service = PaymentService()
        
        transactions = await payment_service.get_transaction_history(
            user_id=current_user["user_id"],
            limit=limit,
            offset=offset,
            transaction_type=transaction_type
        )
        
        return [
            TransactionHistory(
                id=tx["id"],
                user_id=tx["user_id"],
                amount=tx["amount"],
                transaction_type=tx["transaction_type"],
                status=tx["status"],
                reference=tx["reference"],
                payment_method=tx["payment_method"],
                description=tx.get("description", ""),
                created_at=tx["created_at"],
                metadata=tx.get("metadata", {})
            )
            for tx in transactions
        ]
        
    except Exception as e:
        logger.error(f"Transaction history error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve transaction history"
        )

@router.post("/refund")
async def request_refund(
    refund_request: RefundRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Request a refund for a transaction"""
    try:
        payment_service = PaymentService()
        
        # Validate refund request
        result = await payment_service.process_refund(
            user_id=current_user["user_id"],
            transaction_id=refund_request.transaction_id,
            amount=refund_request.amount,
            reason=refund_request.reason
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=400,
                detail=result["message"]
            )
        
        # Send refund confirmation
        background_tasks.add_task(
            payment_service.send_refund_confirmation,
            current_user["user_id"],
            result["refund_id"]
        )
        
        return {
            "success": True,
            "message": "Refund request processed successfully",
            "refund_id": result["refund_id"],
            "status": result["status"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Refund request error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Refund request failed"
        )

@router.get("/methods", response_model=List[PaymentMethod])
async def get_payment_methods():
    """Get available payment methods"""
    try:
        payment_service = PaymentService()
        methods = await payment_service.get_available_payment_methods()
        
        return [
            PaymentMethod(
                id=method["id"],
                name=method["name"],
                type=method["type"],
                enabled=method["enabled"],
                fees=method.get("fees", {}),
                limits=method.get("limits", {}),
                description=method.get("description", "")
            )
            for method in methods
        ]
        
    except Exception as e:
        logger.error(f"Payment methods error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve payment methods"
        )

@router.post("/webhook/paystack")
async def paystack_webhook(request_data: dict, background_tasks: BackgroundTasks):
    """Handle Paystack webhook notifications"""
    try:
        payment_service = PaymentService()
        
        # Verify webhook signature
        if not await payment_service.verify_paystack_webhook(request_data):
            raise HTTPException(
                status_code=400,
                detail="Invalid webhook signature"
            )
        
        # Process webhook event
        background_tasks.add_task(
            payment_service.process_paystack_webhook,
            request_data
        )
        
        return {"status": "success"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Paystack webhook error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Webhook processing failed"
        )

@router.post("/webhook/flutterwave")
async def flutterwave_webhook(request_data: dict, background_tasks: BackgroundTasks):
    """Handle Flutterwave webhook notifications"""
    try:
        payment_service = PaymentService()
        
        # Verify webhook signature
        if not await payment_service.verify_flutterwave_webhook(request_data):
            raise HTTPException(
                status_code=400,
                detail="Invalid webhook signature"
            )
        
        # Process webhook event
        background_tasks.add_task(
            payment_service.process_flutterwave_webhook,
            request_data
        )
        
        return {"status": "success"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Flutterwave webhook error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Webhook processing failed"
        )

@router.get("/analytics", dependencies=[Depends(require_role(["admin", "organizer"]))])
async def get_payment_analytics(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get payment analytics (admin/organizer only)"""
    try:
        payment_service = PaymentService()
        
        # Set default date range if not provided
        if not end_date:
            end_date = datetime.utcnow()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        
        analytics = await payment_service.get_payment_analytics(
            start_date=start_date,
            end_date=end_date,
            user_id=current_user["user_id"] if current_user["role"] == "organizer" else None
        )
        
        return analytics
        
    except Exception as e:
        logger.error(f"Payment analytics error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve payment analytics"
        )