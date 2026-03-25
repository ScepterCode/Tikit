"""
Multi-Wallet System Service
Manages multiple wallet types for different purposes
"""
import uuid
import time
from typing import Dict, Any, Optional, List
from enum import Enum
from datetime import datetime, timedelta

class WalletType(str, Enum):
    MAIN = "main"           # Primary spending wallet
    SAVINGS = "savings"     # High-yield savings wallet
    BUSINESS = "business"   # For organizers/business transactions
    ESCROW = "escrow"      # For disputed transactions

class AutoSaveRule(str, Enum):
    ROUND_UP = "round_up"           # Round up purchases to nearest ₦100
    PERCENTAGE = "percentage"       # Save percentage of income
    FIXED_AMOUNT = "fixed_amount"   # Save fixed amount daily/weekly/monthly
    GOAL_BASED = "goal_based"      # Save towards specific goal

class MultiWalletService:
    def __init__(self):
        # Wallet storage
        self.user_wallets: Dict[str, Dict[str, Dict[str, Any]]] = {}  # user_id -> wallet_type -> wallet_data
        self.wallet_transactions: Dict[str, List[str]] = {}  # wallet_id -> [transaction_ids]
        
        # Auto-save rules
        self.auto_save_rules: Dict[str, List[Dict[str, Any]]] = {}  # user_id -> [rules]
        
        # Savings goals
        self.savings_goals: Dict[str, List[Dict[str, Any]]] = {}  # user_id -> [goals]
        
        # Interest rates (annual percentage)
        self.INTEREST_RATES = {
            WalletType.MAIN: 0.0,      # No interest
            WalletType.SAVINGS: 8.5,   # 8.5% annual interest
            WalletType.BUSINESS: 2.0,  # 2% annual interest
            WalletType.ESCROW: 0.0     # No interest
        }
        
        # Transfer limits and fees
        self.TRANSFER_LIMITS = {
            "daily_limit": 1000000,    # ₦1M daily transfer limit
            "monthly_limit": 10000000, # ₦10M monthly transfer limit
            "min_transfer": 100,       # ₦100 minimum transfer
        }
        
        self.TRANSFER_FEES = {
            "internal": 0,             # Free internal transfers
            "external": 50,            # ₦50 for external transfers
            "instant": 100             # ₦100 for instant transfers
        }

    def initialize_user_wallets(self, user_id: str, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Initialize default wallets for a new user"""
        if user_id in self.user_wallets:
            return {"success": False, "error": "User wallets already exist"}
        
        current_time = time.time()
        self.user_wallets[user_id] = {}
        
        # Create main wallet (required)
        main_wallet = {
            "id": str(uuid.uuid4()),
            "type": WalletType.MAIN,
            "name": "Main Wallet",
            "balance": user_data.get("initial_balance", 0),
            "currency": "NGN",
            "is_active": True,
            "is_default": True,
            "created_at": current_time,
            "updated_at": current_time,
            "restrictions": {
                "daily_spend_limit": 500000,  # ₦500k daily spending limit
                "transaction_limit": 100000,  # ₦100k per transaction
                "requires_pin": True
            },
            "metadata": {
                "last_transaction": None,
                "total_transactions": 0,
                "total_spent": 0,
                "total_received": 0
            }
        }
        
        self.user_wallets[user_id][WalletType.MAIN] = main_wallet
        
        # Create savings wallet (optional, but recommended)
        savings_wallet = {
            "id": str(uuid.uuid4()),
            "type": WalletType.SAVINGS,
            "name": "Savings Wallet",
            "balance": 0,
            "currency": "NGN",
            "is_active": True,
            "is_default": False,
            "created_at": current_time,
            "updated_at": current_time,
            "interest_rate": self.INTEREST_RATES[WalletType.SAVINGS],
            "last_interest_calculation": current_time,
            "restrictions": {
                "withdrawal_notice_period": 24,  # 24 hours notice for withdrawals
                "min_balance": 1000,             # ₦1000 minimum balance
                "requires_pin": True
            },
            "metadata": {
                "total_interest_earned": 0,
                "interest_payments": [],
                "last_transaction": None,
                "total_transactions": 0,
                "total_spent": 0,
                "total_received": 0
            }
        }
        
        self.user_wallets[user_id][WalletType.SAVINGS] = savings_wallet
        
        # Create business wallet for organizers
        if user_data.get("role") == "organizer":
            business_wallet = {
                "id": str(uuid.uuid4()),
                "type": WalletType.BUSINESS,
                "name": "Business Wallet",
                "balance": 0,
                "currency": "NGN",
                "is_active": True,
                "is_default": False,
                "created_at": current_time,
                "updated_at": current_time,
                "business_info": {
                    "business_name": user_data.get("organization_name", ""),
                    "business_type": user_data.get("organization_type", ""),
                    "tax_id": user_data.get("tax_id", "")
                },
                "restrictions": {
                    "requires_verification": True,
                    "requires_pin": True,
                    "business_only": True
                },
                "metadata": {
                    "revenue_tracking": True,
                    "expense_tracking": True,
                    "tax_year_summary": {}
                }
            }
            
            self.user_wallets[user_id][WalletType.BUSINESS] = business_wallet
        
        return {
            "success": True,
            "message": "User wallets initialized successfully",
            "wallets": self.user_wallets[user_id]
        }

    def get_user_wallets(self, user_id: str) -> Dict[str, Any]:
        """Get all wallets for a user"""
        if user_id not in self.user_wallets:
            return {"success": False, "error": "No wallets found for user"}
        
        wallets = self.user_wallets[user_id]
        
        # Calculate total balance across all wallets
        total_balance = sum(wallet["balance"] for wallet in wallets.values())
        
        # Get wallet summaries
        wallet_summaries = []
        for wallet_type, wallet in wallets.items():
            summary = {
                "id": wallet["id"],
                "type": wallet["type"],
                "name": wallet["name"],
                "balance": wallet["balance"],
                "currency": wallet["currency"],
                "is_active": wallet["is_active"],
                "is_default": wallet["is_default"],
                "interest_rate": wallet.get("interest_rate", 0),
                "restrictions": wallet["restrictions"],
                "last_updated": wallet["updated_at"]
            }
            
            # Add type-specific information
            if wallet_type == WalletType.SAVINGS:
                summary["total_interest_earned"] = wallet["metadata"]["total_interest_earned"]
                summary["next_interest_payment"] = self._calculate_next_interest_payment(wallet)
            elif wallet_type == WalletType.BUSINESS:
                summary["business_info"] = wallet.get("business_info", {})
            
            wallet_summaries.append(summary)
        
        return {
            "success": True,
            "data": {
                "wallets": wallet_summaries,
                "total_balance": total_balance,
                "active_wallets": len([w for w in wallets.values() if w["is_active"]]),
                "default_wallet": next((w for w in wallets.values() if w["is_default"]), None)
            }
        }

    def transfer_between_wallets(self, user_id: str, transfer_data: Dict[str, Any]) -> Dict[str, Any]:
        """Transfer funds between user's wallets"""
        try:
            from_wallet_type = transfer_data["from_wallet"]
            to_wallet_type = transfer_data["to_wallet"]
            amount = float(transfer_data["amount"])
            description = transfer_data.get("description", "Internal wallet transfer")
            
            # Validate user has wallets
            if user_id not in self.user_wallets:
                return {"success": False, "error": "User wallets not found"}
            
            user_wallets = self.user_wallets[user_id]
            
            # Validate wallets exist
            if from_wallet_type not in user_wallets or to_wallet_type not in user_wallets:
                return {"success": False, "error": "Invalid wallet type"}
            
            from_wallet = user_wallets[from_wallet_type]
            to_wallet = user_wallets[to_wallet_type]
            
            # Validate wallets are active
            if not from_wallet["is_active"] or not to_wallet["is_active"]:
                return {"success": False, "error": "One or both wallets are inactive"}
            
            # Validate amount
            if amount <= 0:
                return {"success": False, "error": "Transfer amount must be positive"}
            
            if amount < self.TRANSFER_LIMITS["min_transfer"]:
                return {"success": False, "error": f"Minimum transfer amount is ₦{self.TRANSFER_LIMITS['min_transfer']:,}"}
            
            # Check sufficient balance
            if from_wallet["balance"] < amount:
                return {"success": False, "error": "Insufficient balance in source wallet"}
            
            # Check savings wallet restrictions
            if from_wallet_type == WalletType.SAVINGS:
                min_balance = from_wallet["restrictions"]["min_balance"]
                if from_wallet["balance"] - amount < min_balance:
                    return {"success": False, "error": f"Transfer would violate minimum balance requirement (₦{min_balance:,})"}
            
            # Calculate fees (internal transfers are free)
            fee = self.TRANSFER_FEES["internal"]
            
            # Perform transfer
            current_time = time.time()
            
            # Deduct from source wallet
            from_wallet["balance"] -= amount
            from_wallet["updated_at"] = current_time
            from_wallet["metadata"]["total_spent"] += amount
            from_wallet["metadata"]["total_transactions"] += 1
            from_wallet["metadata"]["last_transaction"] = current_time
            
            # Add to destination wallet
            to_wallet["balance"] += amount
            to_wallet["updated_at"] = current_time
            to_wallet["metadata"]["total_received"] += amount
            to_wallet["metadata"]["total_transactions"] += 1
            to_wallet["metadata"]["last_transaction"] = current_time
            
            # Create transfer record
            transfer_id = str(uuid.uuid4())
            transfer_record = {
                "id": transfer_id,
                "user_id": user_id,
                "from_wallet": from_wallet_type,
                "to_wallet": to_wallet_type,
                "amount": amount,
                "fee": fee,
                "description": description,
                "status": "completed",
                "created_at": current_time,
                "reference": f"INT{int(current_time)}{transfer_id[:8].upper()}"
            }
            
            return {
                "success": True,
                "message": "Transfer completed successfully",
                "data": {
                    "transfer": transfer_record,
                    "from_wallet_balance": from_wallet["balance"],
                    "to_wallet_balance": to_wallet["balance"]
                }
            }
            
        except Exception as e:
            return {"success": False, "error": f"Transfer failed: {str(e)}"}

    def set_auto_save_rule(self, user_id: str, rule_data: Dict[str, Any]) -> Dict[str, Any]:
        """Set up automatic savings rule"""
        try:
            rule_type = rule_data["type"]
            target_wallet = rule_data.get("target_wallet", WalletType.SAVINGS)
            
            # Validate rule type
            if rule_type not in [rule.value for rule in AutoSaveRule]:
                return {"success": False, "error": "Invalid auto-save rule type"}
            
            # Validate user has target wallet
            if user_id not in self.user_wallets or target_wallet not in self.user_wallets[user_id]:
                return {"success": False, "error": "Target wallet not found"}
            
            rule_id = str(uuid.uuid4())
            current_time = time.time()
            
            auto_save_rule = {
                "id": rule_id,
                "type": rule_type,
                "target_wallet": target_wallet,
                "is_active": True,
                "created_at": current_time,
                "updated_at": current_time,
                "total_saved": 0,
                "last_execution": None
            }
            
            # Add rule-specific configuration
            if rule_type == AutoSaveRule.ROUND_UP:
                auto_save_rule["round_up_to"] = rule_data.get("round_up_to", 100)  # Round to nearest ₦100
            elif rule_type == AutoSaveRule.PERCENTAGE:
                auto_save_rule["percentage"] = rule_data.get("percentage", 10)  # 10% of income
                auto_save_rule["income_sources"] = rule_data.get("income_sources", ["topup", "spray_money"])
            elif rule_type == AutoSaveRule.FIXED_AMOUNT:
                auto_save_rule["amount"] = rule_data.get("amount", 1000)  # ₦1000
                auto_save_rule["frequency"] = rule_data.get("frequency", "weekly")  # daily, weekly, monthly
            elif rule_type == AutoSaveRule.GOAL_BASED:
                auto_save_rule["goal_amount"] = rule_data.get("goal_amount", 100000)  # ₦100k goal
                auto_save_rule["goal_name"] = rule_data.get("goal_name", "Savings Goal")
                auto_save_rule["target_date"] = rule_data.get("target_date")
                auto_save_rule["weekly_target"] = self._calculate_weekly_target(
                    rule_data.get("goal_amount", 100000),
                    rule_data.get("target_date")
                )
            
            # Store rule
            if user_id not in self.auto_save_rules:
                self.auto_save_rules[user_id] = []
            
            self.auto_save_rules[user_id].append(auto_save_rule)
            
            return {
                "success": True,
                "message": "Auto-save rule created successfully",
                "data": {"rule": auto_save_rule}
            }
            
        except Exception as e:
            return {"success": False, "error": f"Failed to create auto-save rule: {str(e)}"}

    def create_savings_goal(self, user_id: str, goal_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a savings goal"""
        try:
            goal_id = str(uuid.uuid4())
            current_time = time.time()
            
            savings_goal = {
                "id": goal_id,
                "name": goal_data["name"],
                "description": goal_data.get("description", ""),
                "target_amount": float(goal_data["target_amount"]),
                "current_amount": 0,
                "target_date": goal_data.get("target_date"),
                "category": goal_data.get("category", "general"),
                "is_active": True,
                "created_at": current_time,
                "updated_at": current_time,
                "contributions": [],
                "milestones": self._generate_milestones(float(goal_data["target_amount"]))
            }
            
            # Calculate weekly/monthly targets
            if goal_data.get("target_date"):
                target_date_str = goal_data["target_date"]
                # Convert date string to timestamp
                if isinstance(target_date_str, str):
                    from datetime import datetime
                    target_date = datetime.strptime(target_date_str, "%Y-%m-%d")
                    target_timestamp = target_date.timestamp()
                else:
                    target_timestamp = float(target_date_str)
                
                weeks_remaining = max(1, (target_timestamp - current_time) / (7 * 24 * 60 * 60))
                savings_goal["weekly_target"] = savings_goal["target_amount"] / weeks_remaining
                savings_goal["monthly_target"] = savings_goal["weekly_target"] * 4.33
            
            # Store goal
            if user_id not in self.savings_goals:
                self.savings_goals[user_id] = []
            
            self.savings_goals[user_id].append(savings_goal)
            
            return {
                "success": True,
                "message": "Savings goal created successfully",
                "data": {"goal": savings_goal}
            }
            
        except Exception as e:
            return {"success": False, "error": f"Failed to create savings goal: {str(e)}"}

    def contribute_to_goal(self, user_id: str, goal_id: str, amount: float, source_wallet: str = WalletType.MAIN) -> Dict[str, Any]:
        """Contribute to a savings goal"""
        try:
            # Find the goal
            if user_id not in self.savings_goals:
                return {"success": False, "error": "No savings goals found"}
            
            goal = None
            for g in self.savings_goals[user_id]:
                if g["id"] == goal_id:
                    goal = g
                    break
            
            if not goal:
                return {"success": False, "error": "Savings goal not found"}
            
            if not goal["is_active"]:
                return {"success": False, "error": "Savings goal is not active"}
            
            # Transfer from source wallet to savings wallet
            transfer_result = self.transfer_between_wallets(user_id, {
                "from_wallet": source_wallet,
                "to_wallet": WalletType.SAVINGS,
                "amount": amount,
                "description": f"Contribution to {goal['name']}"
            })
            
            if not transfer_result["success"]:
                return transfer_result
            
            # Update goal
            current_time = time.time()
            goal["current_amount"] += amount
            goal["updated_at"] = current_time
            
            # Record contribution
            contribution = {
                "id": str(uuid.uuid4()),
                "amount": amount,
                "source_wallet": source_wallet,
                "timestamp": current_time,
                "transfer_reference": transfer_result["data"]["transfer"]["reference"]
            }
            
            goal["contributions"].append(contribution)
            
            # Check if goal is completed
            progress_percentage = (goal["current_amount"] / goal["target_amount"]) * 100
            is_completed = goal["current_amount"] >= goal["target_amount"]
            
            if is_completed and goal["is_active"]:
                goal["is_active"] = False
                goal["completed_at"] = current_time
            
            return {
                "success": True,
                "message": "Contribution added successfully",
                "data": {
                    "goal": goal,
                    "contribution": contribution,
                    "progress_percentage": progress_percentage,
                    "is_completed": is_completed,
                    "remaining_amount": max(0, goal["target_amount"] - goal["current_amount"])
                }
            }
            
        except Exception as e:
            return {"success": False, "error": f"Failed to contribute to goal: {str(e)}"}

    def calculate_daily_interest(self, user_id: str) -> Dict[str, Any]:
        """Calculate and apply daily interest to savings wallets"""
        if user_id not in self.user_wallets:
            return {"success": False, "error": "User wallets not found"}
        
        user_wallets = self.user_wallets[user_id]
        
        if WalletType.SAVINGS not in user_wallets:
            return {"success": False, "error": "No savings wallet found"}
        
        savings_wallet = user_wallets[WalletType.SAVINGS]
        current_time = time.time()
        
        # Check if interest was already calculated today
        last_calculation = savings_wallet.get("last_interest_calculation", 0)
        if current_time - last_calculation < 24 * 60 * 60:  # Less than 24 hours
            return {"success": False, "error": "Interest already calculated today"}
        
        # Calculate daily interest
        annual_rate = savings_wallet["interest_rate"] / 100  # Convert percentage to decimal
        daily_rate = annual_rate / 365
        balance = savings_wallet["balance"]
        
        if balance < savings_wallet["restrictions"]["min_balance"]:
            return {"success": False, "error": "Balance below minimum for interest calculation"}
        
        daily_interest = balance * daily_rate
        
        # Apply interest
        savings_wallet["balance"] += daily_interest
        savings_wallet["last_interest_calculation"] = current_time
        savings_wallet["updated_at"] = current_time
        savings_wallet["metadata"]["total_interest_earned"] += daily_interest
        
        # Record interest payment
        interest_payment = {
            "id": str(uuid.uuid4()),
            "amount": daily_interest,
            "balance_before": balance,
            "balance_after": savings_wallet["balance"],
            "rate_applied": daily_rate,
            "timestamp": current_time,
            "type": "daily_interest"
        }
        
        savings_wallet["metadata"]["interest_payments"].append(interest_payment)
        
        # Keep only last 365 interest payments
        if len(savings_wallet["metadata"]["interest_payments"]) > 365:
            savings_wallet["metadata"]["interest_payments"] = savings_wallet["metadata"]["interest_payments"][-365:]
        
        return {
            "success": True,
            "message": "Daily interest calculated and applied",
            "data": {
                "interest_earned": daily_interest,
                "new_balance": savings_wallet["balance"],
                "total_interest_earned": savings_wallet["metadata"]["total_interest_earned"],
                "annual_rate": savings_wallet["interest_rate"],
                "next_calculation": current_time + (24 * 60 * 60)
            }
        }

    def reset_interest_calculation(self, user_id: str) -> Dict[str, Any]:
        """Reset interest calculation timestamp for testing purposes"""
        if user_id not in self.user_wallets:
            return {"success": False, "error": "User wallets not found"}
        
        user_wallets = self.user_wallets[user_id]
        
        if WalletType.SAVINGS not in user_wallets:
            return {"success": False, "error": "No savings wallet found"}
        
        savings_wallet = user_wallets[WalletType.SAVINGS]
        savings_wallet["last_interest_calculation"] = 0  # Reset to allow new calculation
        
        return {
            "success": True,
            "message": "Interest calculation timestamp reset"
        }

    def get_wallet_analytics(self, user_id: str, wallet_type: str = None) -> Dict[str, Any]:
        """Get analytics for user's wallets"""
        if user_id not in self.user_wallets:
            return {"success": False, "error": "User wallets not found"}
        
        user_wallets = self.user_wallets[user_id]
        
        if wallet_type and wallet_type not in user_wallets:
            return {"success": False, "error": "Wallet type not found"}
        
        wallets_to_analyze = {wallet_type: user_wallets[wallet_type]} if wallet_type else user_wallets
        
        analytics = {
            "total_balance": sum(w["balance"] for w in user_wallets.values()),
            "wallet_distribution": {
                wt: {
                    "balance": w["balance"],
                    "percentage": (w["balance"] / sum(uw["balance"] for uw in user_wallets.values())) * 100 if sum(uw["balance"] for uw in user_wallets.values()) > 0 else 0
                }
                for wt, w in user_wallets.items()
            },
            "savings_performance": {},
            "auto_save_summary": {},
            "goals_progress": []
        }
        
        # Savings wallet analytics
        if WalletType.SAVINGS in user_wallets:
            savings_wallet = user_wallets[WalletType.SAVINGS]
            analytics["savings_performance"] = {
                "total_interest_earned": savings_wallet["metadata"]["total_interest_earned"],
                "current_balance": savings_wallet["balance"],
                "interest_rate": savings_wallet["interest_rate"],
                "days_since_creation": (time.time() - savings_wallet["created_at"]) / (24 * 60 * 60),
                "projected_yearly_interest": savings_wallet["balance"] * (savings_wallet["interest_rate"] / 100)
            }
        
        # Auto-save rules summary
        if user_id in self.auto_save_rules:
            total_auto_saved = sum(rule["total_saved"] for rule in self.auto_save_rules[user_id])
            active_rules = len([rule for rule in self.auto_save_rules[user_id] if rule["is_active"]])
            
            analytics["auto_save_summary"] = {
                "total_saved": total_auto_saved,
                "active_rules": active_rules,
                "rules": self.auto_save_rules[user_id]
            }
        
        # Savings goals progress
        if user_id in self.savings_goals:
            for goal in self.savings_goals[user_id]:
                progress = {
                    "id": goal["id"],
                    "name": goal["name"],
                    "progress_percentage": (goal["current_amount"] / goal["target_amount"]) * 100,
                    "remaining_amount": goal["target_amount"] - goal["current_amount"],
                    "is_completed": goal["current_amount"] >= goal["target_amount"],
                    "days_remaining": None
                }
                
                if goal.get("target_date"):
                    target_date = goal["target_date"]
                    # Handle both string and timestamp formats
                    if isinstance(target_date, str):
                        from datetime import datetime
                        target_timestamp = datetime.strptime(target_date, "%Y-%m-%d").timestamp()
                    else:
                        target_timestamp = float(target_date)
                    
                    days_remaining = max(0, (target_timestamp - time.time()) / (24 * 60 * 60))
                    progress["days_remaining"] = int(days_remaining)
                
                analytics["goals_progress"].append(progress)
        
        return {
            "success": True,
            "data": analytics
        }

    def _calculate_next_interest_payment(self, wallet: Dict[str, Any]) -> float:
        """Calculate when next interest payment is due"""
        last_calculation = wallet.get("last_interest_calculation", wallet["created_at"])
        next_payment = last_calculation + (24 * 60 * 60)  # Next day
        return next_payment

    def _calculate_weekly_target(self, goal_amount: float, target_date: Optional[float]) -> float:
        """Calculate weekly savings target for goal"""
        if not target_date:
            return goal_amount / 52  # Default to 1 year
        
        weeks_remaining = max(1, (target_date - time.time()) / (7 * 24 * 60 * 60))
        return goal_amount / weeks_remaining

    def _generate_milestones(self, target_amount: float) -> List[Dict[str, Any]]:
        """Generate milestone markers for savings goal"""
        milestones = []
        percentages = [25, 50, 75, 90, 100]
        
        for percentage in percentages:
            milestone_amount = (target_amount * percentage) / 100
            milestones.append({
                "percentage": percentage,
                "amount": milestone_amount,
                "achieved": False,
                "achieved_at": None
            })
        
        return milestones

# Global instance
multi_wallet_service = MultiWalletService()