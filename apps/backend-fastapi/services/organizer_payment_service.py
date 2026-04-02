"""
Organizer Payment Service
Handles crediting organizers when tickets are sold
"""
from typing import Dict, Any, Optional
from decimal import Decimal
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class OrganizerPaymentService:
    """Handle organizer payments and wallet credits"""
    
    def __init__(self):
        # Platform fee configuration from config
        from config import config
        self.platform_fee_percentage = config.PLATFORM_FEE_PERCENTAGE
        self.platform_fee_minimum = config.PLATFORM_FEE_MINIMUM
        self.platform_fee_maximum = config.PLATFORM_FEE_MAXIMUM
        
    def calculate_organizer_share(self, ticket_price: float) -> Dict[str, float]:
        """
        Calculate organizer share after platform fee
        
        Args:
            ticket_price: Price of the ticket
            
        Returns:
            Dict with organizer_share and platform_fee
        """
        price = Decimal(str(ticket_price))
        
        # Calculate percentage-based fee
        fee = price * Decimal(str(self.platform_fee_percentage)) / 100
        
        # Apply minimum and maximum limits
        fee = max(Decimal(str(self.platform_fee_minimum)), fee)
        fee = min(Decimal(str(self.platform_fee_maximum)), fee)
        
        # Ensure fee doesn't exceed ticket price
        fee = min(fee, price * Decimal('0.95'))  # Max 95% fee
        
        organizer_share = price - fee
        
        return {
            'organizer_share': float(organizer_share),
            'platform_fee': float(fee),
            'ticket_price': float(price)
        }
        
    async def credit_organizer_for_ticket_sale(
        self,
        event_id: str,
        ticket_price: float,
        payment_reference: str,
        attendee_id: str,
        quantity: int = 1
    ) -> Dict[str, Any]:
        """
        Credit organizer wallet when ticket is sold
        
        Args:
            event_id: ID of the event
            ticket_price: Price per ticket
            payment_reference: Payment transaction reference
            attendee_id: ID of the attendee who bought the ticket
            quantity: Number of tickets purchased
            
        Returns:
            Dict with success status and transaction details
        """
        try:
            from database import supabase_client
            
            supabase = supabase_client.get_service_client()
            
            if not supabase:
                logger.error("Supabase client not available")
                return {
                    "success": False,
                    "error": "Database not available"
                }
            
            # 1. Get event and organizer details
            logger.info(f"Fetching event {event_id} for organizer credit")
            event_result = supabase.table('events')\
                .select('id, organizer_id, title')\
                .eq('id', event_id)\
                .execute()
            
            if not event_result.data:
                logger.error(f"Event {event_id} not found")
                return {
                    "success": False,
                    "error": "Event not found"
                }
            
            event = event_result.data[0]
            organizer_id = event['organizer_id']
            
            if not organizer_id:
                logger.error(f"Event {event_id} has no organizer")
                return {
                    "success": False,
                    "error": "Event has no organizer"
                }
            
            # 2. Calculate total amount and organizer share
            total_ticket_price = ticket_price * quantity
            share_calc = self.calculate_organizer_share(total_ticket_price)
            
            organizer_share = Decimal(str(share_calc['organizer_share']))
            platform_fee = Decimal(str(share_calc['platform_fee']))
            
            logger.info(f"Crediting organizer {organizer_id}: ₦{float(organizer_share):,.2f} (fee: ₦{float(platform_fee):,.2f})")
            
            # 3. Check for duplicate transaction
            transaction_ref = f'TICKET_SALE_{payment_reference}'
            existing_tx = supabase.table('transactions')\
                .select('id')\
                .eq('reference', transaction_ref)\
                .execute()
            
            if existing_tx.data:
                logger.warning(f"Transaction {transaction_ref} already exists - preventing double credit")
                return {
                    "success": False,
                    "error": "Transaction already processed",
                    "duplicate": True
                }
            
            # 4. Get or create organizer wallet
            wallet_result = supabase.table('wallets')\
                .select('*')\
                .eq('user_id', organizer_id)\
                .execute()
            
            if not wallet_result.data:
                # Create wallet if doesn't exist
                logger.info(f"Creating wallet for organizer {organizer_id}")
                wallet_create = supabase.table('wallets').insert({
                    'user_id': organizer_id,
                    'balance': float(organizer_share),
                    'currency': 'NGN',
                    'created_at': datetime.utcnow().isoformat(),
                    'updated_at': datetime.utcnow().isoformat()
                }).execute()
                
                new_balance = float(organizer_share)
                logger.info(f"Wallet created with balance: ₦{new_balance:,.2f}")
            else:
                # Update existing wallet
                current_balance = Decimal(str(wallet_result.data[0].get('balance', 0)))
                new_balance = float(current_balance + organizer_share)
                
                logger.info(f"Updating wallet: ₦{float(current_balance):,.2f} → ₦{new_balance:,.2f}")
                
                supabase.table('wallets')\
                    .update({
                        'balance': new_balance,
                        'updated_at': datetime.utcnow().isoformat()
                    })\
                    .eq('user_id', organizer_id)\
                    .execute()
            
            # 5. Create transaction record
            transaction_data = {
                'user_id': organizer_id,
                'type': 'credit',
                'amount': float(organizer_share),
                'description': f'Ticket sale: {quantity}x {event["title"]}',
                'reference': transaction_ref,
                'status': 'completed',
                'metadata': {
                    'event_id': event_id,
                    'event_title': event["title"],
                    'ticket_price': ticket_price,
                    'quantity': quantity,
                    'total_ticket_price': total_ticket_price,
                    'platform_fee': float(platform_fee),
                    'attendee_id': attendee_id,
                    'payment_reference': payment_reference,
                    'credited_at': datetime.utcnow().isoformat()
                },
                'created_at': datetime.utcnow().isoformat()
            }
            
            transaction_result = supabase.table('transactions').insert(transaction_data).execute()
            
            transaction_id = transaction_result.data[0]['id'] if transaction_result.data else None
            logger.info(f"Transaction created: {transaction_id}")
            
            # 6. Create notification for organizer
            try:
                notification_data = {
                    'user_id': organizer_id,
                    'type': 'ticket_sold',
                    'title': '🎉 Ticket Sold!',
                    'message': f'You earned ₦{float(organizer_share):,.2f} from {quantity} ticket(s) for {event["title"]}',
                    'data': {
                        'event_id': event_id,
                        'amount': float(organizer_share),
                        'quantity': quantity,
                        'transaction_id': transaction_id,
                        'new_balance': new_balance
                    },
                    'read': False,
                    'created_at': datetime.utcnow().isoformat()
                }
                
                supabase.table('notifications').insert(notification_data).execute()
                logger.info(f"Notification sent to organizer {organizer_id}")
            except Exception as notif_error:
                # Don't fail the whole operation if notification fails
                logger.warning(f"Failed to create notification: {notif_error}")
            
            return {
                "success": True,
                "organizer_id": organizer_id,
                "amount_credited": float(organizer_share),
                "platform_fee": float(platform_fee),
                "new_balance": new_balance,
                "transaction_id": transaction_id,
                "quantity": quantity
            }
            
        except Exception as e:
            logger.error(f"Error crediting organizer: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_organizer_earnings(self, organizer_id: str, event_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get organizer's earnings summary
        
        Args:
            organizer_id: ID of the organizer
            event_id: Optional event ID to filter by
            
        Returns:
            Dict with earnings summary
        """
        try:
            from database import supabase_client
            
            supabase = supabase_client.get_service_client()
            
            if not supabase:
                return {
                    "success": False,
                    "error": "Database not available"
                }
            
            # Build query
            query = supabase.table('transactions')\
                .select('*')\
                .eq('user_id', organizer_id)\
                .eq('type', 'credit')\
                .like('reference', 'TICKET_SALE_%')
            
            if event_id:
                # Filter by event_id in metadata
                query = query.contains('metadata', {'event_id': event_id})
            
            result = query.execute()
            
            transactions = result.data or []
            
            # Calculate totals
            total_earnings = sum(tx['amount'] for tx in transactions)
            total_tickets = sum(tx.get('metadata', {}).get('quantity', 1) for tx in transactions)
            total_platform_fees = sum(tx.get('metadata', {}).get('platform_fee', 0) for tx in transactions)
            
            return {
                "success": True,
                "total_earnings": total_earnings,
                "total_tickets_sold": total_tickets,
                "total_platform_fees": total_platform_fees,
                "transaction_count": len(transactions),
                "transactions": transactions
            }
            
        except Exception as e:
            logger.error(f"Error getting organizer earnings: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e)
            }

# Singleton instance
organizer_payment_service = OrganizerPaymentService()
