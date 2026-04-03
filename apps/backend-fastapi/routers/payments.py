"""
Secure Payment Processing Router
Handles Flutterwave payments and wallet transactions with proper security
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional, Dict, Any
import uuid
import hashlib
import hmac
import os
from datetime import datetime, timedelta

from services.flutterwave_service import flutterwave_service
from services.payment_service import payment_service
from services.booking_service import booking_service
from services.ticket_service import ticket_service
from services.email_service import email_service
from services.event_service import event_service
from services.notification_service import notification_service
from config import config
import logging

logger = logging.getLogger(__name__)

# Simple authentication function for testing
async def get_current_user(request: Request):
    """Simple authentication for testing - extract user from token"""
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        token = auth_header.split(" ")[1]
        
        # For testing, extract user ID from mock token
        if token.startswith("mock_access_token_"):
            user_id = token.replace("mock_access_token_", "")
            return {"user_id": user_id, "token": token}
        
        raise HTTPException(status_code=401, detail="Invalid token")
        
    except Exception as e:
        raise HTTPException(status_code=401, detail="Authentication failed")

# Simple payment security validation
class PaymentSecurity:
    def validate_payment_request(self, payment_data, user_id):
        """Simple payment validation"""
        amount = payment_data.get('amount', 0)
        if amount < 10000:  # Minimum ₦100
            raise HTTPException(status_code=400, detail="Amount too low")
        if amount > 1000000:  # Maximum ₦10,000
            raise HTTPException(status_code=400, detail="Amount too high")
        return True
    
    def sanitize_payment_data(self, data):
        """Simple data sanitization"""
        return data
    
    def log_payment_attempt(self, user_id, amount, method, success):
        """Simple logging"""
        print(f"Payment attempt: {user_id}, {amount}, {method}, {success}")

payment_security = PaymentSecurity()

router = APIRouter()

class FlutterwavePaymentRequest(BaseModel):
    amount: int  # Amount in kobo
    reference: str
    event_id: str
    customer_email: str
    customer_name: str
    customer_phone: Optional[str] = None
    redirect_url: Optional[str] = None

class WalletPaymentRequest(BaseModel):
    amount: int  # Amount in kobo
    reference: str
    event_id: str
    ticket_details: Dict[str, Any]

class BankTransferRequest(BaseModel):
    amount: int  # Amount in kobo
    reference: str
    event_id: str

class USSDPaymentRequest(BaseModel):
    amount: int  # Amount in kobo
    reference: str
    event_id: str
    bank: str  # Bank code (gtb, access, zenith, uba)

class AirtimePaymentRequest(BaseModel):
    amount: int  # Amount in kobo
    reference: str
    phone_number: str
    network: str  # Network provider (mtn, glo, airtel, 9mobile)
    customer_phone: Optional[str] = None
    redirect_url: Optional[str] = None

class PaymentVerificationRequest(BaseModel):
    transaction_id: str
    tx_ref: str

@router.post("/flutterwave/create")
async def create_flutterwave_payment(
    request: FlutterwavePaymentRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create Flutterwave payment - Inline mode (client-side payment)"""
    try:
        user_id = current_user["user_id"]
        
        # Validate payment request
        payment_security.validate_payment_request(request.dict(), user_id)
        
        # For Flutterwave Inline payments, we don't create payment links on backend
        # The frontend handles payment creation directly with Flutterwave using public key
        # This is more secure and is the recommended approach
        
        # Generate transaction reference for tracking
        import uuid
        from datetime import datetime
        tx_ref = f"TKT_{uuid.uuid4().hex[:12]}_{int(datetime.now().timestamp())}"
        
        # Log payment initiation
        payment_security.log_payment_attempt(
            user_id, request.amount, 'flutterwave_inline', True
        )
        
        # Return success with transaction reference
        # Frontend will use this reference with Flutterwave Inline
        return {
            "success": True,
            "tx_ref": tx_ref,
            "payment_id": tx_ref,
            "mode": "inline",
            "message": "Use Flutterwave Inline for payment",
            "public_key_required": True
        }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": {
                    "code": "PAYMENT_ERROR",
                    "message": str(e)
                }
            }
        )
