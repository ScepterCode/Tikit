"""
Wallet Withdrawals Module
Handles all withdrawal operations including bank accounts and processing
"""
import uuid
import time
import re
import secrets
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from .wallet_models import (
    Withdrawal, WithdrawalMethod, WithdrawalStatus, BankAccount, WalletType,
    WITHDRAWAL_LIMITS, WITHDRAWAL_FEES, SUPPORTED_BANKS, MOBILE_PROVIDERS
)

class WalletWithdrawalsModule:
    """Handles all withdrawal operations"""
    
    def __init__(self, wallet_service):
        self.wallet_service = wallet_service
        
        # Withdrawal data storage (will be replaced with database)
        self.withdrawals = {}  # withdrawal_id -> withdrawal_data
        self.bank_accounts = {}  # user_id -> [bank_accounts]
        self.mobile_accounts = {}  # user_id -> [mobile_accounts]

    def add_bank_account(self, user_id: str, account_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add bank account for withdrawals"""
        try:
            # Validate account data
            validation = self._validate_bank_account(account_data)
            if not validation["valid"]:
                return {
                    "success": False,
                    "error": validation["error"]
                }
            
            # Verify account with bank (mock implementation)
            verification = self._verify_bank_account(account_data)
            if not verification["verified"]:
                return {
                    "success": False,
                    "error": "Bank account verification failed",
                    "details": verification["error"]
                }
            
            # Store account
            if user_id not in self.bank_accounts:
                self.bank_accounts[user_id] = []
            
            account_id = str(uuid.uuid4())
            bank_account = BankAccount(
                id=account_id,
                user_id=user_id,
                account_number=account_data["account_number"],
                account_name=verification["account_name"],
                bank_code=account_data["bank_code"],
                bank_name=SUPPORTED_BANKS.get(account_data["bank_code"], "Unknown Bank"),
                is_verified=True,
                is_primary=len(self.bank_accounts[user_id]) == 0,
                created_at=time.time()
            )
            
            self.bank_accounts[user_id].append(bank_account.dict())
            
            return {
                "success": True,
                "message": "Bank account added successfully",
                "account": bank_account.dict()
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to add bank account: {str(e)}"
            }

    def get_user_bank_accounts(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user's bank accounts"""
        return self.bank_accounts.get(user_id, [])
    def initiate_withdrawal(self, user_id: str, withdrawal_data: Dict[str, Any]) -> Dict[str, Any]:
        """Initiate a withdrawal request"""
        try:
            # Validate withdrawal data
            validation = self._validate_withdrawal_request(user_id, withdrawal_data)
            if not validation["valid"]:
                return {
                    "success": False,
                    "error": validation["error"]
                }
            
            # Check wallet balance via unified service
            wallet_balance = self.wallet_service.get_wallet_balance(user_id)
            
            # Calculate fees
            fee_calculation = self._calculate_withdrawal_fee(withdrawal_data)
            total_deduction = withdrawal_data["amount"] + fee_calculation["fee"]
            
            # Check sufficient balance
            if wallet_balance < total_deduction:
                return {
                    "success": False,
                    "error": f"Insufficient balance. Required: ₦{total_deduction:,.2f}, Available: ₦{wallet_balance:,.2f}"
                }
            
            # Create withdrawal record
            withdrawal_id = str(uuid.uuid4())
            withdrawal = Withdrawal(
                id=withdrawal_id,
                user_id=user_id,
                amount=withdrawal_data["amount"],
                fee=fee_calculation["fee"],
                total_deduction=total_deduction,
                method=withdrawal_data["method"],
                destination=withdrawal_data["destination"],
                processing_type=withdrawal_data.get("processing_type", "standard"),
                status=WithdrawalStatus.PENDING,
                reference=f"WD{int(time.time())}{withdrawal_id[:8].upper()}",
                estimated_completion=self._calculate_completion_time(withdrawal_data),
                created_at=time.time(),
                updated_at=time.time(),
                metadata=withdrawal_data.get("metadata", {})
            )
            
            self.withdrawals[withdrawal_id] = withdrawal.dict()
            
            return {
                "success": True,
                "message": "Withdrawal request initiated successfully",
                "withdrawal": withdrawal.dict(),
                "next_steps": self._get_next_steps(withdrawal.dict())
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to initiate withdrawal: {str(e)}"
            }

    def process_withdrawal(self, withdrawal_id: str) -> Dict[str, Any]:
        """Process a pending withdrawal"""
        try:
            if withdrawal_id not in self.withdrawals:
                return {
                    "success": False,
                    "error": "Withdrawal not found"
                }
            
            withdrawal = self.withdrawals[withdrawal_id]
            
            if withdrawal["status"] != WithdrawalStatus.PENDING:
                return {
                    "success": False,
                    "error": f"Withdrawal is already {withdrawal['status']}"
                }
            
            # Update status to processing
            withdrawal["status"] = WithdrawalStatus.PROCESSING
            withdrawal["processing_started_at"] = time.time()
            withdrawal["updated_at"] = time.time()
            
            # Deduct from wallet balance via unified service
            deduction_result = self.wallet_service.update_wallet_balance(
                withdrawal["user_id"],
                WalletType.MAIN,
                -withdrawal["total_deduction"],
                f"Withdrawal processing: {withdrawal['reference']}"
            )
            
            if not deduction_result["success"]:
                withdrawal["status"] = WithdrawalStatus.FAILED
                withdrawal["failure_reason"] = "Failed to deduct from wallet"
                withdrawal["updated_at"] = time.time()
                return {
                    "success": False,
                    "error": deduction_result["error"],
                    "withdrawal": withdrawal
                }
            
            # Process based on method
            processing_result = self._process_by_method(withdrawal)
            
            if processing_result["success"]:
                withdrawal["status"] = WithdrawalStatus.COMPLETED
                withdrawal["completed_at"] = time.time()
                withdrawal["transaction_reference"] = processing_result.get("transaction_reference")
            else:
                withdrawal["status"] = WithdrawalStatus.FAILED
                withdrawal["failure_reason"] = processing_result.get("error")
                
                # Refund the amount if processing failed
                self.wallet_service.update_wallet_balance(
                    withdrawal["user_id"],
                    WalletType.MAIN,
                    withdrawal["total_deduction"],
                    f"Withdrawal refund: {withdrawal['reference']}"
                )
            
            withdrawal["updated_at"] = time.time()
            
            return {
                "success": processing_result["success"],
                "message": processing_result.get("message", "Withdrawal processed"),
                "withdrawal": withdrawal
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to process withdrawal: {str(e)}"
            }

    def get_withdrawal_status(self, withdrawal_id: str) -> Dict[str, Any]:
        """Get withdrawal status and details"""
        if withdrawal_id not in self.withdrawals:
            return {
                "success": False,
                "error": "Withdrawal not found"
            }
        
        withdrawal = self.withdrawals[withdrawal_id]
        
        # Calculate progress
        progress = self._calculate_progress(withdrawal)
        
        return {
            "success": True,
            "withdrawal": withdrawal,
            "progress": progress,
            "estimated_completion": withdrawal.get("estimated_completion"),
            "can_cancel": withdrawal["status"] in [WithdrawalStatus.PENDING]
        }

    def cancel_withdrawal(self, withdrawal_id: str, user_id: str) -> Dict[str, Any]:
        """Cancel a pending withdrawal"""
        try:
            if withdrawal_id not in self.withdrawals:
                return {
                    "success": False,
                    "error": "Withdrawal not found"
                }
            
            withdrawal = self.withdrawals[withdrawal_id]
            
            # Verify ownership
            if withdrawal["user_id"] != user_id:
                return {
                    "success": False,
                    "error": "Unauthorized to cancel this withdrawal"
                }
            
            # Check if cancellable
            if withdrawal["status"] not in [WithdrawalStatus.PENDING]:
                return {
                    "success": False,
                    "error": f"Cannot cancel withdrawal with status: {withdrawal['status']}"
                }
            
            # Cancel withdrawal
            withdrawal["status"] = WithdrawalStatus.CANCELLED
            withdrawal["cancelled_at"] = time.time()
            withdrawal["updated_at"] = time.time()
            
            return {
                "success": True,
                "message": "Withdrawal cancelled successfully",
                "withdrawal": withdrawal
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to cancel withdrawal: {str(e)}"
            }

    def get_user_withdrawals(self, user_id: str, limit: int = 50, offset: int = 0) -> Dict[str, Any]:
        """Get user's withdrawal history"""
        user_withdrawals = [
            w for w in self.withdrawals.values() 
            if w["user_id"] == user_id
        ]
        
        # Sort by creation time (newest first)
        user_withdrawals.sort(key=lambda x: x["created_at"], reverse=True)
        
        # Apply pagination
        total = len(user_withdrawals)
        paginated = user_withdrawals[offset:offset + limit]
        
        return {
            "success": True,
            "withdrawals": paginated,
            "total": total,
            "limit": limit,
            "offset": offset,
            "has_more": offset + limit < total
        }

    def _validate_bank_account(self, account_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate bank account data"""
        required_fields = ["account_number", "bank_code"]
        
        for field in required_fields:
            if field not in account_data or not account_data[field]:
                return {
                    "valid": False,
                    "error": f"Missing required field: {field}"
                }
        
        # Validate account number format (10 digits for Nigerian banks)
        account_number = account_data["account_number"]
        if not re.match(r'^\d{10}$', account_number):
            return {
                "valid": False,
                "error": "Account number must be 10 digits"
            }
        
        # Validate bank code
        bank_code = account_data["bank_code"]
        if bank_code not in SUPPORTED_BANKS:
            return {
                "valid": False,
                "error": "Unsupported bank code"
            }
        
        return {"valid": True}

    def _verify_bank_account(self, account_data: Dict[str, Any]) -> Dict[str, Any]:
        """Verify bank account with bank API (mock implementation)"""
        # Mock verification - in production, integrate with bank APIs
        account_number = account_data["account_number"]
        bank_code = account_data["bank_code"]
        
        # Simulate API call delay
        time.sleep(0.1)
        
        # Mock account names based on account number pattern
        mock_names = {
            "0123456789": "John Doe",
            "9876543210": "Jane Smith",
            "1111111111": "Test User"
        }
        
        account_name = mock_names.get(account_number, "Account Holder")
        
        return {
            "verified": True,
            "account_name": account_name,
            "bank_name": SUPPORTED_BANKS[bank_code]
        }

    def _validate_withdrawal_request(self, user_id: str, withdrawal_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate withdrawal request"""
        required_fields = ["amount", "method", "destination"]
        
        for field in required_fields:
            if field not in withdrawal_data:
                return {
                    "valid": False,
                    "error": f"Missing required field: {field}"
                }
        
        # Validate amount
        amount = withdrawal_data["amount"]
        if not isinstance(amount, (int, float)) or amount <= 0:
            return {
                "valid": False,
                "error": "Amount must be a positive number"
            }
        
        # Validate method
        method = withdrawal_data["method"]
        if method not in [m.value for m in WithdrawalMethod]:
            return {
                "valid": False,
                "error": "Invalid withdrawal method"
            }
        
        # Check limits
        limits = WITHDRAWAL_LIMITS[method]
        if amount < limits["min"]:
            return {
                "valid": False,
                "error": f"Minimum withdrawal amount is ₦{limits['min']:,}"
            }
        
        if amount > limits["max"]:
            return {
                "valid": False,
                "error": f"Maximum withdrawal amount is ₦{limits['max']:,}"
            }
        
        return {"valid": True}

    def _calculate_withdrawal_fee(self, withdrawal_data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate withdrawal fee"""
        method = withdrawal_data["method"]
        processing_type = withdrawal_data.get("processing_type", "standard")
        amount = withdrawal_data["amount"]
        
        fees = WITHDRAWAL_FEES[method]
        
        if method == WithdrawalMethod.CRYPTO:
            # Percentage-based fee for crypto
            fee_rate = fees[processing_type] / 100
            fee = amount * fee_rate
        else:
            # Fixed fee for other methods
            fee = fees[processing_type]
        
        return {
            "fee": fee,
            "processing_type": processing_type,
            "fee_description": f"{processing_type.title()} processing fee"
        }

    def _calculate_completion_time(self, withdrawal_data: Dict[str, Any]) -> float:
        """Calculate estimated completion time"""
        processing_type = withdrawal_data.get("processing_type", "standard")
        method = withdrawal_data["method"]
        
        current_time = time.time()
        
        if processing_type == "instant":
            # Instant processing: 5-15 minutes
            return current_time + (10 * 60)
        else:
            # Standard processing varies by method
            if method == WithdrawalMethod.BANK_TRANSFER:
                # Next business day
                return current_time + (24 * 60 * 60)
            elif method == WithdrawalMethod.MOBILE_MONEY:
                # 2-4 hours
                return current_time + (3 * 60 * 60)
            elif method == WithdrawalMethod.CASH_PICKUP:
                # 1-2 hours
                return current_time + (90 * 60)
            else:
                # Default: 24 hours
                return current_time + (24 * 60 * 60)

    def _process_by_method(self, withdrawal: Dict[str, Any]) -> Dict[str, Any]:
        """Process withdrawal based on method"""
        method = withdrawal["method"]
        
        if method == WithdrawalMethod.BANK_TRANSFER:
            return self._process_bank_transfer(withdrawal)
        elif method == WithdrawalMethod.MOBILE_MONEY:
            return self._process_mobile_money(withdrawal)
        elif method == WithdrawalMethod.CASH_PICKUP:
            return self._process_cash_pickup(withdrawal)
        elif method == WithdrawalMethod.CRYPTO:
            return self._process_crypto_withdrawal(withdrawal)
        else:
            return {
                "success": False,
                "error": "Unsupported withdrawal method"
            }

    def _process_bank_transfer(self, withdrawal: Dict[str, Any]) -> Dict[str, Any]:
        """Process bank transfer withdrawal (mock implementation)"""
        # Mock bank transfer processing
        time.sleep(0.2)  # Simulate processing time
        
        return {
            "success": True,
            "message": "Bank transfer initiated successfully",
            "transaction_reference": f"BT{int(time.time())}"
        }

    def _process_mobile_money(self, withdrawal: Dict[str, Any]) -> Dict[str, Any]:
        """Process mobile money withdrawal (mock implementation)"""
        time.sleep(0.1)
        
        return {
            "success": True,
            "message": "Mobile money transfer initiated",
            "transaction_reference": f"MM{int(time.time())}"
        }

    def _process_cash_pickup(self, withdrawal: Dict[str, Any]) -> Dict[str, Any]:
        """Process cash pickup withdrawal (mock implementation)"""
        pickup_code = f"CP{secrets.randbelow(900000) + 100000:06d}"
        
        return {
            "success": True,
            "message": "Cash pickup code generated",
            "transaction_reference": pickup_code,
            "pickup_instructions": "Visit any authorized agent with your ID and pickup code"
        }

    def _process_crypto_withdrawal(self, withdrawal: Dict[str, Any]) -> Dict[str, Any]:
        """Process cryptocurrency withdrawal (mock implementation)"""
        time.sleep(0.3)
        
        return {
            "success": True,
            "message": "Cryptocurrency transfer initiated",
            "transaction_reference": f"CR{int(time.time())}"
        }

    def _calculate_progress(self, withdrawal: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate withdrawal progress"""
        status = withdrawal["status"]
        
        progress_map = {
            WithdrawalStatus.PENDING: 25,
            WithdrawalStatus.PROCESSING: 75,
            WithdrawalStatus.COMPLETED: 100,
            WithdrawalStatus.FAILED: 0,
            WithdrawalStatus.CANCELLED: 0
        }
        
        return {
            "percentage": progress_map.get(status, 0),
            "status": status,
            "status_description": self._get_status_description(status)
        }

    def _get_status_description(self, status: WithdrawalStatus) -> str:
        """Get human-readable status description"""
        descriptions = {
            WithdrawalStatus.PENDING: "Withdrawal request received and pending approval",
            WithdrawalStatus.PROCESSING: "Withdrawal is being processed",
            WithdrawalStatus.COMPLETED: "Withdrawal completed successfully",
            WithdrawalStatus.FAILED: "Withdrawal failed - please contact support",
            WithdrawalStatus.CANCELLED: "Withdrawal was cancelled"
        }
        
        return descriptions.get(status, "Unknown status")

    def _get_next_steps(self, withdrawal: Dict[str, Any]) -> List[str]:
        """Get next steps for withdrawal"""
        method = withdrawal["method"]
        processing_type = withdrawal["processing_type"]
        
        steps = [
            "Withdrawal request has been received",
            "Security verification in progress"
        ]
        
        if processing_type == "instant":
            steps.append("Funds will be transferred within 15 minutes")
        else:
            if method == WithdrawalMethod.BANK_TRANSFER:
                steps.append("Funds will be transferred by next business day")
            elif method == WithdrawalMethod.MOBILE_MONEY:
                steps.append("Funds will be transferred within 2-4 hours")
            elif method == WithdrawalMethod.CASH_PICKUP:
                steps.append("Pickup code will be sent within 1-2 hours")
        
        steps.append("You will receive SMS/Email confirmation when completed")
        
        return steps

    def get_withdrawal_methods(self) -> Dict[str, Any]:
        """Get available withdrawal methods and their details"""
        methods = []
        
        for method in WithdrawalMethod:
            method_info = {
                "method": method.value,
                "name": method.value.replace("_", " ").title(),
                "limits": WITHDRAWAL_LIMITS[method],
                "fees": WITHDRAWAL_FEES[method],
                "processing_times": {
                    "instant": "5-15 minutes",
                    "standard": "2-24 hours"
                }
            }
            methods.append(method_info)
        
        return {
            "methods": methods,
            "supported_banks": SUPPORTED_BANKS,
            "mobile_providers": MOBILE_PROVIDERS
        }

    def clear_user_data(self, user_id: str):
        """Clear all withdrawal data for a user (for testing/cleanup)"""
        # Remove user's withdrawals
        user_withdrawal_ids = [
            w_id for w_id, w in self.withdrawals.items() 
            if w["user_id"] == user_id
        ]
        for w_id in user_withdrawal_ids:
            del self.withdrawals[w_id]
        
        # Remove user's bank accounts
        self.bank_accounts.pop(user_id, None)
        self.mobile_accounts.pop(user_id, None)