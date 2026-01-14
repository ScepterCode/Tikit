"""
Ticket management service for issuing, verifying, and managing tickets
"""
from database import supabase_client
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import secrets
import string
import hashlib
import base64
import logging
import io
import csv

logger = logging.getLogger(__name__)

class TicketService:
    def __init__(self):
        self.supabase = supabase_client.get_service_client()
    
    def generate_qr_code(self) -> str:
        """Generate a unique QR code for a ticket"""
        timestamp = str(int(datetime.utcnow().timestamp()))
        random_part = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(16))
        return f"TKT-QR-{timestamp}-{random_part}"
    
    def generate_backup_code(self) -> str:
        """Generate a 6-digit backup code"""
        return ''.join(secrets.choice(string.digits) for _ in range(6))
    
    def generate_qr_code_image(self, qr_code: str) -> str:
        """Generate QR code image as base64 data URL (placeholder implementation)"""
        # In a real implementation, you would use a QR code library like qrcode
        # For now, return a placeholder data URL
        placeholder_svg = f'''
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="200" fill="white"/>
            <rect x="10" y="10" width="180" height="180" fill="black"/>
            <rect x="20" y="20" width="160" height="160" fill="white"/>
            <text x="100" y="100" text-anchor="middle" font-family="monospace" font-size="8" fill="black">
                {qr_code[:20]}
            </text>
            <text x="100" y="120" text-anchor="middle" font-family="monospace" font-size="8" fill="black">
                {qr_code[20:40] if len(qr_code) > 20 else ''}
            </text>
        </svg>
        '''
        # Convert SVG to base64 data URL
        svg_bytes = placeholder_svg.encode('utf-8')
        svg_base64 = base64.b64encode(svg_bytes).decode('utf-8')
        return f"data:image/svg+xml;base64,{svg_base64}"
    
    async def issue_ticket(self, ticket_data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """Issue a ticket after successful payment"""
        try:
            # Verify payment is successful
            payment_result = self.supabase.table('payments').select('*').eq('id', ticket_data['payment_id']).execute()
            
            if not payment_result.data:
                return {
                    'success': False,
                    'error': {
                        'code': 'PAYMENT_NOT_FOUND',
                        'message': 'Payment not found'
                    }
                }
            
            payment = payment_result.data[0]
            
            if payment['status'] != 'successful':
                return {
                    'success': False,
                    'error': {
                        'code': 'PAYMENT_NOT_SUCCESSFUL',
                        'message': 'Payment not successful'
                    }
                }
            
            if payment['user_id'] != user_id:
                return {
                    'success': False,
                    'error': {
                        'code': 'PAYMENT_MISMATCH',
                        'message': 'Payment does not belong to user'
                    }
                }
            
            # Check if ticket already exists for this payment
            existing_ticket = self.supabase.table('tickets').select('id').eq('payment_id', ticket_data['payment_id']).execute()
            
            if existing_ticket.data:
                return {
                    'success': False,
                    'error': {
                        'code': 'TICKET_ALREADY_EXISTS',
                        'message': 'Ticket already issued for this payment'
                    }
                }
            
            # Verify event and tier exist
            event_result = self.supabase.table('events').select('*').eq('id', ticket_data['event_id']).execute()
            if not event_result.data:
                return {
                    'success': False,
                    'error': {
                        'code': 'EVENT_NOT_FOUND',
                        'message': 'Event not found'
                    }
                }
            
            tier_result = self.supabase.table('event_tiers').select('*').eq('id', ticket_data['tier_id']).eq('event_id', ticket_data['event_id']).execute()
            if not tier_result.data:
                return {
                    'success': False,
                    'error': {
                        'code': 'TIER_NOT_FOUND',
                        'message': 'Event tier not found'
                    }
                }
            
            # Generate ticket codes
            qr_code = self.generate_qr_code()
            backup_code = self.generate_backup_code()
            qr_code_image = self.generate_qr_code_image(qr_code)
            
            # Create ticket record
            ticket_record = {
                'event_id': ticket_data['event_id'],
                'tier_id': ticket_data['tier_id'],
                'user_id': user_id,
                'payment_id': ticket_data['payment_id'],
                'qr_code': qr_code,
                'backup_code': backup_code,
                'qr_code_image': qr_code_image,
                'status': 'active',
                'cultural_selections': ticket_data.get('cultural_selections'),
                'issued_at': datetime.utcnow().isoformat(),
                'created_at': datetime.utcnow().isoformat()
            }
            
            # Insert ticket
            ticket_result = self.supabase.table('tickets').insert(ticket_record).execute()
            
            if not ticket_result.data:
                return {
                    'success': False,
                    'error': {
                        'code': 'INTERNAL_ERROR',
                        'message': 'Failed to create ticket'
                    }
                }
            
            ticket = ticket_result.data[0]
            
            # Update tier sold count
            tier = tier_result.data[0]
            new_sold_count = tier.get('sold', 0) + 1
            self.supabase.table('event_tiers').update({'sold': new_sold_count}).eq('id', ticket_data['tier_id']).execute()
            
            return {
                'success': True,
                'message': 'Ticket issued successfully',
                'data': {
                    'id': ticket['id'],
                    'qr_code': ticket['qr_code'],
                    'backup_code': ticket['backup_code'],
                    'qr_code_image': ticket['qr_code_image'],
                    'status': ticket['status'],
                    'issued_at': ticket['issued_at']
                }
            }
            
        except Exception as e:
            logger.error(f"Issue ticket error: {e}")
            return {
                'success': False,
                'error': {
                    'code': 'INTERNAL_ERROR',
                    'message': 'Failed to issue ticket'
                }
            }
    
    async def get_tickets_by_user_id(self, user_id: str) -> Dict[str, Any]:
        """Get all tickets for a user"""
        try:
            result = self.supabase.table('tickets').select('''
                *,
                event:event_id (
                    id,
                    title,
                    venue,
                    start_date,
                    end_date,
                    status
                ),
                tier:tier_id (
                    id,
                    name,
                    price
                )
            ''').eq('user_id', user_id).order('created_at', desc=True).execute()
            
            tickets = result.data or []
            
            # Format tickets
            formatted_tickets = []
            active_count = 0
            used_count = 0
            upcoming_events = 0
            
            for ticket in tickets:
                event = ticket.get('event', {})
                tier = ticket.get('tier', {})
                
                formatted_ticket = {
                    'id': ticket['id'],
                    'event_id': ticket['event_id'],
                    'tier_id': ticket['tier_id'],
                    'user_id': ticket['user_id'],
                    'qr_code': ticket['qr_code'],
                    'backup_code': ticket['backup_code'],
                    'qr_code_image': ticket['qr_code_image'],
                    'status': ticket['status'],
                    'cultural_selections': ticket.get('cultural_selections'),
                    'issued_at': ticket['issued_at'],
                    'used_at': ticket.get('used_at'),
                    'scanned_by': ticket.get('scanned_by'),
                    'scan_location': ticket.get('scan_location'),
                    'event_title': event.get('title'),
                    'event_venue': event.get('venue'),
                    'event_start_date': event.get('start_date'),
                    'tier_name': tier.get('name'),
                    'tier_price': tier.get('price')
                }
                
                formatted_tickets.append(formatted_ticket)
                
                # Count statistics
                if ticket['status'] == 'active':
                    active_count += 1
                elif ticket['status'] == 'used':
                    used_count += 1
                
                # Check if event is upcoming
                if event.get('start_date'):
                    event_date = datetime.fromisoformat(event['start_date'].replace('Z', '+00:00'))
                    if event_date > datetime.utcnow():
                        upcoming_events += 1
            
            return {
                'tickets': formatted_tickets,
                'total': len(tickets),
                'active_tickets': active_count,
                'used_tickets': used_count,
                'upcoming_events': upcoming_events
            }
            
        except Exception as e:
            logger.error(f"Get tickets by user ID error: {e}")
            return {
                'tickets': [],
                'total': 0,
                'active_tickets': 0,
                'used_tickets': 0,
                'upcoming_events': 0
            }
    
    async def get_ticket_by_id(self, ticket_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Get ticket by ID (user must own the ticket)"""
        try:
            result = self.supabase.table('tickets').select('''
                *,
                event:event_id (
                    id,
                    title,
                    venue,
                    start_date,
                    end_date,
                    status
                ),
                tier:tier_id (
                    id,
                    name,
                    price
                )
            ''').eq('id', ticket_id).eq('user_id', user_id).execute()
            
            if not result.data:
                return None
            
            ticket = result.data[0]
            event = ticket.get('event', {})
            tier = ticket.get('tier', {})
            
            return {
                'id': ticket['id'],
                'event_id': ticket['event_id'],
                'tier_id': ticket['tier_id'],
                'user_id': ticket['user_id'],
                'qr_code': ticket['qr_code'],
                'backup_code': ticket['backup_code'],
                'qr_code_image': ticket['qr_code_image'],
                'status': ticket['status'],
                'cultural_selections': ticket.get('cultural_selections'),
                'issued_at': ticket['issued_at'],
                'used_at': ticket.get('used_at'),
                'scanned_by': ticket.get('scanned_by'),
                'scan_location': ticket.get('scan_location'),
                'event_title': event.get('title'),
                'event_venue': event.get('venue'),
                'event_start_date': event.get('start_date'),
                'tier_name': tier.get('name'),
                'tier_price': tier.get('price')
            }
            
        except Exception as e:
            logger.error(f"Get ticket by ID error: {e}")
            return None
    
    async def verify_ticket(self, verify_data: Dict[str, Any]) -> Dict[str, Any]:
        """Verify a ticket using QR code or backup code"""
        try:
            # Build query based on provided code
            query = self.supabase.table('tickets').select('''
                *,
                event:event_id (
                    id,
                    title,
                    venue,
                    start_date,
                    status
                ),
                tier:tier_id (
                    id,
                    name,
                    price
                ),
                user:user_id (
                    id,
                    first_name,
                    last_name
                )
            ''')
            
            if verify_data.get('qr_code'):
                query = query.eq('qr_code', verify_data['qr_code'])
            elif verify_data.get('backup_code'):
                query = query.eq('backup_code', verify_data['backup_code'])
            else:
                return {
                    'success': False,
                    'message': 'No verification code provided'
                }
            
            result = query.execute()
            
            if not result.data:
                return {
                    'success': False,
                    'message': 'Invalid ticket code'
                }
            
            ticket = result.data[0]
            event = ticket.get('event', {})
            tier = ticket.get('tier', {})
            user = ticket.get('user', {})
            
            # Check ticket status
            if ticket['status'] == 'used':
                return {
                    'success': False,
                    'ticket_id': ticket['id'],
                    'event_title': event.get('title'),
                    'tier_name': tier.get('name'),
                    'attendee_name': f"{user.get('first_name', '')} {user.get('last_name', '')}".strip(),
                    'status': ticket['status'],
                    'message': 'Ticket already used',
                    'scan_history': await self.get_scan_history(ticket['id'])
                }
            
            if ticket['status'] == 'cancelled':
                return {
                    'success': False,
                    'ticket_id': ticket['id'],
                    'event_title': event.get('title'),
                    'tier_name': tier.get('name'),
                    'attendee_name': f"{user.get('first_name', '')} {user.get('last_name', '')}".strip(),
                    'status': ticket['status'],
                    'message': 'Ticket cancelled'
                }
            
            # Check if event is still active
            if event.get('status') != 'published':
                return {
                    'success': False,
                    'ticket_id': ticket['id'],
                    'event_title': event.get('title'),
                    'tier_name': tier.get('name'),
                    'attendee_name': f"{user.get('first_name', '')} {user.get('last_name', '')}".strip(),
                    'status': ticket['status'],
                    'message': 'Event is not active'
                }
            
            return {
                'success': True,
                'ticket_id': ticket['id'],
                'event_title': event.get('title'),
                'tier_name': tier.get('name'),
                'attendee_name': f"{user.get('first_name', '')} {user.get('last_name', '')}".strip(),
                'status': ticket['status'],
                'message': 'Ticket is valid'
            }
            
        except Exception as e:
            logger.error(f"Verify ticket error: {e}")
            return {
                'success': False,
                'message': 'Failed to verify ticket'
            }
    
    async def mark_ticket_used(self, mark_data: Dict[str, Any]) -> Dict[str, Any]:
        """Mark a ticket as used after successful verification"""
        try:
            # Find ticket by QR code
            result = self.supabase.table('tickets').select('*').eq('qr_code', mark_data['qr_code']).execute()
            
            if not result.data:
                return {
                    'success': False,
                    'error': {
                        'code': 'TICKET_NOT_FOUND',
                        'message': 'Ticket not found'
                    }
                }
            
            ticket = result.data[0]
            
            if ticket['status'] != 'active':
                return {
                    'success': False,
                    'error': {
                        'code': 'TICKET_NOT_ACTIVE',
                        'message': 'Ticket is not active'
                    }
                }
            
            # Update ticket status
            update_data = {
                'status': 'used',
                'used_at': datetime.utcnow().isoformat(),
                'scanned_by': mark_data['scanned_by'],
                'scan_location': mark_data.get('location'),
                'updated_at': datetime.utcnow().isoformat()
            }
            
            update_result = self.supabase.table('tickets').update(update_data).eq('id', ticket['id']).execute()
            
            if not update_result.data:
                return {
                    'success': False,
                    'error': {
                        'code': 'INTERNAL_ERROR',
                        'message': 'Failed to mark ticket as used'
                    }
                }
            
            # Record scan history
            scan_record = {
                'ticket_id': ticket['id'],
                'scanned_by': mark_data['scanned_by'],
                'scanned_at': datetime.utcnow().isoformat(),
                'location': mark_data.get('location'),
                'device_info': mark_data.get('device_info'),
                'scan_type': 'qr_code',
                'created_at': datetime.utcnow().isoformat()
            }
            
            self.supabase.table('scan_history').insert(scan_record).execute()
            
            return {
                'success': True,
                'message': 'Ticket marked as used successfully'
            }
            
        except Exception as e:
            logger.error(f"Mark ticket used error: {e}")
            return {
                'success': False,
                'error': {
                    'code': 'INTERNAL_ERROR',
                    'message': 'Failed to mark ticket as used'
                }
            }
    
    async def get_scan_history(self, ticket_id: str) -> List[Dict[str, Any]]:
        """Get scan history for a ticket"""
        try:
            result = self.supabase.table('scan_history').select('*').eq('ticket_id', ticket_id).order('scanned_at', desc=True).execute()
            
            return result.data or []
            
        except Exception as e:
            logger.error(f"Get scan history error: {e}")
            return []

# Global ticket service instance
ticket_service = TicketService()