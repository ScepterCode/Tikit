"""
Admin Dashboard Service
Provides real-time data for admin dashboard
"""
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import logging
from database import supabase_client

logger = logging.getLogger(__name__)

class AdminDashboardService:
    def __init__(self):
        self.supabase = supabase_client.get_service_client()
    
    async def get_dashboard_stats(self) -> Dict[str, Any]:
        """Get overall dashboard statistics"""
        try:
            stats = {}
            
            # Total users
            users_result = self.supabase.table('users').select('id', count='exact').execute()
            stats['total_users'] = users_result.count or 0
            
            # Active events (this month)
            today = datetime.utcnow()
            month_start = today.replace(day=1)
            
            events_result = self.supabase.table('events').select('id', count='exact').gte(
                'created_at', month_start.isoformat()
            ).execute()
            stats['active_events'] = events_result.count or 0
            
            # Tickets sold (this month)
            tickets_result = self.supabase.table('tickets').select('id', count='exact').gte(
                'created_at', month_start.isoformat()
            ).execute()
            stats['tickets_sold'] = tickets_result.count or 0
            
            # Platform revenue (this month)
            revenue_result = self.supabase.table('transactions').select('amount').gte(
                'created_at', month_start.isoformat()
            ).eq('status', 'completed').execute()
            
            total_revenue = sum([t.get('amount', 0) for t in revenue_result.data or []])
            stats['platform_revenue'] = total_revenue
            
            return {
                "success": True,
                "data": stats
            }
        except Exception as e:
            logger.error(f"Error getting dashboard stats: {e}")
            return {
                "success": False,
                "error": str(e),
                "data": {
                    "total_users": 0,
                    "active_events": 0,
                    "tickets_sold": 0,
                    "platform_revenue": 0
                }
            }
    
    async def get_recent_activity(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent platform activity"""
        try:
            activities = []
            
            # Recent user registrations
            users_result = self.supabase.table('users').select(
                'id', 'first_name', 'last_name', 'role', 'created_at'
            ).order('created_at', desc=True).limit(limit).execute()
            
            for user in users_result.data or []:
                activities.append({
                    "type": "user_registration",
                    "title": f"New {user['role']} registered",
                    "description": f"{user['first_name']} {user['last_name']}",
                    "timestamp": user['created_at'],
                    "icon": "👤"
                })
            
            # Recent events created
            events_result = self.supabase.table('events').select(
                'id', 'title', 'organizer_id', 'created_at'
            ).order('created_at', desc=True).limit(limit).execute()
            
            for event in events_result.data or []:
                activities.append({
                    "type": "event_created",
                    "title": "New event created",
                    "description": event['title'],
                    "timestamp": event['created_at'],
                    "icon": "🎉"
                })
            
            # Recent ticket sales
            tickets_result = self.supabase.table('tickets').select(
                'id', 'event_id', 'created_at'
            ).order('created_at', desc=True).limit(limit).execute()
            
            for ticket in tickets_result.data or []:
                activities.append({
                    "type": "ticket_sold",
                    "title": "Ticket sold",
                    "description": f"Ticket #{ticket['id'][:8]}",
                    "timestamp": ticket['created_at'],
                    "icon": "🎫"
                })
            
            # Sort by timestamp and return top items
            activities.sort(key=lambda x: x['timestamp'], reverse=True)
            return activities[:limit]
        except Exception as e:
            logger.error(f"Error getting recent activity: {e}")
            return []
    
    async def get_pending_actions(self) -> Dict[str, int]:
        """Get count of pending actions"""
        try:
            pending = {}
            
            # Pending organizer verifications
            pending_orgs = self.supabase.table('users').select(
                'id', count='exact'
            ).eq('role', 'organizer').eq('is_verified', False).execute()
            pending['organizer_verifications'] = pending_orgs.count or 0
            
            # Flagged events
            flagged_events = self.supabase.table('events').select(
                'id', count='exact'
            ).eq('flagged', True).execute()
            pending['flagged_events'] = flagged_events.count or 0
            
            # Support tickets (if table exists)
            try:
                support_tickets = self.supabase.table('support_tickets').select(
                    'id', count='exact'
                ).eq('status', 'open').execute()
                pending['support_tickets'] = support_tickets.count or 0
            except:
                pending['support_tickets'] = 0
            
            return pending
        except Exception as e:
            logger.error(f"Error getting pending actions: {e}")
            return {
                "organizer_verifications": 0,
                "flagged_events": 0,
                "support_tickets": 0
            }
    
    async def get_user_breakdown(self) -> Dict[str, int]:
        """Get breakdown of users by role"""
        try:
            breakdown = {}
            
            for role in ['attendee', 'organizer', 'admin']:
                result = self.supabase.table('users').select(
                    'id', count='exact'
                ).eq('role', role).execute()
                breakdown[role] = result.count or 0
            
            return breakdown
        except Exception as e:
            logger.error(f"Error getting user breakdown: {e}")
            return {
                "attendee": 0,
                "organizer": 0,
                "admin": 0
            }
    
    async def get_event_breakdown(self) -> Dict[str, Any]:
        """Get breakdown of events by status"""
        try:
            breakdown = {}
            
            # Upcoming events
            today = datetime.utcnow()
            upcoming = self.supabase.table('events').select(
                'id', count='exact'
            ).gte('start_date', today.isoformat()).execute()
            breakdown['upcoming'] = upcoming.count or 0
            
            # Past events
            past = self.supabase.table('events').select(
                'id', count='exact'
            ).lt('start_date', today.isoformat()).execute()
            breakdown['past'] = past.count or 0
            
            # Cancelled events
            cancelled = self.supabase.table('events').select(
                'id', count='exact'
            ).eq('status', 'cancelled').execute()
            breakdown['cancelled'] = cancelled.count or 0
            
            return breakdown
        except Exception as e:
            logger.error(f"Error getting event breakdown: {e}")
            return {
                "upcoming": 0,
                "past": 0,
                "cancelled": 0
            }
    
    async def get_revenue_breakdown(self) -> Dict[str, Any]:
        """Get revenue breakdown by payment method"""
        try:
            breakdown = {}
            
            # Get all completed transactions
            result = self.supabase.table('transactions').select(
                'payment_method', 'amount'
            ).eq('status', 'completed').execute()
            
            for transaction in result.data or []:
                method = transaction.get('payment_method', 'unknown')
                amount = transaction.get('amount', 0)
                
                if method not in breakdown:
                    breakdown[method] = 0
                breakdown[method] += amount
            
            return breakdown
        except Exception as e:
            logger.error(f"Error getting revenue breakdown: {e}")
            return {}
    
    async def get_top_events(self, limit: int = 5) -> List[Dict[str, Any]]:
        """Get top events by ticket sales"""
        try:
            # Get events with ticket counts
            events_result = self.supabase.table('events').select('id, title, organizer_id').execute()
            
            events_with_sales = []
            for event in events_result.data or []:
                tickets_result = self.supabase.table('tickets').select(
                    'id', count='exact'
                ).eq('event_id', event['id']).execute()
                
                ticket_count = tickets_result.count or 0
                if ticket_count > 0:
                    events_with_sales.append({
                        "id": event['id'],
                        "title": event['title'],
                        "ticket_sales": ticket_count,
                        "organizer_id": event['organizer_id']
                    })
            
            # Sort by ticket sales and return top
            events_with_sales.sort(key=lambda x: x['ticket_sales'], reverse=True)
            return events_with_sales[:limit]
        except Exception as e:
            logger.error(f"Error getting top events: {e}")
            return []

# Create singleton instance
admin_dashboard_service = AdminDashboardService()
