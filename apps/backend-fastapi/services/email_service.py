"""
Email Service for sending transactional emails
Supports SMTP and can be extended for SendGrid, AWS SES, etc.
"""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from typing import Optional, Dict, Any
from config import config
from datetime import datetime

logger = logging.getLogger(__name__)

class EmailService:
    """Handle all email sending operations"""
    
    def __init__(self):
        self.smtp_host = config.SMTP_HOST
        self.smtp_port = config.SMTP_PORT
        self.smtp_username = config.SMTP_USERNAME
        self.smtp_password = config.SMTP_PASSWORD
        self.email_from = config.EMAIL_FROM
        self.enabled = config.ENABLE_EMAIL_NOTIFICATIONS
        
        # Validate configuration
        if not self.smtp_username or not self.smtp_password:
            logger.warning("⚠️ Email service not configured. Set SMTP credentials in .env")
            self.enabled = False
        else:
            logger.info("✅ Email service initialized")
    
    async def send_email(
        self, 
        to_email: str, 
        subject: str, 
        html_body: str, 
        text_body: Optional[str] = None,
        attachments: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        Send email via SMTP
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_body: HTML email body
            text_body: Plain text fallback (optional)
            attachments: List of attachments (optional)
            
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
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = self.email_from
            msg['To'] = to_email
            msg['Subject'] = subject
            msg['Date'] = datetime.utcnow().strftime('%a, %d %b %Y %H:%M:%S +0000')
            
            # Add text and HTML parts
            if text_body:
                msg.attach(MIMEText(text_body, 'plain', 'utf-8'))
            msg.attach(MIMEText(html_body, 'html', 'utf-8'))
            
            # Add attachments if provided
            if attachments:
                for attachment in attachments:
                    msg.attach(attachment)
            
            # Send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=10) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            logger.info(f"✅ Email sent to {to_email}: {subject}")
            return {
                "success": True,
                "message": "Email sent successfully"
            }
            
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"❌ SMTP authentication failed: {e}")
            return {
                "success": False,
                "error": "Email authentication failed"
            }
        except smtplib.SMTPException as e:
            logger.error(f"❌ SMTP error sending to {to_email}: {e}")
            return {
                "success": False,
                "error": f"Failed to send email: {str(e)}"
            }
        except Exception as e:
            logger.error(f"❌ Unexpected error sending email to {to_email}: {e}")
            return {
                "success": False,
                "error": f"Email sending failed: {str(e)}"
            }
    
    async def send_verification_email(
        self, 
        email: str, 
        token: str, 
        user_name: str
    ) -> Dict[str, Any]:
        """Send email verification link"""
        verification_url = f"{config.FRONTEND_URL}/verify-email?token={token}"
        
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
            text_body=text_body
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
            text_body=text_body
        )
    
    async def send_ticket_confirmation(
        self, 
        email: str, 
        ticket_data: Dict[str, Any],
        qr_code_base64: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send ticket confirmation with QR code"""
        
        qr_code_html = ""
        if qr_code_base64:
            qr_code_html = f'<img src="data:image/png;base64,{qr_code_base64}" alt="QR Code" style="width: 300px; height: 300px; margin: 20px 0;">'
        
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
                                    </div>
                                    
                                    <!-- Important Info -->
                                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin: 30px 0 0;">
                                        <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: 600;">
                                            ⚠️ Important: Please save this email or take a screenshot of your QR code.
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
            html_body=html_body
        )
    
    async def send_password_reset(
        self, 
        email: str, 
        reset_token: str, 
        user_name: str
    ) -> Dict[str, Any]:
        """Send password reset link"""
        reset_url = f"{config.FRONTEND_URL}/reset-password?token={reset_token}"
        
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
            html_body=html_body
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
            html_body=html_body
        )

# Global instance
email_service = EmailService()