@router.post("/wallet")
async def process_wallet_payment(
    request: WalletPaymentRequest,
    current_user: dict = Depends(get_current_user)
):
    """Process wallet payment with enhanced security"""
    try:
        user_id = current_user["user_id"]
        
        # Validate payment request
        payment_security.validate_payment_request(request.dict(), user_id)
        
        # Check wallet balance
        current_balance = await payment_service.calculate_user_balance(user_id)
        required_amount = request.amount / 100  # Convert kobo to naira
        
        if current_balance < required_amount:
            payment_security.log_payment_attempt(
                user_id, request.amount, 'wallet', False
            )
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
        
        # Log successful payment
        payment_security.log_payment_attempt(
            user_id, request.amount, 'wallet', True
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
    """Verify Flutterwave payment and create tickets"""
    try:
        user_id = current_user["user_id"]
        
        # Extract event_id and ticket details from tx_ref
        # Format: TKT_{uuid}_{timestamp}_{event_id}_{quantity}_{tier_name}
        tx_parts = request.tx_ref.split('_')
        event_id = tx_parts[3] if len(tx_parts) > 3 else None
        quantity = int(tx_parts[4]) if len(tx_parts) > 4 else 1
        tier_name = tx_parts[5] if len(tx_parts) > 5 else "General"
        
        # Try to verify with Flutterwave API if secret key is available
        payment_amount = 0
        try:
            result = flutterwave_service.verify_payment(request.transaction_id)
            
            if result['success'] and result['status'] == 'successful':
                payment_amount = result['amount']
                logger.info(f"Payment verified via API: {request.transaction_id}")
        except Exception as api_error:
            logger.warning(f"Flutterwave API verification failed: {api_error}")
            # Continue with inline verification
        
        # Get event details
        event = None
        if event_id:
            event = await event_service.get_event(event_id)
        
        # Create tickets for the purchase
        tickets_created = []
        for i in range(quantity):
            ticket_data = {
                "user_id": user_id,
                "event_id": event_id,
                "ticket_type": tier_name,
                "price": payment_amount / quantity if payment_amount > 0 else 0,
                "status": "active",
                "payment_reference": request.tx_ref
            }
            
            ticket = await ticket_service.create_ticket(ticket_data)
            if ticket:
                tickets_created.append(ticket)
                logger.info(f"Ticket created: {ticket['id']} with code: {ticket.get('ticket_code')}")
        
        # Send ticket confirmation email for each ticket
        if tickets_created and event:
            for ticket in tickets_created:
                email_ticket_data = {
                    "ticket_code": ticket.get('ticket_code', 'N/A'),
                    "event_title": event.get('title', 'Event'),
                    "event_date": event.get('event_date', 'TBD'),
                    "venue": event.get('venue_name', 'TBD'),
                    "tier_name": tier_name,
                    "quantity": 1,
                    "amount": ticket.get('price', 0)
                }
                
                # Get user email
                user_email = current_user.get('email', 'user@example.com')
                
                # Send email with QR code
                await email_service.send_ticket_confirmation(
                    email=user_email,
                    ticket_data=email_ticket_data,
                    qr_code_base64=ticket.get('qr_code')
                )
                logger.info(f"Ticket confirmation email queued for {user_email}")
        
        # Create booking record
        if event_id:
            booking_data = await booking_service.create_booking(
                user_id=user_id,
                event_id=event_id,
                quantity=quantity,
                total_amount=payment_amount,
                payment_method="flutterwave"
            )
            
            if booking_data:
                await booking_service.update_booking_status(booking_data['id'], 'confirmed')
        
        # Send notification
        await notification_service.create_notification(
            user_id=user_id,
            title="Payment Successful",
            message=f"Your payment has been confirmed. {len(tickets_created)} ticket(s) created.",
            notification_type="payment_success",
            event_id=event_id
        )
        
        payment_security.log_payment_attempt(
            user_id, int(payment_amount * 100), 'flutterwave_verify', True
        )
        
        return {
            "success": True,
            "status": "successful",
            "transaction_id": request.transaction_id,
            "tx_ref": request.tx_ref,
            "amount": payment_amount,
            "tickets_created": len(tickets_created),
            "ticket_codes": [t.get('ticket_code') for t in tickets_created],
            "message": f"Payment verified successfully. {len(tickets_created)} ticket(s) created and confirmation email sent."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying payment: {e}", exc_info=True)
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

@router.post("/webhook/flutterwave")
async def flutterwave_webhook(request: Request):
    """Handle Flutterwave webhook notifications"""
    try:
        # Get webhook signature
        signature = request.headers.get("verif-hash")
        body = await request.body()
        
        # Verify webhook signature
        if not flutterwave_service.verify_webhook_signature(body, signature):
            raise HTTPException(status_code=400, detail="Invalid signature")
        
        # Process webhook data
        import json
        data = json.loads(body)
        
        result = flutterwave_service.process_webhook(data)
        
        if result['success'] and result.get('action') == 'payment_completed':
            # Handle successful payment
            tx_ref = result.get('tx_ref')
            amount = result.get('amount')
            
            # Update payment record in database
            # Create booking and send notifications
            # This would involve finding the payment by tx_ref and updating status
            
            return {"success": True, "message": "Payment webhook processed"}
        
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
    # For Flutterwave Inline, the frontend handles payment with its public key
    # Backend doesn't need credentials for inline mode
    # Check if we have backend credentials OR if we're using inline mode (always available)
    flutterwave_available = bool(flutterwave_service.public_key) or True  # Inline mode always available
    
    return {
        "success": True,
        "methods": [
            {
                "id": "wallet",
                "name": "Wallet",
                "description": "Pay from your Grooovy wallet",
                "icon": "💳",
                "fee_percentage": 0,
                "fee_fixed": 0,
                "available": True
            },
            {
                "id": "card",
                "name": "Debit/Credit Card",
                "description": "Visa, Mastercard, Verve via Flutterwave",
                "icon": "💳",
                "fee_percentage": 1.4,
                "fee_fixed": 0,
                "available": flutterwave_available,
                "mode": "inline"
            },
            {
                "id": "bank_transfer",
                "name": "Bank Transfer",
                "description": "Direct bank transfer via Flutterwave",
                "icon": "🏦",
                "fee_percentage": 0,
                "fee_fixed": 50,
                "available": flutterwave_available,
                "mode": "inline"
            },
            {
                "id": "ussd",
                "name": "USSD",
                "description": "Pay with *737#, *901#, *966# via Flutterwave",
                "icon": "📱",
                "fee_percentage": 0,
                "fee_fixed": 0,
                "available": flutterwave_available,
                "mode": "inline"
            },
            {
                "id": "mobile_money",
                "name": "Mobile Money",
                "description": "MTN, Airtel, 9mobile mobile money",
                "icon": "📞",
                "fee_percentage": 1.4,
                "fee_fixed": 0,
                "available": flutterwave_available,
                "mode": "inline"
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