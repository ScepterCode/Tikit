"""
Enhanced Transaction History Service
Provides comprehensive transaction tracking, filtering, and analytics
"""
import uuid
import time
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from enum import Enum
import json

class TransactionType(str, Enum):
    TOPUP = "topup"
    WITHDRAWAL = "withdrawal"
    TRANSFER = "transfer"
    SPRAY_MONEY = "spray_money"
    TICKET_PURCHASE = "ticket_purchase"
    REFUND = "refund"
    CASHBACK = "cashback"
    INTEREST = "interest"
    FEE = "fee"

class TransactionStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class TransactionHistoryService:
    def __init__(self):
        # Enhanced in-memory storage (replace with database in production)
        self.transactions = {}  # transaction_id -> transaction_data
        self.user_transactions = {}  # user_id -> [transaction_ids]
        self.transaction_categories = {}  # user_id -> {category -> [transaction_ids]}
        
        # Analytics cache
        self.spending_analytics = {}  # user_id -> analytics_data
        self.monthly_summaries = {}  # user_id -> {month -> summary}
        
        # Transaction limits for categorization
        self.LARGE_TRANSACTION_THRESHOLD = 50000  # ₦50,000
        self.FREQUENT_TRANSACTION_THRESHOLD = 10  # 10 transactions per day

    def record_transaction(self, user_id: str, transaction_data: Dict[str, Any]) -> str:
        """Record a new transaction with enhanced metadata"""
        transaction_id = str(uuid.uuid4())
        current_time = time.time()
        
        # Enhanced transaction record
        transaction = {
            "id": transaction_id,
            "user_id": user_id,
            "type": transaction_data["type"],
            "amount": float(transaction_data["amount"]),
            "currency": transaction_data.get("currency", "NGN"),
            "status": transaction_data.get("status", TransactionStatus.COMPLETED),
            "description": transaction_data.get("description", ""),
            "reference": transaction_data.get("reference", f"TXN{int(current_time)}{transaction_id[:8].upper()}"),
            "metadata": transaction_data.get("metadata", {}),
            "created_at": current_time,
            "updated_at": current_time,
            
            # Enhanced fields
            "category": self._categorize_transaction(transaction_data),
            "tags": self._generate_tags(transaction_data),
            "location": transaction_data.get("location"),
            "device_info": transaction_data.get("device_info"),
            "ip_address": transaction_data.get("ip_address"),
            "fee_amount": transaction_data.get("fee_amount", 0),
            "net_amount": float(transaction_data["amount"]) - transaction_data.get("fee_amount", 0),
            
            # Related transactions
            "parent_transaction_id": transaction_data.get("parent_transaction_id"),
            "related_event_id": transaction_data.get("event_id"),
            "related_user_id": transaction_data.get("related_user_id"),  # For transfers
            
            # Analytics fields
            "is_large_transaction": float(transaction_data["amount"]) >= self.LARGE_TRANSACTION_THRESHOLD,
            "time_of_day": datetime.fromtimestamp(current_time).hour,
            "day_of_week": datetime.fromtimestamp(current_time).weekday(),
            "month": datetime.fromtimestamp(current_time).strftime("%Y-%m")
        }
        
        # Store transaction
        self.transactions[transaction_id] = transaction
        
        # Update user transaction index
        if user_id not in self.user_transactions:
            self.user_transactions[user_id] = []
        self.user_transactions[user_id].append(transaction_id)
        
        # Update category index
        self._update_category_index(user_id, transaction)
        
        # Update analytics cache
        self._update_analytics_cache(user_id, transaction)
        
        return transaction_id

    def get_user_transactions(self, user_id: str, filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Get user transactions with advanced filtering"""
        if user_id not in self.user_transactions:
            return {
                "transactions": [],
                "total": 0,
                "filtered_total": 0,
                "summary": {}
            }
        
        # Get all user transactions
        transaction_ids = self.user_transactions[user_id]
        transactions = [self.transactions[tid] for tid in transaction_ids if tid in self.transactions]
        
        # Apply filters
        if filters:
            transactions = self._apply_filters(transactions, filters)
        
        # Sort by creation time (newest first)
        transactions.sort(key=lambda x: x["created_at"], reverse=True)
        
        # Apply pagination
        limit = filters.get("limit", 50) if filters else 50
        offset = filters.get("offset", 0) if filters else 0
        
        total_count = len(transactions)
        paginated_transactions = transactions[offset:offset + limit]
        
        # Generate summary
        summary = self._generate_transaction_summary(transactions)
        
        return {
            "transactions": paginated_transactions,
            "total": len(self.user_transactions[user_id]),
            "filtered_total": total_count,
            "summary": summary,
            "pagination": {
                "limit": limit,
                "offset": offset,
                "has_more": offset + limit < total_count
            }
        }

    def get_spending_analytics(self, user_id: str, period: str = "month") -> Dict[str, Any]:
        """Get comprehensive spending analytics"""
        if user_id not in self.user_transactions:
            return {"error": "No transactions found"}
        
        # Get transactions for the specified period
        transactions = self._get_transactions_for_period(user_id, period)
        
        if not transactions:
            return {"error": "No transactions in specified period"}
        
        # Calculate analytics
        analytics = {
            "period": period,
            "total_transactions": len(transactions),
            "total_spent": sum(t["amount"] for t in transactions if t["amount"] < 0),
            "total_received": sum(t["amount"] for t in transactions if t["amount"] > 0),
            "net_change": sum(t["amount"] for t in transactions),
            
            # Spending by category
            "spending_by_category": self._calculate_category_spending(transactions),
            
            # Spending by type
            "spending_by_type": self._calculate_type_spending(transactions),
            
            # Time-based analytics
            "spending_by_day": self._calculate_daily_spending(transactions),
            "spending_by_hour": self._calculate_hourly_spending(transactions),
            
            # Trends
            "spending_trend": self._calculate_spending_trend(user_id, period),
            "average_transaction": sum(abs(t["amount"]) for t in transactions) / len(transactions),
            
            # Insights
            "insights": self._generate_spending_insights(transactions),
            "recommendations": self._generate_recommendations(user_id, transactions)
        }
        
        return analytics

    def export_transactions(self, user_id: str, format: str = "json", filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Export user transactions in various formats"""
        transactions_data = self.get_user_transactions(user_id, filters)
        transactions = transactions_data["transactions"]
        
        if format.lower() == "csv":
            return self._export_to_csv(transactions)
        elif format.lower() == "pdf":
            return self._export_to_pdf(transactions)
        else:  # JSON
            return {
                "format": "json",
                "data": transactions_data,
                "exported_at": time.time(),
                "total_records": len(transactions)
            }

    def search_transactions(self, user_id: str, query: str) -> List[Dict[str, Any]]:
        """Search transactions by description, reference, or metadata"""
        if user_id not in self.user_transactions:
            return []
        
        transaction_ids = self.user_transactions[user_id]
        transactions = [self.transactions[tid] for tid in transaction_ids if tid in self.transactions]
        
        query_lower = query.lower()
        matching_transactions = []
        
        for transaction in transactions:
            # Search in description
            if query_lower in transaction.get("description", "").lower():
                matching_transactions.append(transaction)
                continue
            
            # Search in reference
            if query_lower in transaction.get("reference", "").lower():
                matching_transactions.append(transaction)
                continue
            
            # Search in tags
            if any(query_lower in tag.lower() for tag in transaction.get("tags", [])):
                matching_transactions.append(transaction)
                continue
            
            # Search in metadata
            metadata_str = json.dumps(transaction.get("metadata", {})).lower()
            if query_lower in metadata_str:
                matching_transactions.append(transaction)
                continue
        
        return sorted(matching_transactions, key=lambda x: x["created_at"], reverse=True)

    def _categorize_transaction(self, transaction_data: Dict[str, Any]) -> str:
        """Automatically categorize transaction"""
        transaction_type = transaction_data["type"]
        amount = float(transaction_data["amount"])
        description = transaction_data.get("description", "").lower()
        metadata = transaction_data.get("metadata", {})
        
        # Category mapping
        if transaction_type == TransactionType.TICKET_PURCHASE:
            return "entertainment"
        elif transaction_type == TransactionType.SPRAY_MONEY:
            return "social"
        elif transaction_type == TransactionType.TOPUP:
            return "wallet_management"
        elif transaction_type == TransactionType.WITHDRAWAL:
            return "wallet_management"
        elif "food" in description or "restaurant" in description:
            return "food_drinks"
        elif "transport" in description or "uber" in description or "taxi" in description:
            return "transportation"
        elif "hotel" in description or "accommodation" in description:
            return "accommodation"
        elif amount > 50000:
            return "large_expense"
        else:
            return "other"

    def _generate_tags(self, transaction_data: Dict[str, Any]) -> List[str]:
        """Generate tags for transaction"""
        tags = []
        amount = float(transaction_data["amount"])
        transaction_type = transaction_data["type"]
        
        # Amount-based tags
        if amount > 100000:
            tags.append("large")
        elif amount < 1000:
            tags.append("small")
        
        # Type-based tags
        if transaction_type == TransactionType.SPRAY_MONEY:
            tags.append("social")
            tags.append("tipping")
        elif transaction_type == TransactionType.TICKET_PURCHASE:
            tags.append("event")
            tags.append("entertainment")
        
        # Time-based tags
        current_hour = datetime.now().hour
        if 6 <= current_hour < 12:
            tags.append("morning")
        elif 12 <= current_hour < 18:
            tags.append("afternoon")
        elif 18 <= current_hour < 22:
            tags.append("evening")
        else:
            tags.append("night")
        
        return tags

    def _apply_filters(self, transactions: List[Dict[str, Any]], filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Apply filters to transaction list"""
        filtered = transactions
        
        # Date range filter
        if "start_date" in filters:
            start_timestamp = filters["start_date"]
            filtered = [t for t in filtered if t["created_at"] >= start_timestamp]
        
        if "end_date" in filters:
            end_timestamp = filters["end_date"]
            filtered = [t for t in filtered if t["created_at"] <= end_timestamp]
        
        # Type filter
        if "type" in filters:
            transaction_types = filters["type"] if isinstance(filters["type"], list) else [filters["type"]]
            filtered = [t for t in filtered if t["type"] in transaction_types]
        
        # Status filter
        if "status" in filters:
            statuses = filters["status"] if isinstance(filters["status"], list) else [filters["status"]]
            filtered = [t for t in filtered if t["status"] in statuses]
        
        # Amount range filter
        if "min_amount" in filters:
            filtered = [t for t in filtered if abs(t["amount"]) >= filters["min_amount"]]
        
        if "max_amount" in filters:
            filtered = [t for t in filtered if abs(t["amount"]) <= filters["max_amount"]]
        
        # Category filter
        if "category" in filters:
            categories = filters["category"] if isinstance(filters["category"], list) else [filters["category"]]
            filtered = [t for t in filtered if t["category"] in categories]
        
        # Tag filter
        if "tags" in filters:
            required_tags = filters["tags"] if isinstance(filters["tags"], list) else [filters["tags"]]
            filtered = [t for t in filtered if any(tag in t.get("tags", []) for tag in required_tags)]
        
        return filtered

    def _generate_transaction_summary(self, transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate summary statistics for transactions"""
        if not transactions:
            return {}
        
        total_in = sum(t["amount"] for t in transactions if t["amount"] > 0)
        total_out = sum(abs(t["amount"]) for t in transactions if t["amount"] < 0)
        total_fees = sum(t.get("fee_amount", 0) for t in transactions)
        
        return {
            "total_transactions": len(transactions),
            "total_inflow": total_in,
            "total_outflow": total_out,
            "net_change": total_in - total_out,
            "total_fees": total_fees,
            "average_transaction": sum(abs(t["amount"]) for t in transactions) / len(transactions),
            "largest_transaction": max(abs(t["amount"]) for t in transactions),
            "smallest_transaction": min(abs(t["amount"]) for t in transactions),
            "most_common_type": self._get_most_common_type(transactions),
            "most_common_category": self._get_most_common_category(transactions)
        }

    def _get_transactions_for_period(self, user_id: str, period: str) -> List[Dict[str, Any]]:
        """Get transactions for a specific period"""
        if user_id not in self.user_transactions:
            return []
        
        current_time = time.time()
        
        if period == "day":
            start_time = current_time - (24 * 60 * 60)
        elif period == "week":
            start_time = current_time - (7 * 24 * 60 * 60)
        elif period == "month":
            start_time = current_time - (30 * 24 * 60 * 60)
        elif period == "year":
            start_time = current_time - (365 * 24 * 60 * 60)
        else:
            start_time = 0  # All time
        
        transaction_ids = self.user_transactions[user_id]
        transactions = [
            self.transactions[tid] for tid in transaction_ids 
            if tid in self.transactions and self.transactions[tid]["created_at"] >= start_time
        ]
        
        return transactions

    def _calculate_category_spending(self, transactions: List[Dict[str, Any]]) -> Dict[str, float]:
        """Calculate spending by category"""
        category_spending = {}
        
        for transaction in transactions:
            category = transaction.get("category", "other")
            amount = abs(transaction["amount"]) if transaction["amount"] < 0 else 0
            
            if category not in category_spending:
                category_spending[category] = 0
            category_spending[category] += amount
        
        return category_spending

    def _calculate_type_spending(self, transactions: List[Dict[str, Any]]) -> Dict[str, float]:
        """Calculate spending by transaction type"""
        type_spending = {}
        
        for transaction in transactions:
            transaction_type = transaction["type"]
            amount = abs(transaction["amount"]) if transaction["amount"] < 0 else 0
            
            if transaction_type not in type_spending:
                type_spending[transaction_type] = 0
            type_spending[transaction_type] += amount
        
        return type_spending

    def _calculate_daily_spending(self, transactions: List[Dict[str, Any]]) -> Dict[str, float]:
        """Calculate spending by day"""
        daily_spending = {}
        
        for transaction in transactions:
            date = datetime.fromtimestamp(transaction["created_at"]).strftime("%Y-%m-%d")
            amount = abs(transaction["amount"]) if transaction["amount"] < 0 else 0
            
            if date not in daily_spending:
                daily_spending[date] = 0
            daily_spending[date] += amount
        
        return daily_spending

    def _calculate_hourly_spending(self, transactions: List[Dict[str, Any]]) -> Dict[int, float]:
        """Calculate spending by hour of day"""
        hourly_spending = {hour: 0 for hour in range(24)}
        
        for transaction in transactions:
            hour = transaction["time_of_day"]
            amount = abs(transaction["amount"]) if transaction["amount"] < 0 else 0
            hourly_spending[hour] += amount
        
        return hourly_spending

    def _calculate_spending_trend(self, user_id: str, period: str) -> Dict[str, Any]:
        """Calculate spending trend over time"""
        # Get transactions for current and previous period
        current_transactions = self._get_transactions_for_period(user_id, period)
        
        # Calculate previous period
        if period == "month":
            previous_start = time.time() - (60 * 24 * 60 * 60)  # 2 months ago
            previous_end = time.time() - (30 * 24 * 60 * 60)    # 1 month ago
        else:
            previous_start = time.time() - (2 * 30 * 24 * 60 * 60)  # Default to 2 months
            previous_end = time.time() - (30 * 24 * 60 * 60)
        
        previous_transactions = [
            t for t in current_transactions 
            if previous_start <= t["created_at"] <= previous_end
        ]
        
        current_spending = sum(abs(t["amount"]) for t in current_transactions if t["amount"] < 0)
        previous_spending = sum(abs(t["amount"]) for t in previous_transactions if t["amount"] < 0)
        
        if previous_spending > 0:
            change_percentage = ((current_spending - previous_spending) / previous_spending) * 100
        else:
            change_percentage = 0
        
        return {
            "current_spending": current_spending,
            "previous_spending": previous_spending,
            "change_amount": current_spending - previous_spending,
            "change_percentage": change_percentage,
            "trend": "increasing" if change_percentage > 5 else "decreasing" if change_percentage < -5 else "stable"
        }

    def _generate_spending_insights(self, transactions: List[Dict[str, Any]]) -> List[str]:
        """Generate spending insights"""
        insights = []
        
        if not transactions:
            return insights
        
        # Most expensive category
        category_spending = self._calculate_category_spending(transactions)
        if category_spending:
            top_category = max(category_spending, key=category_spending.get)
            insights.append(f"Your highest spending category is {top_category.replace('_', ' ').title()}")
        
        # Peak spending time
        hourly_spending = self._calculate_hourly_spending(transactions)
        peak_hour = max(hourly_spending, key=hourly_spending.get)
        if hourly_spending[peak_hour] > 0:
            insights.append(f"You spend most between {peak_hour}:00-{peak_hour+1}:00")
        
        # Large transactions
        large_transactions = [t for t in transactions if t.get("is_large_transaction", False)]
        if large_transactions:
            insights.append(f"You made {len(large_transactions)} large transactions (>₦50,000)")
        
        return insights

    def _generate_recommendations(self, user_id: str, transactions: List[Dict[str, Any]]) -> List[str]:
        """Generate spending recommendations"""
        recommendations = []
        
        # High fee transactions
        high_fee_transactions = [t for t in transactions if t.get("fee_amount", 0) > 100]
        if len(high_fee_transactions) > 5:
            recommendations.append("Consider using standard processing to reduce fees")
        
        # Frequent small transactions
        small_transactions = [t for t in transactions if abs(t["amount"]) < 1000]
        if len(small_transactions) > 20:
            recommendations.append("Consider batching small transactions to reduce fees")
        
        return recommendations

    def _get_most_common_type(self, transactions: List[Dict[str, Any]]) -> str:
        """Get most common transaction type"""
        type_counts = {}
        for t in transactions:
            transaction_type = t["type"]
            type_counts[transaction_type] = type_counts.get(transaction_type, 0) + 1
        
        return max(type_counts, key=type_counts.get) if type_counts else "unknown"

    def _get_most_common_category(self, transactions: List[Dict[str, Any]]) -> str:
        """Get most common transaction category"""
        category_counts = {}
        for t in transactions:
            category = t.get("category", "other")
            category_counts[category] = category_counts.get(category, 0) + 1
        
        return max(category_counts, key=category_counts.get) if category_counts else "other"

    def _update_category_index(self, user_id: str, transaction: Dict[str, Any]):
        """Update category index for faster filtering"""
        if user_id not in self.transaction_categories:
            self.transaction_categories[user_id] = {}
        
        category = transaction["category"]
        if category not in self.transaction_categories[user_id]:
            self.transaction_categories[user_id][category] = []
        
        self.transaction_categories[user_id][category].append(transaction["id"])

    def _update_analytics_cache(self, user_id: str, transaction: Dict[str, Any]):
        """Update analytics cache for faster retrieval"""
        # This would update cached analytics data
        # Implementation depends on specific caching strategy
        pass

    def _export_to_csv(self, transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Export transactions to CSV format"""
        # Mock CSV export
        return {
            "format": "csv",
            "filename": f"transactions_{int(time.time())}.csv",
            "data": "CSV data would be generated here",
            "total_records": len(transactions)
        }

    def _export_to_pdf(self, transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Export transactions to PDF format"""
        # Mock PDF export
        return {
            "format": "pdf",
            "filename": f"transactions_{int(time.time())}.pdf",
            "data": "PDF data would be generated here",
            "total_records": len(transactions)
        }

# Global instance
transaction_history_service = TransactionHistoryService()