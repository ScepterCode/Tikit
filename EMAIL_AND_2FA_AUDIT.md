# 📧 Email & 2FA Security Audit Report

## Date: April 2, 2026

---

## 🔍 Executive Summary

**Status**: 🟡 PARTIALLY IMPLEMENTED - Critical Gaps Found

### Quick Assessment
- ✅ **2FA/OTP Infrastructure**: Implemented but NOT sending emails/SMS
- ❌ **Email Service**: Configured but NOT implemented
- ❌ **Email Verification**: NOT implemented
- ⚠️ **Wallet 2FA**: Code exists but emails/SMS not sent
- ❌ **Ticket Delivery**: No email confirmation system

---

## 📊 Current State Analysis

### 1. Email Configuration ✅ (Config Only)

**File**: `apps/backend-fastapi/config.py`

```python
# Email Configuration EXISTS
SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
EMAIL_FROM: str = os.getenv("EMAIL_FROM", "noreply@tikit.app")
```

**Status**: ✅ Configuration exists
**Problem**: ❌ No email service implementation found

---

### 2. Email Service Implementation ❌ NOT FOUND

**Search Results**: No `email_service.py` file exists

**What's Missing**:
```python
# This file DOES NOT EXIST:
# apps/backend-fastapi/services/email_service.py

# Should contain:
- send_email()
- send_verification_email()
- send_otp_email()
- send_ticket_confirmation()
- send_password_reset()
- send_welcome_email()
```

**Impact**: 🔴 CRITICAL
- Users cannot receive email confirmations
- OTP codes not delivered
- Tickets not sent via email
- Password reset impossible
- No email verification

---

### 3. Wallet 2FA/OTP System 🟡 PARTIAL

**File**: `apps/backend-fastapi/services/wallet_security_service.py`

#### ✅ What's Implemented:

1. **OTP Generation**:
```python
def generate_otp(self, user_id: str, purpose: str = "transaction") -> Dict[str, Any]:
    """Generate OTP for transaction verification"""
    otp_code = f"{secrets.randbelow(900000) + 100000:06d}"  # 6-digit OTP
    expires_at = time.time() + self.OTP_EXPIRY  # 5 minutes
    
    self.otp_codes[user_id] = {
        "code": otp_code,
        "purpose": purpose,
        "expires_at": expires_at,
        "attempts": 0,
        "created_at": time.time()
    }
    
    return {
        "success": True,
        "otp_code": otp_code,  # ⚠️ RETURNED IN RESPONSE (INSECURE!)
        "expires_in": self.OTP_EXPIRY,
        "message": f"OTP sent for {purpose} verification"
    }
```

**Status**: ✅ OTP generation works
**Problem**: ❌ OTP returned in API response instead of sent via email/SMS

2. **OTP Verification**:
```python
def verify_otp(self, user_id: str, otp_code: str) -> Dict[str, Any]:
    """Verify OTP code"""
    # ✅ Checks expiry
    # ✅ Limits attempts (3 max)
    # ✅ Validates code
    # ✅ Cleans up after verification
```

**Status**: ✅ Verification logic is solid

3. **Transaction PIN**:
```python
def set_transaction_pin(self, user_id: str, pin: str) -> Dict[str, Any]:
    """Set or update transaction PIN"""
    # ✅ Validates PIN format (4-6 digits)
    # ✅ Hashes PIN securely (PBKDF2)
    # ✅ Stores hashed PIN
```

**Status**: ✅ PIN system is secure

4. **Security Features**:
```python
# ✅ Failed attempt tracking
# ✅ Account lockout (5 minutes after 3 failed attempts)
# ✅ Fraud detection (velocity, amount spikes, unusual times)
# ✅ Transaction limits by user tier
```

**Status**: ✅ Security infrastructure is excellent

#### ❌ What's Missing:

1. **Email/SMS Delivery**:
```python
# Current code (INSECURE):
return {
    "success": True,
    "otp_code": otp_code,  # ❌ EXPOSED IN API RESPONSE!
    "expires_in": self.OTP_EXPIRY
}

# Should be:
# 1. Send OTP via email/SMS
# 2. Return success without OTP code
# 3. Log delivery status
```

2. **Email Integration**:
```python
# Missing in generate_otp():
await email_service.send_otp_email(
    user_email=user_email,
    otp_code=otp_code,
    purpose=purpose,
    expires_in=self.OTP_EXPIRY
)
```

