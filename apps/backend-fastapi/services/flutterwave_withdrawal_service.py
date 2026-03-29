"""
Flutterwave Withdrawal/Transfer Service
Handles bank transfers and withdrawals using Flutterwave Transfer API
"""

import os
import uuid
import requests
import time
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class FlutterwaveWithdrawalService:
    def __init__(self):
        # Get Flutterwave credentials
        self.secret_key = (
            os.getenv('FLUTTERWAVE_LIVE_SECRET_KEY') or
            os.getenv('FLUTTERWAVE_SECRET_KEY') or 
            os.getenv('FLUTTERWAVE_CLIENT_SECRET_KEY')
        )
        self.base_url = 'https://api.flutterwave.com/v3'
        
        if not self.secret_key:
            logger.warning("⚠️  Flutterwave credentials not configured for withdrawals")
        else:
            logger.info("✅ Flutterwave withdrawal service initialized")
    
    def get_nigerian_banks(self) -> Dict[str, Any]:
        """Get list of Nigerian banks from Flutterwave"""
        try:
            headers = {
                'Authorization': f'Bearer {self.secret_key}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(
                f"{self.base_url}/banks/NG",
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success':
                    banks = data.get('data', [])
                    return {
                        'success': True,
                        'banks': banks,
                        'count': len(banks)
                    }
            
            logger.error(f"Failed to fetch banks: {response.text}")
            return {
                'success': False,
                'error': 'Failed to fetch bank list'
            }
            
        except Exception as e:
            logger.error(f"Error fetching banks: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def verify_bank_account(self, account_number: str, bank_code: str) -> Dict[str, Any]:
        """Verify bank account details with Flutterwave"""
        try:
            headers = {
                'Authorization': f'Bearer {self.secret_key}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                "account_number": account_number,
                "account_bank": bank_code
            }
            
            response = requests.post(
                f"{self.base_url}/accounts/resolve",
                json=payload,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success':
                    account_data = data.get('data', {})
                    return {
                        'success': True,
                        'account_number': account_data.get('account_number'),
                        'account_name': account_data.get('account_name'),
                        'bank_code': bank_code
                    }
            
            logger.error(f"Account verification failed: {response.text}")
            return {
                'success': False,
                'error': 'Could not verify bank account'
            }
            
        except Exception as e:
            logger.error(f"Error verifying account: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def initiate_transfer(self, transfer_data: Dict[str, Any]) -> Dict[str, Any]:
        """Initiate bank transfer using Flutterwave Transfer API"""
        try:
            if not self.secret_key:
                return {
                    'success': False,
                    'error': 'Flutterwave not configured'
                }
            
            headers = {
                'Authorization': f'Bearer {self.secret_key}',
                'Content-Type': 'application/json'
            }
            
            # Generate unique reference
            reference = f"WD_{uuid.uuid4().hex[:12]}_{int(time.time())}"
            
            # Flutterwave Transfer API payload
            payload = {
                "account_bank": transfer_data['bank_code'],
                "account_number": transfer_data['account_number'],
                "amount": transfer_data['amount'],
                "narration": transfer_data.get('narration', 'Grooovy Wallet Withdrawal'),
                "currency": "NGN",
                "reference": reference,
                "callback_url": transfer_data.get('callback_url', ''),
                "debit_currency": "NGN"
            }
            
            # Add beneficiary name if provided
            if transfer_data.get('beneficiary_name'):
                payload['beneficiary_name'] = transfer_data['beneficiary_name']
            
            logger.info(f"🔄 Initiating Flutterwave transfer: {reference}")
            logger.info(f"   Amount: ₦{transfer_data['amount']:,.2f}")
            logger.info(f"   Account: {transfer_data['account_number']}")
            
            response = requests.post(
                f"{self.base_url}/transfers",
                json=payload,
                headers=headers,
                timeout=30
            )
            
            logger.info(f"Flutterwave transfer response: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"Transfer response data: {data}")
                
                if data.get('status') == 'success':
                    transfer_info = data.get('data', {})
                    return {
                        'success': True,
                        'transfer_id': transfer_info.get('id'),
                        'reference': reference,
                        'status': transfer_info.get('status'),
                        'amount': transfer_info.get('amount'),
                        'fee': transfer_info.get('fee', 0),
                        'account_number': transfer_info.get('account_number'),
                        'bank_name': transfer_info.get('bank_name'),
                        'full_name': transfer_info.get('full_name'),
                        'created_at': transfer_info.get('created_at'),
                        'message': 'Transfer initiated successfully'
                    }
            
            # Handle error response
            error_data = response.json() if response.status_code != 500 else {}
            error_message = error_data.get('message', 'Transfer failed')
            
            logger.error(f"❌ Transfer failed: {response.text}")
            
            return {
                'success': False,
                'error': error_message,
                'reference': reference
            }
            
        except Exception as e:
            logger.error(f"❌ Transfer exception: {e}")
            import traceback
            traceback.print_exc()
            return {
                'success': False,
                'error': f'Transfer failed: {str(e)}'
            }
    
    def get_transfer_status(self, transfer_id: str) -> Dict[str, Any]:
        """Get status of a transfer"""
        try:
            headers = {
                'Authorization': f'Bearer {self.secret_key}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(
                f"{self.base_url}/transfers/{transfer_id}",
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success':
                    transfer_info = data.get('data', {})
                    return {
                        'success': True,
                        'status': transfer_info.get('status'),
                        'amount': transfer_info.get('amount'),
                        'fee': transfer_info.get('fee'),
                        'reference': transfer_info.get('reference'),
                        'complete_message': transfer_info.get('complete_message'),
                        'created_at': transfer_info.get('created_at')
                    }
            
            return {
                'success': False,
                'error': 'Could not fetch transfer status'
            }
            
        except Exception as e:
            logger.error(f"Error fetching transfer status: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_transfer_fee(self, amount: float) -> Dict[str, Any]:
        """Calculate transfer fee"""
        try:
            headers = {
                'Authorization': f'Bearer {self.secret_key}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(
                f"{self.base_url}/transfers/fee?amount={amount}&currency=NGN",
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success':
                    fee_data = data.get('data', [])
                    if fee_data:
                        return {
                            'success': True,
                            'fee': fee_data[0].get('fee', 0),
                            'currency': fee_data[0].get('currency', 'NGN')
                        }
            
            # Default fee if API fails
            return {
                'success': True,
                'fee': 10.75,  # Flutterwave standard fee
                'currency': 'NGN'
            }
            
        except Exception as e:
            logger.error(f"Error fetching transfer fee: {e}")
            return {
                'success': True,
                'fee': 10.75,  # Default fee
                'currency': 'NGN'
            }
    
    def get_account_balance(self) -> Dict[str, Any]:
        """Get Flutterwave account balance"""
        try:
            headers = {
                'Authorization': f'Bearer {self.secret_key}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(
                f"{self.base_url}/balances",
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success':
                    balances = data.get('data', [])
                    # Find NGN balance
                    for balance in balances:
                        if balance.get('currency') == 'NGN':
                            return {
                                'success': True,
                                'available': float(balance.get('available_balance', 0)),
                                'ledger': float(balance.get('ledger_balance', 0)),
                                'currency': 'NGN'
                            }
                    
                    # NGN balance not found
                    return {
                        'success': False,
                        'error': 'NGN balance not found',
                        'available': 0,
                        'ledger': 0
                    }
            
            logger.error(f"Failed to fetch balance: {response.text}")
            return {
                'success': False,
                'error': 'Could not fetch account balance',
                'available': 0,
                'ledger': 0
            }
            
        except Exception as e:
            logger.error(f"Error fetching account balance: {e}")
            return {
                'success': False,
                'error': str(e),
                'available': 0,
                'ledger': 0
            }

# Global instance
flutterwave_withdrawal_service = FlutterwaveWithdrawalService()
