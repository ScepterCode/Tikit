"""
Wallet Analytics Module
Handles wallet analytics, spending insights, and reporting
"""
import time
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from .wallet_models import WalletType, TransactionType, WalletAnalytics

class WalletAnalyticsModule:
    """Handles wallet analytics and insights"""
    
    def __init__(self, wallet_service):
        self.wallet_service = wallet_service

    def get_wallet_analytics(self, user_id: str, wallet_type: Optional[str] = None) -> Dict[str, Any]:
        """Get comprehensive wallet analytics for user"""
        try:
            # Get user wallets
            wallets_result = self.wallet_service.get_user_wallets(user_id)
            if not wallets_result["success"]:
                return {"success": False, "error": "Failed to get user wallets"}
            
            wallets = wallets_result["data"]["wallets"]
            
            # Calculate total balance
            total_balance = sum(w["balance"] for w in wallets)
            
            # Calculate wallet distribution
            wallet_distribution = {}
            for wallet in wallets:
                wallet_type_key = wallet["type"]
                percentage = (wallet["balance"] / total_balance * 100) if total_balance > 0 else 0
                wallet_distribution[wallet_type_key] = {
                    "balance": wallet["balance"],
                    "percentage": round(percentage, 2),
                    "name": wallet["name"]
                }
            
            # Get savings performance
            savings_performance = self._get_savings_performance(user_id, wallets)
            
            # Get auto-save summary
            auto_save_summary = self._get_auto_save_summary(user_id)
            
            # Get goals progress
            goals_progress = self._get_goals_progress(user_id)
            
            # Get spending analytics
            spending_analytics = self._get_spending_analytics(user_id)
            
            # Get transaction summary
            transaction_summary = self._get_transaction_summary(user_id)
            
            analytics = WalletAnalytics(
                total_balance=total_balance,
                wallet_distribution=wallet_distribution,
                savings_performance=savings_performance,
                auto_save_summary=auto_save_summary,
                goals_progress=goals_progress,
                spending_analytics=spending_analytics,
                transaction_summary=transaction_summary
            )
            
            return {
                "success": True,
                "data": analytics.dict()
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to get wallet analytics: {str(e)}"
            }

    def get_spending_analytics(self, user_id: str, period: str = "month") -> Dict[str, Any]:
        """Get detailed spending analytics for a period"""
        try:
            # Get transactions for the period
            transactions = self._get_transactions_for_period(user_id, period)
            
            # Calculate spending by category
            spending_by_category = {}
            spending_by_day = {}
            total_spent = 0
            total_received = 0
            
            for transaction in transactions:
                amount = transaction["amount"]
                transaction_type = transaction["type"]
                created_at = transaction["created_at"]
                
                # Convert timestamp to date string
                date_str = datetime.fromtimestamp(created_at).strftime("%Y-%m-%d")
                
                if transaction_type in ["withdrawal", "transfer", "spray_money", "fee"]:
                    total_spent += amount
                    
                    # Category spending
                    category = transaction.get("metadata", {}).get("category", "other")
                    if category not in spending_by_category:
                        spending_by_category[category] = 0
                    spending_by_category[category] += amount
                    
                    # Daily spending
                    if date_str not in spending_by_day:
                        spending_by_day[date_str] = {"spent": 0, "received": 0}
                    spending_by_day[date_str]["spent"] += amount
                
                elif transaction_type in ["deposit", "topup", "refund", "interest"]:
                    total_received += amount
                    
                    # Daily received
                    if date_str not in spending_by_day:
                        spending_by_day[date_str] = {"spent": 0, "received": 0}
                    spending_by_day[date_str]["received"] += amount
            
            # Calculate averages
            days_in_period = len(spending_by_day) if spending_by_day else 1
            avg_daily_spending = total_spent / days_in_period
            avg_daily_income = total_received / days_in_period
            
            # Find top spending categories
            top_categories = sorted(
                spending_by_category.items(),
                key=lambda x: x[1],
                reverse=True
            )[:5]
            
            return {
                "success": True,
                "data": {
                    "period": period,
                    "total_spent": total_spent,
                    "total_received": total_received,
                    "net_change": total_received - total_spent,
                    "avg_daily_spending": avg_daily_spending,
                    "avg_daily_income": avg_daily_income,
                    "spending_by_category": dict(spending_by_category),
                    "spending_by_day": spending_by_day,
                    "top_categories": top_categories,
                    "transaction_count": len(transactions)
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to get spending analytics: {str(e)}"
            }

    def get_savings_insights(self, user_id: str) -> Dict[str, Any]:
        """Get savings insights and recommendations"""
        try:
            # Get user wallets
            wallets_result = self.wallet_service.get_user_wallets(user_id)
            if not wallets_result["success"]:
                return {"success": False, "error": "Failed to get user wallets"}
            
            wallets = wallets_result["data"]["wallets"]
            
            # Find savings wallet
            savings_wallet = None
            for wallet in wallets:
                if wallet["type"] == WalletType.SAVINGS:
                    savings_wallet = wallet
                    break
            
            if not savings_wallet:
                return {
                    "success": True,
                    "data": {
                        "has_savings_wallet": False,
                        "recommendations": ["Create a savings wallet to start earning interest"]
                    }
                }
            
            # Calculate savings insights
            current_balance = savings_wallet["balance"]
            interest_rate = savings_wallet.get("interest_rate", 0)
            total_interest_earned = savings_wallet.get("metadata", {}).get("total_interest_earned", 0)
            
            # Calculate projected earnings
            monthly_interest = (current_balance * (interest_rate / 100)) / 12
            yearly_interest = current_balance * (interest_rate / 100)
            
            # Get savings recommendations
            recommendations = self._get_savings_recommendations(user_id, current_balance)
            
            return {
                "success": True,
                "data": {
                    "has_savings_wallet": True,
                    "current_balance": current_balance,
                    "interest_rate": interest_rate,
                    "total_interest_earned": total_interest_earned,
                    "projected_monthly_interest": monthly_interest,
                    "projected_yearly_interest": yearly_interest,
                    "recommendations": recommendations
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to get savings insights: {str(e)}"
            }

    def _get_savings_performance(self, user_id: str, wallets: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Get savings wallet performance metrics"""
        savings_wallet = None
        for wallet in wallets:
            if wallet["type"] == WalletType.SAVINGS:
                savings_wallet = wallet
                break
        
        if not savings_wallet:
            return {}
        
        current_balance = savings_wallet["balance"]
        interest_rate = savings_wallet.get("interest_rate", 0)
        total_interest_earned = savings_wallet.get("metadata", {}).get("total_interest_earned", 0)
        created_at = savings_wallet.get("created_at", time.time())
        
        days_since_creation = (time.time() - created_at) / (24 * 60 * 60)
        projected_yearly_interest = current_balance * (interest_rate / 100)
        
        return {
            "current_balance": current_balance,
            "interest_rate": interest_rate,
            "total_interest_earned": total_interest_earned,
            "days_since_creation": int(days_since_creation),
            "projected_yearly_interest": projected_yearly_interest
        }

    def _get_auto_save_summary(self, user_id: str) -> Dict[str, Any]:
        """Get auto-save rules summary"""
        # This would integrate with the multi-wallet service's auto-save rules
        # For now, return empty summary
        return {
            "total_saved": 0,
            "active_rules": 0,
            "rules": []
        }

    def _get_goals_progress(self, user_id: str) -> List[Dict[str, Any]]:
        """Get savings goals progress"""
        # This would integrate with the multi-wallet service's savings goals
        # For now, return empty list
        return []

    def _get_spending_analytics(self, user_id: str) -> Dict[str, Any]:
        """Get basic spending analytics"""
        try:
            # Get recent transactions
            transactions = self._get_transactions_for_period(user_id, "month")
            
            total_spent = 0
            total_transactions = len(transactions)
            
            for transaction in transactions:
                if transaction["type"] in ["withdrawal", "transfer", "spray_money", "fee"]:
                    total_spent += transaction["amount"]
            
            avg_transaction = total_spent / total_transactions if total_transactions > 0 else 0
            
            return {
                "total_spent_this_month": total_spent,
                "total_transactions": total_transactions,
                "avg_transaction_amount": avg_transaction
            }
            
        except Exception:
            return {
                "total_spent_this_month": 0,
                "total_transactions": 0,
                "avg_transaction_amount": 0
            }

    def _get_transaction_summary(self, user_id: str) -> Dict[str, Any]:
        """Get transaction summary"""
        try:
            # Get all user transactions
            all_transactions = self.wallet_service.get_user_transactions(user_id, {"limit": 1000})
            
            if not all_transactions.get("success", False):
                return {}
            
            transactions = all_transactions.get("data", {}).get("transactions", [])
            
            # Count by type
            type_counts = {}
            for transaction in transactions:
                t_type = transaction["type"]
                type_counts[t_type] = type_counts.get(t_type, 0) + 1
            
            # Recent activity (last 7 days)
            week_ago = time.time() - (7 * 24 * 60 * 60)
            recent_transactions = [
                t for t in transactions 
                if t["created_at"] > week_ago
            ]
            
            return {
                "total_transactions": len(transactions),
                "transactions_by_type": type_counts,
                "recent_activity": len(recent_transactions),
                "last_transaction": transactions[0] if transactions else None
            }
            
        except Exception:
            return {}

    def _get_transactions_for_period(self, user_id: str, period: str) -> List[Dict[str, Any]]:
        """Get transactions for a specific period"""
        try:
            # Calculate period start time
            current_time = time.time()
            
            if period == "week":
                start_time = current_time - (7 * 24 * 60 * 60)
            elif period == "month":
                start_time = current_time - (30 * 24 * 60 * 60)
            elif period == "year":
                start_time = current_time - (365 * 24 * 60 * 60)
            else:
                start_time = current_time - (30 * 24 * 60 * 60)  # Default to month
            
            # Get transactions from unified service
            transactions_result = self.wallet_service.get_user_transactions(
                user_id, 
                {
                    "start_date": start_time,
                    "limit": 1000
                }
            )
            
            if transactions_result.get("success", False):
                return transactions_result.get("data", {}).get("transactions", [])
            else:
                return []
                
        except Exception:
            return []

    def _get_savings_recommendations(self, user_id: str, current_savings: float) -> List[str]:
        """Get personalized savings recommendations"""
        recommendations = []
        
        if current_savings < 10000:
            recommendations.append("Try to save at least ₦10,000 to start earning meaningful interest")
        
        if current_savings < 50000:
            recommendations.append("Consider setting up an auto-save rule to reach ₦50,000 faster")
        
        recommendations.append("Review your spending categories to find areas where you can save more")
        
        if current_savings > 100000:
            recommendations.append("Great job! Consider creating specific savings goals for motivation")
        
        return recommendations

    def export_analytics_data(self, user_id: str, format: str = "json") -> Dict[str, Any]:
        """Export analytics data in various formats"""
        try:
            # Get comprehensive analytics
            analytics_result = self.get_wallet_analytics(user_id)
            
            if not analytics_result["success"]:
                return analytics_result
            
            analytics_data = analytics_result["data"]
            
            if format.lower() == "json":
                return {
                    "success": True,
                    "data": analytics_data,
                    "format": "json",
                    "exported_at": time.time()
                }
            elif format.lower() == "csv":
                # Convert to CSV format (simplified)
                csv_data = self._convert_to_csv(analytics_data)
                return {
                    "success": True,
                    "data": csv_data,
                    "format": "csv",
                    "exported_at": time.time()
                }
            else:
                return {
                    "success": False,
                    "error": f"Unsupported export format: {format}"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to export analytics data: {str(e)}"
            }

    def _convert_to_csv(self, analytics_data: Dict[str, Any]) -> str:
        """Convert analytics data to CSV format"""
        # Simple CSV conversion for wallet distribution
        csv_lines = ["Wallet Type,Balance,Percentage"]
        
        for wallet_type, data in analytics_data.get("wallet_distribution", {}).items():
            csv_lines.append(f"{wallet_type},{data['balance']},{data['percentage']}")
        
        return "\n".join(csv_lines)

    def get_financial_health_score(self, user_id: str) -> Dict[str, Any]:
        """Calculate user's financial health score"""
        try:
            # Get wallet analytics
            analytics_result = self.get_wallet_analytics(user_id)
            if not analytics_result["success"]:
                return {"success": False, "error": "Failed to get analytics"}
            
            analytics = analytics_result["data"]
            
            score = 0
            max_score = 100
            factors = []
            
            # Factor 1: Has savings (20 points)
            savings_balance = 0
            for wallet_type, data in analytics["wallet_distribution"].items():
                if wallet_type == WalletType.SAVINGS:
                    savings_balance = data["balance"]
                    break
            
            if savings_balance > 0:
                score += 20
                factors.append("Has active savings wallet")
            
            # Factor 2: Savings ratio (30 points)
            total_balance = analytics["total_balance"]
            if total_balance > 0:
                savings_ratio = savings_balance / total_balance
                if savings_ratio >= 0.2:  # 20% or more in savings
                    score += 30
                    factors.append("Good savings ratio (20%+)")
                elif savings_ratio >= 0.1:  # 10-20% in savings
                    score += 20
                    factors.append("Decent savings ratio (10-20%)")
                elif savings_ratio > 0:  # Some savings
                    score += 10
                    factors.append("Has some savings")
            
            # Factor 3: Regular transactions (20 points)
            transaction_summary = analytics.get("transaction_summary", {})
            recent_activity = transaction_summary.get("recent_activity", 0)
            if recent_activity >= 5:
                score += 20
                factors.append("Active transaction history")
            elif recent_activity >= 2:
                score += 10
                factors.append("Some recent activity")
            
            # Factor 4: Diversified wallets (15 points)
            wallet_count = len(analytics["wallet_distribution"])
            if wallet_count >= 3:
                score += 15
                factors.append("Uses multiple wallet types")
            elif wallet_count >= 2:
                score += 10
                factors.append("Uses multiple wallets")
            
            # Factor 5: Interest earnings (15 points)
            savings_performance = analytics.get("savings_performance", {})
            total_interest = savings_performance.get("total_interest_earned", 0)
            if total_interest > 0:
                score += 15
                factors.append("Earning interest on savings")
            
            # Determine health level
            if score >= 80:
                health_level = "Excellent"
            elif score >= 60:
                health_level = "Good"
            elif score >= 40:
                health_level = "Fair"
            else:
                health_level = "Needs Improvement"
            
            return {
                "success": True,
                "data": {
                    "score": score,
                    "max_score": max_score,
                    "percentage": round((score / max_score) * 100, 1),
                    "health_level": health_level,
                    "factors": factors,
                    "calculated_at": time.time()
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to calculate financial health score: {str(e)}"
            }