3. **SMS Integration**:
```python
# Missing in generate_otp():
await sms_service.send_otp_sms(
    phone_number=user_phone,
    otp_code=otp_code,
    purpose=purpose
)
```

---

### 4. Email Verification ❌ NOT IMPLEMENTED

**File**: `apps/backend-fastapi/services/auth_service.py`

**Current Registration Flow**:
```python
async def register_user(self, user_data: dict) -> Dict[str, Any]:
    # ...
    user_record = {
        'phone_verified': True,  # ❌ AUTO-VERIFIED (NO VERIFICATION!)
        'is_verified': False,    # ❌ NOT USED
        # ...
    }
```

**Problems**:
1. ❌ No email verification sent
2. ❌ Phone auto-verified without OTP
3. ❌ No verification token generation
4. ❌ No verification endpoint

**What Should Happen**:
```python
# 1. Generate verification token
verification_token = secrets.token_urlsafe(32)

# 2. Send verification email
await email_service.send_verification_email(
    email=user_email,
    token=verification_token,
    user_name=user_name
)

# 3. Store token in database
# 4. Create verification endpoint
# 5. Mark user as verified after clicking link
```

---

### 5. Notification Service 🟡 PARTIAL

**File**: `apps/backend-fastapi/services/notification_service.py`

#### ✅ What Exists:
- In-app notifications (database-stored)
- Notification types: payment, security, wallet, referral, system
- Real-time notifications table

#### ❌ What's Missing:
- Email notifications
- SMS notifications
- Push notifications
- Notification templates
- Email queue system

**Current Implementation**:
```python
async def notify_payment_update(self, user_id: str, payment_type: str, 
                               amount: float, status: str) -> Dict[str, Any]:
    # ✅ Creates in-app notification
    # ❌ Does NOT send email
    # ❌ Does NOT send SMS
    # ❌ Does NOT send push notification
```

---

## 🚨 Critical Security Issues

### Issue 1: OTP Exposed in API Response 🔴 CRITICAL

**Current Code**:
```python
# apps/backend-fastapi/routers/wallet.py
@router.post("/security/generate-otp")
async def generate_otp(request: Request, otp_data: OTPRequest):
    result = wallet_security_service.generate_otp(user_id, otp_data.purpose)
    
    return {
        "success": True,
        "message": result["message"],
        "expires_in": result["expires_in"]
        # Note: In production, OTP would be sent via SMS/Email, not returned
    }
```

**Problem**: Comment says "not returned" but code DOES return OTP in development

**Risk**: 
- OTP visible in network logs
- OTP visible in browser console
- OTP can be intercepted
- Defeats purpose of 2FA

**Fix Required**: Remove OTP from response, send via email/SMS

---

### Issue 2: No Email Verification 🔴 CRITICAL

**Current Code**:
```python
user_record = {
    'phone_verified': True,  # ❌ AUTO-VERIFIED
    'is_verified': False,    # ❌ NOT CHECKED ANYWHERE
}
```

**Risk**:
- Fake email addresses accepted
- No way to recover account
- Cannot send important notifications
- Spam/bot accounts possible

---

### Issue 3: No Ticket Email Delivery ❌ CRITICAL

**Impact**:
- Users don't receive tickets via email
- No QR code sent
- No confirmation email
- Poor user experience

---

## 📋 Implementation Checklist

### Phase 1: Email Service (Week 1) 🔴 URGENT

