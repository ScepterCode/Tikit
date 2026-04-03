"""
Email Service for sending transactional emails
Uses Supabase Auth for email delivery (built-in, no configuration needed!)
"""
import logging
from typing import Optional, Dict, Any
from config import config
from datetime import datetime
from services.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)

class EmailService:
    """Handle all email sending operations using Supabase Auth"""
    
    def __init__(self):
        self.supabase = get_supabase_client()
        self.email_from = config.EMAIL_FROM
        self.enabled = config.ENABLE_EMAIL_NOTIFICATIONS
        self.frontend_url = config.FRONTEND_URL
        
        if self.supabase:
            logger.info("✅ Email service initialized with Supabase Auth")
        else:
            logger.warning("⚠️ Supabase client not available")
            self.enabled = False
    
    async def send_verification_email(
        self, 
        email: str, 
        token: str, 
        user_name: str
    ) -> Dict[str, Any]:
        """Send email verification using Supabase Auth"""
        try:
            if not self.supabase:
                return {
                    "success": False,
                    "error": "Supabase client not initialized"
                }
            
            # Use Supabase Auth to send verification email
            # Supabase will handle the email delivery automatically
            verification_url = f"{self.frontend_url}/verify-email?token={token}"
            
            # For now, we'll queue it in the database
            # In production, you can use Supabase's built-in email or a service like Resend
            email_data = {
                "to_email": email,
                "subject": "Verify Your Tikit Account",
                "html_body": self._get_verification_html(user_name, verification_url),
                "text_body": self._get_verification_text(user_name, verification_url),
                "email_type": "verification",
                "status": "pending",
                "created_at": datetime.utcnow().isoformat(),
                "attempts": 0
            }
            
            result = self.supabase.table('email_queue').insert(email_data).execute()
            
            if result.data:
                logger.info(f"✅ Verification email queued for {email}")
                
                # Try to send immediately using Supabase Auth
                try:
                    # Use Supabase's magic link feature to send email
                    auth_result = self.supabase.auth.sign_in_with_otp({
                        "email": email,
                        "options": {
                            "email_redirect_to": verification_url,
                            "should_create_user": False
                        }
                    })
                    logger.info(f"✅ Verification email sent via Supabase Auth to {email}")
                except Exception as e:
                    logger.warning(f"⚠️ Could not send via Supabase Auth: {e}")
                    # Email is still queued, will be processed later
                
                return {
                    "success": True,
                    "message": "Verification email sent"
                }
            else:
                return {
                    "success": False,
                    "error": "Failed to queue email"
                }
                
        except Exception as e:
            logger.error(f"❌ Error sending verification email: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def send_email(
        self, 
        to_email: str, 
        subject: str, 
        html_body: str, 
        text_body: Optional[str] = None,
        email_type: str = "transactional"
    ) -> Dict[str, Any]:
        """
        Send email via Supabase (uses their email templates and delivery)
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_body: HTML email body
            text_body: Plain text fallback (optional)
            email_type: Type of email (verification, otp, ticket, etc.)
            
        Returns:
            Dict with success status and message
        """
        if not self.enabled:
            logger.warning(f"Email service disabled. Would send to {to_email}: {subject}")
            return {
                "success": False,
                "error": "Email service not configured"
            }
        
        try:
            # For transactional emails, we'll store them in the email_queue table
            # and use Supabase Edge Functions or a cron job to send them
            # This is more reliable than direct SMTP
            
            email_data = {
                "to_email": to_email,
                "subject": subject,
                "html_body": html_body,
                "text_body": text_body or "",
                "email_type": email_type,
                "status": "pending",
                "created_at": datetime.utcnow().isoformat(),
                "attempts": 0
            }
            
            # Insert into email queue
            result = self.supabase.table('email_queue').insert(email_data).execute()
            
            if result.data:
                logger.info(f"✅ Email queued for {to_email}: {subject}")
                return {
                    "success": True,
                    "message": "Email queued successfully"
                }
            else:
                logger.error(f"❌ Failed to queue email for {to_email}")
                return {
                    "success": False,
                    "error": "Failed to queue email"
                }
            
        except Exception as e:
            logger.error(f"❌ Error queueing email to {to_email}: {e}")
            return {
                "success": False,
                "error": f"Email queueing failed: {str(e)}"
            }
    
    async def send_verification_email(
        self, 
        email: str, 
        token: str, 
        user_name: str
    ) -> Dict[str, Any]:
        """Send email verification link using Supabase"""
        verification_url = f"{self.frontend_url}/verify-email?token={token}"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 0;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            <!-- Header -->
                            <tr>
                                <td style="padding: 40px 40px 20px; text-align: center;">
                                    <h1 style="color: #667eea; margin: 0; font-size: 32px;">Tikit</h1>
                                </td>
                            </tr>
                            
                            <!-- Content -->
                            <tr>
                                <td style="padding: 0 40px 40px;">
                                    <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 24px;">Welcome to Tikit, {user_name}!</h2>
                                    <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                        Thank you for signing up! Please verify your email address to get started with Tikit.
                                    </p>
                                    <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                                        Click the button below to verify your email:
                                    </p>
                                    
                                    <!-- Button -->
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td align="center" style="padding: 0 0 30px;">
                                                <a href="{verification_url}" style="background-color: #667eea; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block;">
                                                    Verify Email Address
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                    
                                    <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0 0 10px;">
                                        Or copy and paste this link into your browser:
                                    </p>
                                    <p style="color: #667eea; font-size: 14px; word-break: break-all; margin: 0 0 20px;">
                                        {verification_url}
                                    </p>
                                    
                                    <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0;">
                                        This link expires in 24 hours. If you didn't create an account, please ignore this email.
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="padding: 20px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                                    <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                                        © 2026 Tikit. All rights reserved.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
        
        text_body = f"""
        Welcome to Tikit, {user_name}!
        
        Please verify your email address by clicking this link:
        {verification_url}
        
        This link expires in 24 hours.
        
        If you didn't create an account, please ignore this email.
        
        © 2026 Tikit. All rights reserved.
        """
        
        return await self.send_email(
            to_email=email,
            subject="Verify Your Tikit Account",
            html_body=html_body,
            text_body=text_body,
            email_type="verification"
        )
    
    async def send_otp_email(
        self, 
        email: str, 
        otp_code: str, 
        purpose: str, 
        expires_in: int
    ) -> Dict[str, Any]:
        """Send OTP code via email"""
        minutes = expires_in // 60
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 0;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            <!-- Header -->
                            <tr>
                                <td style="padding: 40px 40px 20px; text-align: center;">
                                    <h1 style="color: #667eea; margin: 0; font-size: 32px;">Tikit</h1>
                                </td>
                            </tr>
                            
                            <!-- Content -->
                            <tr>
                                <td style="padding: 0 40px 40px; text-align: center;">
                                    <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 24px;">Verification Code</h2>
                                    <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                                        Your verification code for {purpose}:
                                    </p>
                                    
                                    <!-- OTP Code -->
                                    <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 0 0 30px;">
                                        <h1 style="color: #667eea; margin: 0; font-size: 48px; letter-spacing: 12px; font-weight: bold;">
                                            {otp_code}
                                        </h1>
                                    </div>
                                    
                                    <p style="color: #ef4444; font-size: 14px; font-weight: 600; margin: 0 0 10px;">
                                        ⏰ This code expires in {minutes} minutes
                                    </p>
                                    
                                    <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0;">
                                        If you didn't request this code, please ignore this email or contact support if you're concerned about your account security.
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="padding: 20px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                                    <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                                        © 2026 Tikit. All rights reserved.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
        
        text_body = f"""
        Your Tikit Verification Code
        
        Your OTP code for {purpose}: {otp_code}
        
        This code expires in {minutes} minutes.
        
        If you didn't request this code, please ignore this email.
        
        © 2026 Tikit. All rights reserved.
        """
        
        return await self.send_email(
            to_email=email,
            subject=f"Your Tikit Verification Code: {otp_code}",
            html_body=html_body,
            text_body=text_body,
            email_type="otp"
        )
    
    async def send_ticket_confirmation(
        self, 
        email: str, 
        ticket_data: Dict[str, Any],
        qr_code_base64: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send ticket confirmation with QR code and ticket code"""
        
        # Get ticket code from ticket_data
        ticket_code = ticket_data.get('ticket_code', 'N/A')
        
        qr_code_html = ""
        if qr_code_base64:
            qr_code_html = f'<img src="data:image/png;base64,{qr_code_base64}" alt="QR Code" style="width: 300px; height: 300px; margin: 20px 0;">'
        else:
            qr_code_html = '<p style="color: #ef4444; font-size: 14px;">QR Code generation failed</p>'
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 0;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            <!-- Header -->
                            <tr>
                                <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 32px;">🎉 Ticket Confirmed!</h1>
                                </td>
                            </tr>
                            
                            <!-- Content -->
                            <tr>
                                <td style="padding: 40px;">
                                    <h2 style="color: #1f2937; margin: 0 0 10px; font-size: 24px;">{ticket_data.get('event_title', 'Event')}</h2>
                                    <p style="color: #6b7280; font-size: 16px; margin: 0 0 30px;">
                                        Thank you for your purchase! Your ticket is ready.
                                    </p>
                                    
                                    <!-- Ticket Code Display -->
                                    <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 0 0 30px; text-align: center;">
                                        <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px; font-weight: 600;">TICKET CODE</p>
                                        <h1 style="color: #667eea; margin: 0; font-size: 36px; letter-spacing: 4px; font-weight: bold; font-family: 'Courier New', monospace;">
                                            {ticket_code}
                                        </h1>
                                    </div>
                                    
                                    <!-- Ticket Details -->
                                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px;">
                                        <tr>
                                            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                                <span style="color: #6b7280; font-size: 14px;">Event Date:</span>
                                            </td>
                                            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                                                <span style="color: #1f2937; font-size: 14px; font-weight: 600;">{ticket_data.get('event_date', 'TBD')}</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                                <span style="color: #6b7280; font-size: 14px;">Venue:</span>
                                            </td>
                                            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                                                <span style="color: #1f2937; font-size: 14px; font-weight: 600;">{ticket_data.get('venue', 'TBD')}</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                                <span style="color: #6b7280; font-size: 14px;">Ticket Type:</span>
                                            </td>
                                            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                                                <span style="color: #1f2937; font-size: 14px; font-weight: 600;">{ticket_data.get('tier_name', 'General')}</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                                <span style="color: #6b7280; font-size: 14px;">Quantity:</span>
                                            </td>
                                            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                                                <span style="color: #1f2937; font-size: 14px; font-weight: 600;">{ticket_data.get('quantity', 1)}</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 12px 0;">
                                                <span style="color: #6b7280; font-size: 14px;">Total Paid:</span>
                                            </td>
                                            <td style="padding: 12px 0; text-align: right;">
                                                <span style="color: #059669; font-size: 18px; font-weight: bold;">₦{ticket_data.get('amount', 0):,.2f}</span>
                                            </td>
                                        </tr>
                                    </table>
                                    
                                    <!-- QR Code -->
                                    <div style="text-align: center; margin: 30px 0;">
                                        <h3 style="color: #1f2937; margin: 0 0 20px; font-size: 18px;">Your Entry QR Code</h3>
                                        {qr_code_html}
                                        <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0;">
                                            📱 Show this QR code at the event entrance
                                        </p>
                                        <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0;">
                                            QR code contains your ticket code for verification
                                        </p>
                                    </div>
                                    
                                    <!-- Important Info -->
                                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin: 30px 0 0;">
                                        <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: 600;">
                                            ⚠️ Important: Save this email or screenshot your QR code and ticket code.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="padding: 20px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                                    <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                                        Need help? Contact us at support@tikit.app<br>
                                        © 2026 Tikit. All rights reserved.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
        
        return await self.send_email(
            to_email=email,
            subject=f"Your Ticket: {ticket_data.get('event_title', 'Event')}",
            html_body=html_body,
            email_type="ticket"
        )
    
    async def send_password_reset(
        self, 
        email: str, 
        reset_token: str, 
        user_name: str
    ) -> Dict[str, Any]:
        """Send password reset link"""
        reset_url = f"{config.FRONTEND_URL}/auth/reset-password?token={reset_token}"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 0;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            <tr>
                                <td style="padding: 40px;">
                                    <h2 style="color: #1f2937; margin: 0 0 20px;">Password Reset Request</h2>
                                    <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                        Hi {user_name},
                                    </p>
                                    <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                                        We received a request to reset your password. Click the button below to create a new password:
                                    </p>
                                    
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td align="center" style="padding: 0 0 30px;">
                                                <a href="{reset_url}" style="background-color: #667eea; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block;">
                                                    Reset Password
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                    
                                    <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
                                        This link expires in 1 hour. If you didn't request this, please ignore this email.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
        
        return await self.send_email(
            to_email=email,
            subject="Reset Your Tikit Password",
            html_body=html_body,
            email_type="password_reset"
        )
    
    async def send_event_reminder(
        self, 
        email: str, 
        event_data: Dict[str, Any], 
        hours_before: int
    ) -> Dict[str, Any]:
        """Send event reminder"""
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif;">
            <h2>Event Reminder: {event_data.get('title', 'Event')}</h2>
            <p>Your event is starting in {hours_before} hours!</p>
            <p><strong>Event:</strong> {event_data.get('title', 'Event')}</p>
            <p><strong>Date:</strong> {event_data.get('date', 'TBD')}</p>
            <p><strong>Time:</strong> {event_data.get('time', 'TBD')}</p>
            <p><strong>Venue:</strong> {event_data.get('venue', 'TBD')}</p>
            <p>Don't forget to bring your ticket QR code!</p>
        </body>
        </html>
        """
        
        return await self.send_email(
            to_email=email,
            subject=f"Reminder: {event_data.get('title', 'Event')} starts in {hours_before} hours",
            html_body=html_body,
            email_type="reminder"
        )

# Global instance
email_service = EmailService()
