"""
Secure Flutterwave Payment Service
Production-ready payment processing with proper security
"""

import os
import hashlib
import hmac
import uuid
import requests
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class FlutterwavePaymentService:
    def __init__(self):
        # Support multiple credential formats - prioritize LIVE credentials first
        self.secret_key = (
            os.getenv('FLUTTERWAVE_LIVE_SECRET_KEY') or
            os.getenv('FLUTTERWAVE_SECRET_KEY') or 
            os.getenv('FLUTTERWAVE_CLIENT_SECRET_KEY')
        )
        self.public_key = (
            os.getenv('FLUTTERWAVE_LIVE_PUBLIC_KEY') or
            os.getenv('FLUTTERWAVE_PUBLIC_KEY') or 
            os.getenv('FLUTTERWAVE_CLIENT_ID')
        )
        self.encryption_key = os.getenv('FLUTTERWAVE_ENCRYPTION_KEY')
        self.base_url = 'https://api.flutterwave.com/v3'
        
        if not self.secret_key or not self.public_key:
            logger.warning("Flutterwave credentials not configured")
        else:
            logger.info("✅ Flutterwave credentials loaded successfully")
    
    def create_payment_link(self, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create secure payment link with Flutterwave using correct API format"""
        try:
            # Generate unique idempotency key for this request
            idempotency_key = f"TKT_{uuid.uuid4().hex[:12]}_{int(datetime.now().timestamp())}"
            
            headers = {
                'Authorization': f'Bearer {self.secret_key}',
                'Content-Type': 'application/json',
                'X-Idempotency-Key': idempotency_key
            }
            
            # Generate secure transaction reference
            tx_ref = f"TKT_{uuid.uuid4().hex[:12]}_{int(datetime.now().timestamp())}"
            
            # Flutterwave Standard API payload format
            payload = {
                "tx_ref": tx_ref,
                "amount": str(payment_data['amount']),  # Amount as string
                "currency": "NGN",
                "redirect_url": payment_data.get('redirect_url', ''),
                "payment_options": "card,banktransfer,ussd,mobilemoney",
                "customer": {
                    "email": payment_data['customer_email'],
                    "phonenumber": payment_data.get('customer_phone', ''),
                    "name": payment_data['customer_name']
                },
                "customizations": {
                    "title": payment_data.get('title', 'Grooovy Ticket Purchase'),
                    "description": payment_data.get('description', 'Event ticket payment'),
                    "logo": payment_data.get('logo', '')
                },
                "meta": {
                    "event_id": payment_data.get('event_id'),
                    "user_id": payment_data.get('user_id'),
                    "ticket_quantity": payment_data.get('ticket_quantity', 1)
                }
            }
            
            logger.info(f"Creating Flutterwave payment with payload: {payload}")
            
            response = requests.post(
                f"{self.base_url}/payments",
                json=payload,
                headers=headers,
                timeout=30
            )
            
            logger.info(f"Flutterwave response: {response.status_code} - {response.text}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success':
                    return {
                        'success': True,
                        'payment_link': data['data']['link'],
                        'tx_ref': tx_ref,
                        'payment_id': data['data'].get('id', tx_ref)
                    }
            
            logger.error(f"Flutterwave payment creation failed: {response.text}")
            return {
                'success': False,
                'error': f'Flutterwave API error: {response.text}'
            }
            
        except Exception as e:
            logger.error(f"Payment link creation error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def verify_payment(self, transaction_id: str) -> Dict[str, Any]:
        """Verify payment with Flutterwave"""
        try:
            headers = {
                'Authorization': f'Bearer {self.secret_key}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(
                f"{self.base_url}/transactions/{transaction_id}/verify",
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success':
                    transaction_data = data['data']
                    return {
                        'success': True,
                        'status': transaction_data.get('status'),
                        'amount': transaction_data.get('amount'),
                        'currency': transaction_data.get('currency'),
                        'tx_ref': transaction_data.get('tx_ref'),
                        'flw_ref': transaction_data.get('flw_ref'),
                        'charged_amount': transaction_data.get('charged_amount'),
                        'app_fee': transaction_data.get('app_fee'),
                        'merchant_fee': transaction_data.get('merchant_fee'),
                        'processor_response': transaction_data.get('processor_response'),
                        'auth_model': transaction_data.get('auth_model'),
                        'ip': transaction_data.get('ip'),
                        'narration': transaction_data.get('narration'),
                        'created_at': transaction_data.get('created_at')
                    }
            
            logger.error(f"Payment verification failed: {response.text}")
            return {
                'success': False,
                'error': 'Payment verification failed'
            }
            
        except Exception as e:
            logger.error(f"Payment verification error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        """Verify Flutterwave webhook signature"""
        try:
            secret_hash = os.getenv('FLUTTERWAVE_SECRET_HASH')
            if not secret_hash:
                logger.error("Flutterwave secret hash not configured")
                return False
            
            expected_signature = hmac.new(
                secret_hash.encode('utf-8'),
                payload,
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(signature, expected_signature)
            
        except Exception as e:
            logger.error(f"Webhook signature verification error: {str(e)}")
            return False
    
    def process_webhook(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Process Flutterwave webhook"""
        try:
            event_type = payload.get('event')
            data = payload.get('data', {})
            
            if event_type == 'charge.completed':
                # Handle successful payment
                tx_ref = data.get('tx_ref')
                status = data.get('status')
                amount = data.get('amount')
                
                if status == 'successful':
                    return {
                        'success': True,
                        'action': 'payment_completed',
                        'tx_ref': tx_ref,
                        'amount': amount,
                        'data': data
                    }
            
            return {
                'success': True,
                'action': 'webhook_received',
                'event_type': event_type
            }
            
        except Exception as e:
            logger.error(f"Webhook processing error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

# Global payment service instance
flutterwave_service = FlutterwavePaymentService()