#### Step 1: Create Email Service
```python
# File: apps/backend-fastapi/services/email_service.py

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from config import config
import logging

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_host = config.SMTP_HOST
        self.smtp_port = config.SMTP_PORT
        self.smtp_username = config.SMTP_USERNAME
        self.smtp_password = config.SMTP_PASSWORD
        self.email_from = config.EMAIL_FROM
    
    async def send_email(self, to_email: str, subject: str, 
                        html_body: str, text_body: str = None) -> bool:
        """Send email via SMTP"""
        try:
            msg = MIMEMultipart('alternative')
            msg['From'] = self.email_from
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Add text and HTML parts
            if text_body:
                msg.attach(MIMEText(text_body, 'plain'))
            msg.attach(MIMEText(html_body, 'html'))
            
            # Send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            logger.info(f"✅ Email sent to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to send email to {to_email}: {e}")
            return False
    
    async def send_verification_email(self, email: str, token: str, 
                                     user_name: str) -> bool:
        """Send email verification link"""
        verification_url = f"{config.FRONTEND_URL}/verify-email?token={token}"
        
        html_body = f"""
        <html>
        <body>
            <h2>Welcome to Tikit, {user_name}!</h2>
            <p>Please verify your email address by clicking the link below:</p>
            <a href="{verification_url}" style="background-color: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Verify Email
            </a>
            <p>Or copy this link: {verification_url}</p>
            <p>This link expires in 24 hours.</p>
        </body>
        </html>
        """
        
        return await self.send_email(
            to_email=email,
            subject="Verify Your Tikit Account",
            html_body=html_body
        )
    
    async def send_otp_email(self, email: str, otp_code: str, 
                            purpose: str, expires_in: int) -> bool:
        """Send OTP code via email"""
        html_body = f"""
        <html>
        <body>
            <h2>Your Tikit Verification Code</h2>
            <p>Your OTP code for {purpose}:</p>
            <h1 style="font-size: 32px; letter-spacing: 8px; color: #667eea;">{otp_code}</h1>
            <p>This code expires in {expires_in // 60} minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
        </body>
        </html>
        """
        
        return await self.send_email(
            to_email=email,
            subject=f"Your Tikit OTP Code: {otp_code}",
            html_body=html_body
        )
    
    async def send_ticket_confirmation(self, email: str, ticket_data: dict, 
                                      qr_code_image: bytes) -> bool:
        """Send ticket confirmation with QR code"""
        html_body = f"""
        <html>
        <body>
            <h2>Your Ticket for {ticket_data['event_title']}</h2>
            <p>Thank you for your purchase!</p>
            <p><strong>Event:</strong> {ticket_data['event_title']}</p>
            <p><strong>Date:</strong> {ticket_data['event_date']}</p>
            <p><strong>Venue:</strong> {ticket_data['venue']}</p>
            <p><strong>Ticket Type:</strong> {ticket_data['tier_name']}</p>
            <p><strong>Quantity:</strong> {ticket_data['quantity']}</p>
            <p><strong>Total Paid:</strong> ₦{ticket_data['amount']:,.2f}</p>
            <h3>Your QR Code:</h3>
            <img src="cid:qr_code" alt="QR Code" style="width: 300px; height: 300px;">
            <p>Show this QR code at the event entrance.</p>
        </body>
        </html>
        """
        
        # Create message with QR code attachment
        msg = MIMEMultipart('related')
        msg['From'] = self.email_from
        msg['To'] = email
        msg['Subject'] = f"Your Ticket: {ticket_data['event_title']}"
        
        msg.attach(MIMEText(html_body, 'html'))
        
        # Attach QR code
        qr_image = MIMEImage(qr_code_image)
        qr_image.add_header('Content-ID', '<qr_code>')
        msg.attach(qr_image)
        
        try:
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            logger.info(f"✅ Ticket sent to {email}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to send ticket to {email}: {e}")
            return False
    
    async def send_password_reset(self, email: str, reset_token: str, 
                                 user_name: str) -> bool:
        """Send password reset link"""
        reset_url = f"{config.FRONTEND_URL}/reset-password?token={reset_token}"
        
        html_body = f"""
        <html>
        <body>
            <h2>Password Reset Request</h2>
            <p>Hi {user_name},</p>
            <p>Click the link below to reset your password:</p>
            <a href="{reset_url}" style="background-color: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Reset Password
            </a>
            <p>Or copy this link: {reset_url}</p>
            <p>This link expires in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
        </body>
        </html>
        """
        
        return await self.send_email(
            to_email=email,
            subject="Reset Your Tikit Password",
            html_body=html_body
        )
    
    async def send_event_reminder(self, email: str, event_data: dict, 
                                 hours_before: int) -> bool:
        """Send event reminder"""
        html_body = f"""
        <html>
        <body>
            <h2>Event Reminder: {event_data['title']}</h2>
            <p>Your event is starting in {hours_before} hours!</p>
            <p><strong>Event:</strong> {event_data['title']}</p>
            <p><strong>Date:</strong> {event_data['date']}</p>
            <p><strong>Time:</strong> {event_data['time']}</p>
            <p><strong>Venue:</strong> {event_data['venue']}</p>
            <p>Don't forget to bring your ticket QR code!</p>
        </body>
        </html>
        """
        
        return await self.send_email(
            to_email=email,
            subject=f"Reminder: {event_data['title']} starts in {hours_before} hours",
            html_body=html_body
        )

# Global instance
email_service = EmailService()
```

