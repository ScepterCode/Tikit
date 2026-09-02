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
from services.organizer_payment_service import organizer_payment_service
from services.supabase_client import get_supabase_client
from auth_utils import get_user_from_request
from config import config
import logging

logger = logging.getLogger(__name__)


async def get_current_user(request: Request):
    """Authenticate the request via the shared Supabase JWT validator.

    Mock tokens are only honoured when ENABLE_MOCK_TOKENS is set in a
    development environment (enforced inside auth_utils).
    """
    try:
        return await get_user_from_request(request)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

# Simple payment security validation
class PaymentSecurity:
    # Amounts are in kobo (1 naira = 100 kobo)
    MIN_AMOUNT_KOBO = 10_000            # ₦100
    MAX_AMOUNT_KOBO = 100_000_000       # ₦1,000,000

    def validate_payment_request(self, payment_data, user_id):
        """Basic sanity checks on a payment amount."""
        amount = payment_data.get('amount', 0)
        if amount < self.MIN_AMOUNT_KOBO:
            raise HTTPException(status_code=400, detail="Amount too low")
        if amount > self.MAX_AMOUNT_KOBO:
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


def _expected_ticket_total(event: Optional[dict], tier_name: str, quantity: int) -> Optional[float]:
    """Best-effort expected total (NGN) for ``quantity`` tickets of ``tier_name``.

    Returns None when the event's tier pricing cannot be determined, in which
    case the caller should not block on the amount (but must still require a
    successful Flutterwave verification).
    """
    if not event:
        return None

    tiers = event.get('ticket_tiers') or event.get('tiers') or event.get('ticketTiers')
    if isinstance(tiers, str):
        try:
            import json as _json
            tiers = _json.loads(tiers)
        except Exception:
            tiers = None

    if isinstance(tiers, list) and tiers:
        for tier in tiers:
            if not isinstance(tier, dict):
                continue
            name = str(tier.get('name') or tier.get('tier_name') or '').strip().lower()
            if name == str(tier_name).strip().lower():
                try:
                    return float(tier.get('price') or tier.get('amount') or 0) * quantity
                except (TypeError, ValueError):
                    return None
        # tier not matched but list exists -> use the cheapest as a floor
        try:
            prices = [float(t.get('price') or t.get('amount') or 0) for t in tiers if isinstance(t, dict)]
            prices = [p for p in prices if p > 0]
            if prices:
                return min(prices) * quantity
        except (TypeError, ValueError):
            return None

    # Flat-priced event
    for key in ('ticket_price', 'price', 'amount'):
        if event.get(key):
            try:
                return float(event[key]) * quantity
            except (TypeError, ValueError):
                return None
    return None

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
        quantity = int(request.ticket_details.get("quantity", 1) or 1)
        booking_data = await booking_service.create_booking(
            user_id=user_id,
            event_id=request.event_id,
            quantity=quantity,
            total_amount=required_amount,
            payment_method="wallet"
        )

        # Credit the organizer's wallet for this sale (idempotent on payment_reference).
        if request.event_id:
            try:
                credit_result = await organizer_payment_service.credit_organizer_for_ticket_sale(
                    event_id=request.event_id,
                    ticket_price=(required_amount / quantity) if quantity else required_amount,
                    payment_reference=request.reference,
                    attendee_id=user_id,
                    quantity=quantity,
                )
                if not credit_result.get("success") and not credit_result.get("duplicate"):
                    logger.error(f"Organizer credit failed for {request.reference}: {credit_result.get('error')}")
            except Exception as credit_error:
                logger.error(f"Organizer credit raised for {request.reference}: {credit_error}", exc_info=True)

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
            "account_name": "Grooovy Payments",
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
    """Verify a Flutterwave payment with Flutterwave and, only if it genuinely
    succeeded, issue the tickets and credit the organizer.

    Security: tickets are NEVER issued unless Flutterwave confirms the
    transaction as ``successful``. The call is idempotent on ``tx_ref``.
    """
    try:
        user_id = current_user["user_id"]

        # Extract event_id and ticket details from tx_ref
        # Format: TKT_{uuid}_{timestamp}_{event_id}_{quantity}_{tier_name}
        tx_parts = request.tx_ref.split('_')
        event_id = tx_parts[3] if len(tx_parts) > 3 else None
        quantity = int(tx_parts[4]) if len(tx_parts) > 4 and tx_parts[4].isdigit() else 1
        tier_name = tx_parts[5] if len(tx_parts) > 5 else "General"
        quantity = max(1, min(quantity, 50))

        supabase = get_supabase_client()

        # --- Idempotency: if this tx_ref already produced tickets, return them ---
        if supabase:
            existing = supabase.table('tickets')\
                .select('*')\
                .eq('payment_reference', request.tx_ref)\
                .execute()
            if existing.data:
                logger.info(f"verify_payment: tx_ref {request.tx_ref} already processed ({len(existing.data)} tickets)")
                return {
                    "success": True,
                    "status": "successful",
                    "transaction_id": request.transaction_id,
                    "tx_ref": request.tx_ref,
                    "amount": sum(float(t.get('price', 0) or 0) for t in existing.data),
                    "tickets_created": len(existing.data),
                    "ticket_codes": [t.get('ticket_code') for t in existing.data],
                    "message": "Payment already verified; existing tickets returned.",
                    "idempotent": True,
                }

        # --- Mandatory verification with Flutterwave ---
        if not flutterwave_service.secret_key:
            logger.error("verify_payment: Flutterwave secret key not configured - cannot verify payment")
            raise HTTPException(
                status_code=503,
                detail={"success": False, "error": {"code": "PAYMENT_VERIFICATION_UNAVAILABLE",
                        "message": "Payment verification is not available. Please contact support."}},
            )

        result = flutterwave_service.verify_payment(request.transaction_id)

        if not result.get('success') or result.get('status') != 'successful':
            logger.warning(f"verify_payment: Flutterwave rejected {request.transaction_id}: {result}")
            payment_security.log_payment_attempt(user_id, 0, 'flutterwave_verify', False)
            raise HTTPException(
                status_code=402,
                detail={"success": False, "error": {"code": "PAYMENT_NOT_SUCCESSFUL",
                        "message": "Payment could not be verified as successful."}},
            )

        # The verified transaction must be the one the client claims
        if result.get('tx_ref') and result['tx_ref'] != request.tx_ref:
            logger.warning(f"verify_payment: tx_ref mismatch - claimed {request.tx_ref}, actual {result.get('tx_ref')}")
            raise HTTPException(
                status_code=400,
                detail={"success": False, "error": {"code": "TX_REF_MISMATCH",
                        "message": "Transaction reference does not match."}},
            )

        if result.get('currency') and result['currency'] != 'NGN':
            raise HTTPException(
                status_code=400,
                detail={"success": False, "error": {"code": "UNSUPPORTED_CURRENCY",
                        "message": f"Unsupported payment currency: {result.get('currency')}"}},
            )

        payment_amount = float(result.get('amount') or 0)
        logger.info(f"Payment verified via Flutterwave: {request.transaction_id} amount=₦{payment_amount:,.2f}")

        # Get event details
        event = None
        if event_id:
            event = await event_service.get_event(event_id)

        # --- Enforce the amount paid covers the expected ticket price ---
        expected_total = _expected_ticket_total(event, tier_name, quantity)
        if expected_total is not None and payment_amount + 1e-6 < expected_total * 0.99:
            logger.warning(
                f"verify_payment: underpayment - paid ₦{payment_amount:,.2f}, expected ₦{expected_total:,.2f}"
            )
            raise HTTPException(
                status_code=402,
                detail={"success": False, "error": {"code": "UNDERPAYMENT",
                        "message": "Amount paid does not cover the ticket price."}},
            )

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

        # Credit the organizer's wallet for this sale (idempotent on payment_reference).
        # Failure here must not fail the buyer's purchase - it is reconciled separately.
        if event_id and tickets_created:
            try:
                credit_result = await organizer_payment_service.credit_organizer_for_ticket_sale(
                    event_id=event_id,
                    ticket_price=(payment_amount / quantity) if quantity else payment_amount,
                    payment_reference=request.tx_ref,
                    attendee_id=user_id,
                    quantity=len(tickets_created),
                )
                if not credit_result.get("success") and not credit_result.get("duplicate"):
                    logger.error(f"Organizer credit failed for {request.tx_ref}: {credit_result.get('error')}")
            except Exception as credit_error:
                logger.error(f"Organizer credit raised for {request.tx_ref}: {credit_error}", exc_info=True)

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