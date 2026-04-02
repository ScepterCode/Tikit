"""
Production Wallet Service - Real Flutterwave Integration
NO MOCK DATA - Production Ready
"""

import os
import uuid
import requests
from datetime import datetime
from typing import Dict, Any, Optional
from supabase import create_client, Client

class ProductionWalletService:
    def __init__(self):
        # Supabase connection
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
        self.supabase: Client = create_client(supabase_url, supabase_key)
        
        # Flutterwave credentials
        self.flw_secret_key = os.getenv('FLUTTERWAVE_SECRET_KEY')
        self.flw_public_key = os.getenv('FLUTTERWAVE_PUBLIC_KEY')
        self.flw_base_url = 'https://api.flutterwave.com/v3'
    
    async def get_balance(self, user_id: str) -> Dict[str, Any]:
        """Get real user balance from database"""
        try:
            # Query Supabase for user wallet
            response = self.supabase.table('users').select('wallet_balance').eq('id', user_id).single().execute()
            
            if response.data:
                balance = float(response.data.get('wallet_balance', 0))
                return {
                    "success": True,
                    "balance": balance,
                    "currency": "NGN",
                    "formatted": f"₦{balance:,.2f}"
                }
            
            return {"success": False, "error": "User not found"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def initiate_funding(self, user_id: str, amount: float) -> Dict[str, Any]:
        """
        Initiate wallet funding via Flutterwave
        Returns transaction reference for frontend to complete payment
        """
        try:
            if amount < 100:
                return {"success": False, "error": "Minimum funding amount is ₦100"}
            
            # Generate unique transaction reference
            tx_ref = f"FUND_{user_id}_{uuid.uuid4().hex[:12]}"
            
            # Store pending transaction in database
            self.supabase.table('transactions').insert({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "type": "credit",
                "amount": amount,
                "status": "pending",
                "reference": tx_ref,
                "description": "Wallet funding",
                "created_at": datetime.utcnow().isoformat()
            }).execute()
            
            return {
                "success": True,
                "tx_ref": tx_ref,
                "amount": amount,
                "message": "Complete payment with Flutterwave"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def verify_and_credit(self, tx_ref: str, transaction_id: str) -> Dict[str, Any]:
        """
        Verify Flutterwave payment and credit user wallet
        Called after Flutterwave payment completion
        """
        try:
            # Verify payment with Flutterwave API
            headers = {
                'Authorization': f'Bearer {self.flw_secret_key}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(
                f'{self.flw_base_url}/transactions/{transaction_id}/verify',
                headers=headers,
                timeout=30
            )
            
            if response.status_code != 200:
                return {"success": False, "error": "Payment verification failed"}
            
            data = response.json()
            
            if data.get('status') != 'success':
                return {"success": False, "error": "Payment not successful"}
            
            payment_data = data.get('data', {})
            amount = float(payment_data.get('amount', 0))
            status = payment_data.get('status')
            
            if status != 'successful':
                return {"success": False, "error": f"Payment status: {status}"}
            
            # Get transaction from database
            tx_response = self.supabase.table('transactions').select('*').eq('reference', tx_ref).single().execute()
            
            if not tx_response.data:
                return {"success": False, "error": "Transaction not found"}
            
            transaction = tx_response.data
            user_id = transaction['user_id']
            
            # Credit user wallet
            user_response = self.supabase.table('users').select('wallet_balance').eq('id', user_id).single().execute()
            
            if not user_response.data:
                return {"success": False, "error": "User not found"}
            
            current_balance = float(user_response.data.get('wallet_balance', 0))
            new_balance = current_balance + amount
            
            # Update wallet balance
            self.supabase.table('users').update({
                "wallet_balance": new_balance
            }).eq('id', user_id).execute()
            
            # Update transaction status
            self.supabase.table('transactions').update({
                "status": "completed",
                "flutterwave_transaction_id": transaction_id,
                "completed_at": datetime.utcnow().isoformat()
            }).eq('reference', tx_ref).execute()
            
            return {
                "success": True,
                "message": "Wallet funded successfully",
                "amount": amount,
                "new_balance": new_balance
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def send_funds(self, sender_id: str, recipient_id: str, amount: float, description: str = "") -> Dict[str, Any]:
        """Send funds from one user to another"""
        try:
            if amount <= 0:
                return {"success": False, "error": "Invalid amount"}
            
            # Get sender balance
            sender_response = self.supabase.table('users').select('wallet_balance').eq('id', sender_id).single().execute()
            
            if not sender_response.data:
                return {"success": False, "error": "Sender not found"}
            
            sender_balance = float(sender_response.data.get('wallet_balance', 0))
            
            if sender_balance < amount:
                return {"success": False, "error": "Insufficient balance"}
            
            # Get recipient
            recipient_response = self.supabase.table('users').select('wallet_balance').eq('id', recipient_id).single().execute()
            
            if not recipient_response.data:
                return {"success": False, "error": "Recipient not found"}
            
            recipient_balance = float(recipient_response.data.get('wallet_balance', 0))
            
            # Debit sender
            new_sender_balance = sender_balance - amount
            self.supabase.table('users').update({
                "wallet_balance": new_sender_balance
            }).eq('id', sender_id).execute()
            
            # Credit recipient
            new_recipient_balance = recipient_balance + amount
            self.supabase.table('users').update({
                "wallet_balance": new_recipient_balance
            }).eq('id', recipient_id).execute()
            
            # Record transactions
            transfer_ref = f"TRANSFER_{uuid.uuid4().hex[:12]}"
            
            # Debit transaction
            self.supabase.table('transactions').insert({
                "id": str(uuid.uuid4()),
                "user_id": sender_id,
                "type": "debit",
                "amount": amount,
                "status": "completed",
                "reference": transfer_ref,
                "description": description or f"Transfer to user",
                "created_at": datetime.utcnow().isoformat()
            }).execute()
            
            # Credit transaction
            self.supabase.table('transactions').insert({
                "id": str(uuid.uuid4()),
                "user_id": recipient_id,
                "type": "credit",
                "amount": amount,
                "status": "completed",
                "reference": transfer_ref,
                "description": description or f"Transfer from user",
                "created_at": datetime.utcnow().isoformat()
            }).execute()
            
            return {
                "success": True,
                "message": "Transfer successful",
                "amount": amount,
                "new_balance": new_sender_balance
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def withdraw_to_bank(self, user_id: str, amount: float, bank_code: str, account_number: str) -> Dict[str, Any]:
        """
        Withdraw funds to bank account via Flutterwave Transfer API
        """
        try:
            if amount < 100:
                return {"success": False, "error": "Minimum withdrawal is ₦100"}
            
            # Get user balance
            user_response = self.supabase.table('users').select('wallet_balance').eq('id', user_id).single().execute()
            
            if not user_response.data:
                return {"success": False, "error": "User not found"}
            
            balance = float(user_response.data.get('wallet_balance', 0))
            
            if balance < amount:
                return {"success": False, "error": "Insufficient balance"}
            
            # Initiate transfer via Flutterwave
            headers = {
                'Authorization': f'Bearer {self.flw_secret_key}',
                'Content-Type': 'application/json'
            }
            
            transfer_ref = f"WITHDRAW_{user_id}_{uuid.uuid4().hex[:12]}"
            
            payload = {
                "account_bank": bank_code,
                "account_number": account_number,
                "amount": amount,
                "narration": "Wallet withdrawal",
                "currency": "NGN",
                "reference": transfer_ref,
                "callback_url": f"{os.getenv('BACKEND_URL')}/api/wallet/withdrawal/callback",
                "debit_currency": "NGN"
            }
            
            response = requests.post(
                f'{self.flw_base_url}/transfers',
                json=payload,
                headers=headers,
                timeout=30
            )
            
            if response.status_code != 200:
                return {"success": False, "error": "Transfer initiation failed"}
            
            data = response.json()
            
            if data.get('status') != 'success':
                return {"success": False, "error": data.get('message', 'Transfer failed')}
            
            transfer_data = data.get('data', {})
            transfer_id = transfer_data.get('id')
            
            # Debit user wallet
            new_balance = balance - amount
            self.supabase.table('users').update({
                "wallet_balance": new_balance
            }).eq('id', user_id).execute()
            
            # Record withdrawal transaction
            self.supabase.table('transactions').insert({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "type": "debit",
                "amount": amount,
                "status": "completed",
                "reference": transfer_ref,
                "description": f"Withdrawal to {account_number}",
                "flutterwave_transaction_id": str(transfer_id),
                "created_at": datetime.utcnow().isoformat()
            }).execute()
            
            return {
                "success": True,
                "message": "Withdrawal initiated successfully",
                "amount": amount,
                "new_balance": new_balance,
                "transfer_id": transfer_id
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def get_transactions(self, user_id: str, limit: int = 20) -> Dict[str, Any]:
        """Get real transaction history from database"""
        try:
            response = self.supabase.table('transactions')\
                .select('*')\
                .eq('user_id', user_id)\
                .order('created_at', desc=True)\
                .limit(limit)\
                .execute()
            
            transactions = response.data or []
            
            return {
                "success": True,
                "transactions": transactions,
                "total": len(transactions)
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

# Global instance
production_wallet_service = ProductionWalletService()
