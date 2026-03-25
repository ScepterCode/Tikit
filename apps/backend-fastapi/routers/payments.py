"""
Payment Processing Router
Handles all payment methods including Paystack, wallet, bank transfer, USSD, and airtime
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional, Dict, Any
import uuid
import hashlib
import hmac
import os
from datetime import datetime, timedelta

from services.payment_service import payment_service
from services.booking_service import booking_service
from services.notification_service import notification_service
from middleware.auth import get_current_user
from config import config

router = APIRouter()

class WalletPaymentRequest(BaseModel):
    amount: int  # Amount in kobo
    reference: str
    event_id: str
    ticket_details: Dict[str, Any]

class BankTransferRequest(BaseModel):
    amount: int
    reference: str
    event_id: str
    ticket_details: Dict[str, Any]

class USSDPaymentRequest(BaseModel):
    amount: int
    reference: str
    event_id: str
    bank: str = "gtb"

class AirtimePaymentRequest(BaseModel):
    amount: int
    reference: str
    event_id: str
    phone: str

class PaymentVerificationRequest(BaseModel):
    reference: str

@router.post("/wallet")
async def process_wallet_payment(
    request: WalletPaymentRequest,
    current_user: dict = Depends(get_current_user)
):
    """Process wallet payment"""
    try:
        user_id = current_user["user_id"]
        
        # Check wallet balance
        current_balance = await payment_service.calculate_user_balance(user_id)
        required_amount = request.amount / 100  # Convert kobo to naira
        
        if current_balance < required_amount:
            raise HTTPException(
                status_code=400,
                detail={
                    "success": False,
                    "error": {
                        "code": "INSUFFICIENT_BALANCE",
                        "message": f"Insufficient wallet balance. Required: ₦{required_amount:,.2f}, Available: ₦{current_balance:,.2f}"
                    }
                }
            )
        
        # Create payment record
        payment_data = await payment_service.create_payment(
            user_id=user_id,
            amount=request.amount,
            method="wallet",
            provider="internal"
        )
        
        if not payment_data:
            raise HTTPException(
                status_code=500,
                detail={
                    "success": False,
                    "error": {
                        "code": "PAYMENT_CREATION_FAILED",
                        "message": "Failed to create payment record"
                    }
                }
            )
        
        # Update payment status to completed (wallet payments are instant)
        await payment_service.update_payment_status(
            payment_data["id"], 
            "completed",
            {"reference": request.reference, "processed_at": datetime.now().isoformat()}
        )
        
        # Create booking
        booking_data = await booking_service.create_booking(
            user_id=user_id,
            event_id=request.event_id,
            quantity=request.ticket_details.get("quantity", 1),
            total_amount=required_amount,
            payment_method="wallet"
        )
        
        # Send notification
        await notification_service.create_notification(
            user_id=user_id,
            title="Payment Successful",
            message=f"Your wallet payment of ₦{required_amount:,.2f} has been processed successfully.",
            notification_type="payment_success",
            event_id=request.event_id
        )
        
        return {
            "success": True,
            "transaction_id": payment_data["id"],
            "booking_id": booking_data["id"] if booking_data else None,
            "message": "Wallet payment processed successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": {
                    "code": "WALLET_PAYMENT_ERROR",
                    "message": str(e)
                }
            }
        )

@router.post("/bank-transfer")
async def initiate_bank_transfer(
    request: BankTransferRequest,
    current_user: dict = Depends(get_current_user)
):
    """Initiate bank transfer payment"""
    try:
        user_id = current_user["user_id"]
        
        # Create payment record
        payment_data = await payment_service.create_payment(
            user_id=user_id,
            amount=request.amount,
            method="bank_transfer",
            provider="manual"
        )
        
        # Generate virtual account details (in production, integrate with bank API)
        bank_details = {
            "bank_name": "GTBank",
            "account_number": f"90{str(uuid.uuid4().int)[:8]}",  # Generate virtual account
            "account_name": "Tikit Payments",
            "reference": request.reference,
            "amount": request.amount / 100,
            "expires_at": (datetime.now() + timedelta(hours=24)).isoformat()
        }
        
        # Update payment with bank details
        await payment_service.update_payment_status(
            payment_data["id"],
            "pending",
            {"bank_details": bank_details, "reference": request.reference}
        )
        
        return {
            "success": True,
            "payment_id": payment_data["id"],
            "bank_details": bank_details,
            "message": "Bank transfer details generated. Please complete transfer within 24 hours."
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": {
                    "code": "BANK_TRANSFER_ERROR",
                    "message": str(e)
                }
            }
        )

@router.post("/ussd")
async def initiate_ussd_payment(
    request: USSDPaymentRequest,
    current_user: dict = Depends(get_current_user)
):
    """Initiate USSD payment"""
    try:
        user_id = current_user["user_id"]
        
        # Create payment record
        payment_data = await payment_service.create_payment(
            user_id=user_id,
            amount=request.amount,
            method="ussd",
            provider=request.bank
        )
        
        # Generate USSD code based on bank
        ussd_codes = {
            "gtb": f"*737*000*{request.amount//100}*{request.reference[-6:]}#",
            "access": f"*901*000*{request.amount//100}*{request.reference[-6:]}#",
            "zenith": f"*966*000*{request.amount//100}*{request.reference[-6:]}#",
            "uba": f"*919*000*{request.amount//100}*{request.reference[-6:]}#"
        }
        
        ussd_code = ussd_codes.get(request.bank, ussd_codes["gtb"])
        
        # Update payment with USSD details
        await payment_service.update_payment_status(
            payment_data["id"],
            "pending",
            {"ussd_code": ussd_code, "bank": request.bank, "reference": request.reference}
        )
        
        return {
            "success": True,
            "payment_id": payment_data["id"],
            "ussd_code": ussd_code,
            "bank": request.bank,
            "instructions": f"Dial {ussd_code} on your phone and follow the prompts",
            "message": "USSD code generated. Please dial the code to complete payment."
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": {
                    "code": "USSD_PAYMENT_ERROR",
                    "message": str(e)
                }
            }
        )

@router.post("/airtime")
async def process_airtime_payment(
    request: AirtimePaymentRequest,
    current_user: dict = Depends(get_current_user)
):
    """Process airtime payment"""
    try:
        user_id = current_user["user_id"]
        
        # Validate airtime payment limits
        amount_naira = request.amount / 100
        if amount_naira > 10000:
            raise HTTPException(
                status_code=400,
                detail={
                    "success": False,
                    "error": {
                        "code": "AMOUNT_EXCEEDS_LIMIT",
                        "message": "Airtime payments are limited to ₦10,000"
                    }
                }
            )
        
        # Create payment record
        payment_data = await payment_service.create_payment(
            user_id=user_id,
            amount=request.amount,
            method="airtime",
            provider="africastalking"  # or other airtime provider
        )
        
        # In production, integrate with airtime API (Africa's Talking, etc.)
        # For now, simulate successful airtime deduction
        
        # Update payment status to completed
        await payment_service.update_payment_status(
            payment_data["id"],
            "completed",
            {
                "reference": request.reference,
                "phone": request.phone,
                "processed_at": datetime.now().isoformat()
            }
        )
        
        # Send notification
        await notification_service.create_notification(
            user_id=user_id,
            title="Airtime Payment Successful",
            message=f"Your airtime payment of ₦{amount_naira:,.2f} has been processed successfully.",
            notification_type="payment_success"
        )
        
        return {
            "success": True,
            "transaction_id": payment_data["id"],
            "message": "Airtime payment processed successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": {
                    "code": "AIRTIME_PAYMENT_ERROR",
                    "message": str(e)
                }
            }
        )

@router.post("/verify")
async def verify_payment(
    request: PaymentVerificationRequest,
    current_user: dict = Depends(get_current_user)
):
    """Verify payment status (mainly for Paystack and other external providers)"""
    try:
        # In production, verify with Paystack API
        paystack_secret = config.PAYSTACK_SECRET_KEY
        
        if not paystack_secret:
            raise HTTPException(
                status_code=500,
                detail={
                    "success": False,
                    "error": {
                        "code": "PAYSTACK_NOT_CONFIGURED",
                        "message": "Payment verification not available"
                    }
                }
            )
        
        # Simulate Paystack verification
        # In production: make API call to https://api.paystack.co/transaction/verify/{reference}
        
        # For now, return success for demo purposes
        return {
            "success": True,
            "status": "success",
            "transaction_id": str(uuid.uuid4()),
            "amount": 0,  # Would come from Paystack response
            "reference": request.reference,
            "message": "Payment verified successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": {
                    "code": "VERIFICATION_ERROR",
                    "message": str(e)
                }
            }
        )

@router.post("/webhook/paystack")
async def paystack_webhook(request: Request):
    """Handle Paystack webhook notifications"""
    try:
        # Verify webhook signature
        paystack_secret = config.PAYSTACK_SECRET_KEY
        if not paystack_secret:
            raise HTTPException(status_code=400, detail="Webhook not configured")
        
        signature = request.headers.get("x-paystack-signature")
        body = await request.body()
        
        # Verify signature
        expected_signature = hmac.new(
            paystack_secret.encode('utf-8'),
            body,
            hashlib.sha512
        ).hexdigest()
        
        if signature != expected_signature:
            raise HTTPException(status_code=400, detail="Invalid signature")
        
        # Process webhook data
        import json
        data = json.loads(body)
        
        if data.get("event") == "charge.success":
            # Handle successful payment
            transaction_data = data.get("data", {})
            reference = transaction_data.get("reference")
            amount = transaction_data.get("amount")
            status = transaction_data.get("status")
            
            # Update payment record in database
            # This would involve finding the payment by reference and updating status
            
            return {"success": True, "message": "Webhook processed"}
        
        return {"success": True, "message": "Webhook received"}
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": {
                    "code": "WEBHOOK_ERROR",
                    "message": str(e)
                }
            }
        )

@router.get("/methods")
async def get_payment_methods():
    """Get available payment methods and their configurations"""
    return {
        "success": True,
        "methods": [
            {
                "id": "wallet",
                "name": "Wallet",
                "description": "Pay from your Tikit wallet",
                "icon": "💳",
                "fee_percentage": 0,
                "fee_fixed": 0,
                "available": True
            },
            {
                "id": "card",
                "name": "Debit/Credit Card",
                "description": "Visa, Mastercard, Verve",
                "icon": "💳",
                "fee_percentage": 1.5,
                "fee_fixed": 0,
                "available": bool(config.PAYSTACK_PUBLIC_KEY)
            },
            {
                "id": "bank_transfer",
                "name": "Bank Transfer",
                "description": "Direct bank transfer",
                "icon": "🏦",
                "fee_percentage": 0,
                "fee_fixed": 50,
                "available": True
            },
            {
                "id": "ussd",
                "name": "USSD",
                "description": "Pay with *737# or *901#",
                "icon": "📱",
                "fee_percentage": 0,
                "fee_fixed": 0,
                "available": True
            },
            {
                "id": "airtime",
                "name": "Airtime",
                "description": "Pay with airtime balance (max ₦10,000)",
                "icon": "📞",
                "fee_percentage": 5,
                "fee_fixed": 0,
                "available": True,
                "limits": {
                    "max_amount": 1000000  # ₦10,000 in kobo
                }
            }
        ]
    }

@router.get("/balance")
async def get_wallet_balance(current_user: dict = Depends(get_current_user)):
    """Get user's wallet balance"""
    try:
        user_id = current_user["user_id"]
        balance = await payment_service.calculate_user_balance(user_id)
        
        return {
            "success": True,
            "balance": balance,
            "currency": "NGN"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": {
                    "code": "BALANCE_ERROR",
                    "message": str(e)
                }
            }
        )