"""
Notification Service using realtime_notifications table
"""
from supabase import create_client, Client
from config import config
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self):
        self.supabase: Client = create_client(config.SUPABASE_URL, config.SUPABASE_ANON_KEY)
    
    async def create_notification(self, user_id: str, title: str, message: str, 
                                notification_type: str = "info", event_id: str = None, 
                                data: dict = None) -> Optional[dict]:
        """Create notification using realtime_notifications table"""
        try:
            notification_data = {
                "user_id": user_id,
                "title": title,
                "message": message,
                "type": notification_type,
                "event_id": event_id,
                "data": data or {},
                "read": False
            }
            
            result = self.supabase.table('realtime_notifications').insert(notification_data).execute()
            
            if result.data:
                logger.info(f"Notification created: {result.data[0]['id']}")
                return result.data[0]
            return None
            
        except Exception as e:
            logger.error(f"Error creating notification: {str(e)}")
            return None
    
    async def get_user_notifications(self, user_id: str, limit: int = 50, 
                                   unread_only: bool = False) -> List[dict]:
        """Get notifications for user"""
        try:
            query = self.supabase.table('realtime_notifications').select('*').eq('user_id', user_id)
            
            if unread_only:
                query = query.eq('read', False)
            
            result = query.order('created_at', desc=True).limit(limit).execute()
            return result.data or []
            
        except Exception as e:
            logger.error(f"Error getting notifications: {str(e)}")
            return []
    
    async def mark_as_read(self, notification_id: str) -> bool:
        """Mark notification as read"""
        try:
            result = self.supabase.table('realtime_notifications').update({
                'read': True
            }).eq('id', notification_id).execute()
            
            return len(result.data) > 0
            
        except Exception as e:
            logger.error(f"Error marking notification as read: {str(e)}")
            return False
    
    async def get_unread_count(self, user_id: str) -> int:
        """Get count of unread notifications"""
        try:
            result = self.supabase.table('realtime_notifications').select('id').eq('user_id', user_id).eq('read', False).execute()
            return len(result.data or [])
            
        except Exception as e:
            logger.error(f"Error getting unread count: {str(e)}")
            return 0

    async def notify_payment_update(self, user_id: str, payment_type: str, 
                                   amount: float, status: str) -> Dict[str, Any]:
        """Notify user about payment updates"""
        try:
            title = f"Payment {status.title()}"
            if status == "completed":
                message = f"Your {payment_type} payment of ₦{amount:,.2f} has been processed successfully."
            elif status == "failed":
                message = f"Your {payment_type} payment of ₦{amount:,.2f} could not be processed. Please try again."
            else:
                message = f"Your {payment_type} payment of ₦{amount:,.2f} is {status}."
            
            notification = await self.create_notification(
                user_id=user_id,
                title=title,
                message=message,
                notification_type="payment",
                data={"payment_type": payment_type, "amount": amount, "status": status}
            )
            
            return {
                "success": True,
                "notification_id": notification["id"] if notification else None,
                "message": "Payment notification sent"
            }
            
        except Exception as e:
            logger.error(f"Error sending payment notification: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def notify_security_alert(self, user_id: str, alert_type: str, 
                                  details: str, ip_address: str = None) -> Dict[str, Any]:
        """Notify user about security alerts"""
        try:
            title = f"Security Alert: {alert_type.title()}"
            message = f"{details}"
            if ip_address:
                message += f" from IP: {ip_address}"
            
            notification = await self.create_notification(
                user_id=user_id,
                title=title,
                message=message,
                notification_type="security",
                data={"alert_type": alert_type, "ip_address": ip_address}
            )
            
            return {
                "success": True,
                "notification_id": notification["id"] if notification else None,
                "message": "Security alert sent"
            }
            
        except Exception as e:
            logger.error(f"Error sending security alert: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def notify_wallet_update(self, user_id: str, transaction_type: str, 
                                 amount: float, new_balance: float) -> Dict[str, Any]:
        """Notify user about wallet updates"""
        try:
            if transaction_type == "credit":
                title = "Wallet Credited"
                message = f"₦{amount:,.2f} has been added to your wallet. New balance: ₦{new_balance:,.2f}"
            elif transaction_type == "debit":
                title = "Wallet Debited"
                message = f"₦{amount:,.2f} has been deducted from your wallet. New balance: ₦{new_balance:,.2f}"
            else:
                title = "Wallet Updated"
                message = f"Your wallet has been updated. New balance: ₦{new_balance:,.2f}"
            
            notification = await self.create_notification(
                user_id=user_id,
                title=title,
                message=message,
                notification_type="wallet",
                data={"transaction_type": transaction_type, "amount": amount, "new_balance": new_balance}
            )
            
            return {
                "success": True,
                "notification_id": notification["id"] if notification else None,
                "message": "Wallet notification sent"
            }
            
        except Exception as e:
            logger.error(f"Error sending wallet notification: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def notify_referral_update(self, user_id: str, referral_type: str, 
                                   reward_amount: float = None) -> Dict[str, Any]:
        """Notify user about referral updates"""
        try:
            if referral_type == "new_referral":
                title = "New Referral!"
                message = "Someone joined using your referral code!"
                if reward_amount:
                    message += f" You earned ₦{reward_amount:,.2f} as a reward."
            elif referral_type == "reward_earned":
                title = "Referral Reward Earned"
                message = f"You earned ₦{reward_amount:,.2f} from your referral program!"
            else:
                title = "Referral Update"
                message = "Your referral status has been updated."
            
            notification = await self.create_notification(
                user_id=user_id,
                title=title,
                message=message,
                notification_type="referral",
                data={"referral_type": referral_type, "reward_amount": reward_amount}
            )
            
            return {
                "success": True,
                "notification_id": notification["id"] if notification else None,
                "message": "Referral notification sent"
            }
            
        except Exception as e:
            logger.error(f"Error sending referral notification: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def send_system_notification(self, title: str, message: str, 
                                     target_roles: List[str] = None) -> Dict[str, Any]:
        """Send system-wide notifications"""
        try:
            # Get users based on target roles
            if target_roles:
                # This would typically query the users table filtered by roles
                # For now, we'll use a placeholder
                target_users = []  # Would be populated from database query
            else:
                target_users = []  # Would get all users
            
            notifications_sent = 0
            for user_id in target_users:
                notification = await self.create_notification(
                    user_id=user_id,
                    title=title,
                    message=message,
                    notification_type="system"
                )
                if notification:
                    notifications_sent += 1
            
            return {
                "success": True,
                "notifications_sent": notifications_sent,
                "message": f"System notification sent to {notifications_sent} users"
            }
            
        except Exception as e:
            logger.error(f"Error sending system notification: {str(e)}")
            return {"success": False, "error": str(e)}

# Global service instance
notification_service = NotificationService()