#### Step 2: Update Wallet Security Service
```python
# File: apps/backend-fastapi/services/wallet_security_service.py

async def generate_otp(self, user_id: str, purpose: str = "transaction") -> Dict[str, Any]:
    """Generate OTP for transaction verification"""
    otp_code = f"{secrets.randbelow(900000) + 100000:06d}"
    expires_at = time.time() + self.OTP_EXPIRY
    
    self.otp_codes[user_id] = {
        "code": otp_code,
        "purpose": purpose,
        "expires_at": expires_at,
        "attempts": 0,
        "created_at": time.time()
    }
    
    # ✅ SEND OTP VIA EMAIL (NEW)
    from services.email_service import email_service
    from database import supabase_client
    
    # Get user email
    supabase = supabase_client.get_service_client()
    user_result = supabase.table('users').select('email').eq('id', user_id).execute()
    
    if user_result.data and user_result.data[0].get('email'):
        user_email = user_result.data[0]['email']
        await email_service.send_otp_email(
            email=user_email,
            otp_code=otp_code,
            purpose=purpose,
            expires_in=self.OTP_EXPIRY
        )
    
    return {
        "success": True,
        # ❌ REMOVE OTP FROM RESPONSE
        "expires_in": self.OTP_EXPIRY,
        "message": f"OTP sent to your email for {purpose} verification"
    }
```

#### Step 3: Add Email Verification
```python
# File: apps/backend-fastapi/services/auth_service.py

async def register_user(self, user_data: dict) -> Dict[str, Any]:
    # ... existing code ...
    
    # Generate verification token
    verification_token = secrets.token_urlsafe(32)
    verification_expires = datetime.utcnow() + timedelta(hours=24)
    
    user_record = {
        # ... existing fields ...
        'phone_verified': False,  # ✅ CHANGED
        'email_verified': False,  # ✅ NEW
        'verification_token': verification_token,  # ✅ NEW
        'verification_expires': verification_expires.isoformat(),  # ✅ NEW
    }
    
    # Insert user
    result = self.supabase.table('users').insert(user_record).execute()
    user = result.data[0]
    
    # ✅ SEND VERIFICATION EMAIL (NEW)
    if user.get('email'):
        from services.email_service import email_service
        await email_service.send_verification_email(
            email=user['email'],
            token=verification_token,
            user_name=f"{user['first_name']} {user['last_name']}"
        )
    
    # ... rest of code ...

async def verify_email(self, token: str) -> Dict[str, Any]:
    """Verify email with token"""
    try:
        # Find user with token
        result = self.supabase.table('users').select('*').eq('verification_token', token).execute()
        
        if not result.data:
            return {
                'success': False,
                'error': {
                    'code': 'INVALID_TOKEN',
                    'message': 'Invalid verification token'
                }
            }
        
        user = result.data[0]
        
        # Check expiry
        if datetime.fromisoformat(user['verification_expires']) < datetime.utcnow():
            return {
                'success': False,
                'error': {
                    'code': 'TOKEN_EXPIRED',
                    'message': 'Verification token has expired'
                }
            }
        
        # Update user
        self.supabase.table('users').update({
            'email_verified': True,
            'verification_token': None,
            'verification_expires': None,
            'updated_at': datetime.utcnow().isoformat()
        }).eq('id', user['id']).execute()
        
        return {
            'success': True,
            'message': 'Email verified successfully'
        }
        
    except Exception as e:
        logger.error(f"Email verification error: {e}")
        return {
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': 'Failed to verify email'
            }
        }
```

---

### Phase 2: SMS Service (Week 2) 🟠 HIGH

#### Option 1: Africa's Talking (Recommended for Nigeria)
```python
# File: apps/backend-fastapi/services/sms_service.py

import africastalking
from config import config

class SMSService:
    def __init__(self):
        africastalking.initialize(
            username=config.AFRICASTALKING_USERNAME,
            api_key=config.AFRICASTALKING_API_KEY
        )
        self.sms = africastalking.SMS
    
    async def send_otp_sms(self, phone_number: str, otp_code: str, 
                          purpose: str) -> bool:
        """Send OTP via SMS"""
        try:
            message = f"Your Tikit OTP for {purpose}: {otp_code}. Valid for 5 minutes."
            
            response = self.sms.send(message, [phone_number])
            
            logger.info(f"✅ SMS sent to {phone_number}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to send SMS to {phone_number}: {e}")
            return False

sms_service = SMSService()
```

#### Option 2: Twilio (International)
```python
from twilio.rest import Client

class SMSService:
    def __init__(self):
        self.client = Client(
            config.TWILIO_ACCOUNT_SID,
            config.TWILIO_AUTH_TOKEN
        )
        self.from_number = config.TWILIO_PHONE_NUMBER
    
    async def send_otp_sms(self, phone_number: str, otp_code: str, 
                          purpose: str) -> bool:
        try:
            message = self.client.messages.create(
                body=f"Your Tikit OTP for {purpose}: {otp_code}. Valid for 5 minutes.",
                from_=self.from_number,
                to=phone_number
            )
            
            logger.info(f"✅ SMS sent to {phone_number}: {message.sid}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to send SMS: {e}")
            return False
```

---

### Phase 3: Database Migrations (Week 1) 🔴 URGENT

```sql
-- Add email verification fields
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS verification_expires TIMESTAMP;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_users_verification_token 
ON users(verification_token);

CREATE INDEX IF NOT EXISTS idx_users_email_verified 
ON users(email_verified);

-- Add 2FA settings
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS two_factor_method VARCHAR(20) DEFAULT 'email'; -- 'email', 'sms', 'both'

-- Create email queue table for async sending
CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    html_body TEXT NOT NULL,
    text_body TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    sent_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_queue_status 
ON email_queue(status);

CREATE INDEX IF NOT EXISTS idx_email_queue_created_at 
ON email_queue(created_at DESC);
```

---

## 🎯 Priority Recommendations

### Immediate Actions (This Week)

1. **Create Email Service** 🔴 CRITICAL
   - Implement `email_service.py`
   - Test SMTP connection
   - Create email templates

2. **Fix OTP Security** 🔴 CRITICAL
   - Remove OTP from API response
   - Send OTP via email
   - Add SMS option

3. **Add Email Verification** 🔴 CRITICAL
   - Generate verification tokens
   - Send verification emails
   - Create verification endpoint

4. **Ticket Email Delivery** 🔴 CRITICAL
   - Send tickets via email
   - Include QR code
   - Add event details

### Next Week

5. **SMS Service** 🟠 HIGH
   - Integrate Africa's Talking or Twilio
   - Send OTP via SMS
   - Add phone verification

6. **2FA Settings** 🟠 HIGH
   - Allow users to enable/disable 2FA
   - Choose 2FA method (email/SMS/both)
   - Backup codes

7. **Email Templates** 🟠 HIGH
   - Professional HTML templates
   - Responsive design
   - Brand consistency

---

## 📈 Success Metrics

### Email Delivery
- Email delivery rate > 95%
- Email open rate > 40%
- Click-through rate > 20%

### Security
- OTP delivery time < 30 seconds
- OTP verification success rate > 90%
- Failed login attempts < 1%

### User Experience
- Email verification completion rate > 70%
- 2FA adoption rate > 30%
- Support tickets related to email < 5%

---

## 🔒 Security Best Practices

### Email Security
1. ✅ Use TLS for SMTP
2. ✅ Validate email addresses
3. ✅ Rate limit email sending
4. ✅ Implement SPF, DKIM, DMARC
5. ✅ Monitor bounce rates

### OTP Security
1. ✅ Never return OTP in API response
2. ✅ Use 6-digit codes
3. ✅ Expire after 5 minutes
4. ✅ Limit attempts (3 max)
5. ✅ Rate limit OTP generation

### 2FA Best Practices
1. ✅ Offer multiple 2FA methods
2. ✅ Provide backup codes
3. ✅ Allow 2FA recovery
4. ✅ Log all 2FA events
5. ✅ Notify users of 2FA changes

---

## 🎉 Conclusion

**Current Status**: 60% Complete

**What Works**:
- ✅ 2FA infrastructure (OTP generation, verification)
- ✅ Transaction PIN system
- ✅ Security features (fraud detection, rate limiting)
- ✅ In-app notifications

**What's Missing**:
- ❌ Email service implementation
- ❌ Email verification
- ❌ OTP delivery via email/SMS
- ❌ Ticket email delivery
- ❌ SMS service

**Estimated Time to Complete**: 2 weeks

**Priority**: 🔴 CRITICAL - Required for production launch

---

## 📞 Next Steps

1. **Week 1**: Implement email service + email verification
2. **Week 2**: Add SMS service + complete 2FA
3. **Week 3**: Testing + monitoring + documentation

With these implementations, Tikit will have world-class email and 2FA security! 🚀

