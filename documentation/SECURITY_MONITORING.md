# Security Monitoring Setup

This document explains the security monitoring, breach detection, account locking, and security alert features implemented in the Tikit backend.

## Overview

The security monitoring system provides comprehensive protection against:
- Brute force login attempts
- Suspicious payment activity
- Account compromise
- Unauthorized access attempts

## Features

### 1. Breach Detection

The system automatically detects security breaches through:

#### Failed Login Tracking
- Monitors failed login attempts per phone number
- Tracks IP address and user agent for forensics
- Implements sliding window (15 minutes)
- Threshold: 5 failed attempts

#### Failed Payment Tracking
- Monitors failed payment attempts per user
- Tracks payment amount and method
- Implements sliding window (1 hour)
- Threshold: 5 failed payments

#### Suspicious Activity Detection
- Analyzes patterns across multiple security events
- Identifies anomalous behavior
- Provides detailed reasons for flagging

### 2. Account Locking

When a breach is detected, the system automatically locks the affected account:

#### Lock Triggers
- 5+ failed login attempts within 15 minutes
- 5+ failed payment attempts within 1 hour
- Manual lock by administrators
- Detected suspicious activity patterns

#### Lock Duration
- Default: 30 minutes
- Configurable per lock reason
- Automatic unlock after expiration
- Manual unlock by administrators

#### Lock Storage
- Stored in Redis for fast access
- Includes lock reason and expiration time
- Checked on every authentication attempt

### 3. Security Alerts

Users are notified immediately when security events occur:

#### SMS Notifications
- Sent within 5 minutes of breach detection
- Includes lock reason and duration
- Provides support contact information
- Only sent in production (not in test mode)

#### Alert Content
```
SECURITY ALERT: Your Tikit account has been locked due to [reason]. 
If this wasn't you, please contact support immediately. 
Your account will be automatically unlocked in 30 minutes.
```

## Implementation Details

### Security Service Functions

#### `trackFailedLogin(phoneNumber, ipAddress?, userAgent?)`
Tracks failed login attempts and determines if account should be locked.

**Returns:**
```typescript
{
  shouldLock: boolean;
  attemptsRemaining: number;
}
```

**Example:**
```typescript
const result = await trackFailedLogin(
  '+2348012345678',
  '192.168.1.1',
  'Mozilla/5.0...'
);

if (result.shouldLock) {
  // Lock the account
  await lockAccount(userId, 'Multiple failed login attempts');
}
```

#### `lockAccount(userId, reason, duration?)`
Locks a user account for a specified duration.

**Parameters:**
- `userId`: User ID to lock
- `reason`: Reason for locking (shown in SMS)
- `duration`: Lock duration in seconds (default: 1800 = 30 minutes)

**Returns:**
```typescript
{
  success: boolean;
  message: string;
}
```

**Example:**
```typescript
const result = await lockAccount(
  'user-123',
  'Multiple failed login attempts',
  1800
);
```

#### `isAccountLocked(userId)`
Checks if an account is currently locked.

**Returns:**
```typescript
{
  locked: boolean;
  reason?: string;
  expiresAt?: number;
}
```

**Example:**
```typescript
const lockStatus = await isAccountLocked('user-123');

if (lockStatus.locked) {
  console.log(`Account locked: ${lockStatus.reason}`);
  console.log(`Expires at: ${new Date(lockStatus.expiresAt)}`);
}
```

#### `unlockAccount(userId)`
Manually unlocks a user account (admin only).

**Returns:**
```typescript
{
  success: boolean;
  message: string;
}
```

#### `trackFailedPayment(userId, amount, method)`
Tracks failed payment attempts and detects suspicious patterns.

**Returns:**
```typescript
{
  suspicious: boolean;
  failedCount: number;
}
```

**Example:**
```typescript
const result = await trackFailedPayment(
  'user-123',
  5000,
  'card'
);

if (result.suspicious) {
  // Take action on suspicious activity
  await detectAndHandleBreach(
    'user-123',
    'failed_payment',
    { failedCount: result.failedCount }
  );
}
```

#### `detectAndHandleBreach(userId, breachType, metadata?)`
Detects security breaches and automatically locks accounts.

**Breach Types:**
- `failed_login`: Multiple failed login attempts
- `failed_payment`: Multiple failed payment attempts
- `suspicious_activity`: Other suspicious patterns

**Returns:**
```typescript
{
  breachDetected: boolean;
  accountLocked: boolean;
  message: string;
}
```

#### `logSecurityEvent(event)`
Logs security events for audit and analysis.

**Event Types:**
- `failed_login`
- `failed_payment`
- `suspicious_activity`
- `account_locked`

**Example:**
```typescript
await logSecurityEvent({
  userId: 'user-123',
  eventType: 'failed_login',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  timestamp: Date.now(),
  metadata: { attemptNumber: 3 }
});
```

#### `getSecurityEvents(userId, limit?)`
Retrieves security events for a user.

**Returns:** Array of security events (most recent first)

**Example:**
```typescript
const events = await getSecurityEvents('user-123', 50);

events.forEach(event => {
  console.log(`${event.eventType} at ${new Date(event.timestamp)}`);
});
```

#### `checkSuspiciousActivity(userId)`
Analyzes user activity for suspicious patterns.

**Returns:**
```typescript
{
  suspicious: boolean;
  reasons: string[];
}
```

**Example:**
```typescript
const result = await checkSuspiciousActivity('user-123');

if (result.suspicious) {
  console.log('Suspicious activity detected:');
  result.reasons.forEach(reason => console.log(`- ${reason}`));
}
```

### Integration with Authentication

The security monitoring is integrated into the authentication flow:

```typescript
// In auth.service.ts
export const loginUser = async (phoneNumber, ipAddress?, userAgent?) => {
  const user = await prisma.user.findUnique({ where: { phoneNumber } });

  if (!user) {
    // Track failed login
    const { shouldLock, attemptsRemaining } = await trackFailedLogin(
      phoneNumber,
      ipAddress,
      userAgent
    );
    
    if (shouldLock) {
      return {
        success: false,
        message: 'Too many failed login attempts. Please try again in 30 minutes.',
      };
    }
    
    return {
      success: false,
      message: `User not found. ${attemptsRemaining} attempts remaining.`,
    };
  }

  // Check if account is locked
  const lockStatus = await isAccountLocked(user.id);
  if (lockStatus.locked) {
    const expiresIn = Math.ceil((lockStatus.expiresAt - Date.now()) / 60000);
    return {
      success: false,
      message: `Account locked: ${lockStatus.reason}. Try again in ${expiresIn} minutes.`,
    };
  }

  // Clear failed attempts on successful login
  await clearFailedLoginAttempts(phoneNumber);
  
  // Generate tokens and return success
  // ...
};
```

### Integration with Payment Processing

Security monitoring is also integrated into payment processing:

```typescript
// In payment.service.ts
export const processPayment = async (userId, amount, method) => {
  try {
    // Process payment
    const result = await paymentGateway.charge(amount, method);
    
    if (!result.success) {
      // Track failed payment
      const { suspicious } = await trackFailedPayment(userId, amount, method);
      
      if (suspicious) {
        // Handle suspicious activity
        await detectAndHandleBreach(userId, 'failed_payment');
      }
      
      return { success: false, message: 'Payment failed' };
    }
    
    return { success: true, transactionId: result.id };
  } catch (error) {
    // Track and handle errors
    await trackFailedPayment(userId, amount, method);
    throw error;
  }
};
```

## API Endpoints

### Check Account Lock Status
```
GET /api/security/lock-status
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "locked": true,
    "reason": "Multiple failed login attempts",
    "expiresAt": 1640000000000
  }
}
```

### Unlock Account (Admin Only)
```
POST /api/security/unlock/:userId
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Account unlocked successfully"
}
```

### Get Security Events
```
GET /api/security/events?limit=50
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "userId": "user-123",
      "eventType": "failed_login",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "timestamp": 1640000000000,
      "metadata": { "attemptNumber": 3 }
    }
  ]
}
```

### Check Suspicious Activity
```
GET /api/security/suspicious-activity
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "suspicious": true,
    "reasons": [
      "5 failed payment attempts in the last hour",
      "Recent suspicious activity detected"
    ]
  }
}
```

## Configuration

### Environment Variables

```bash
# SMS Configuration (for security alerts)
AFRICASTALKING_API_KEY=your_api_key
AFRICASTALKING_USERNAME=your_username
AFRICASTALKING_SENDER_ID=Tikit

# Redis Configuration (for storing locks and events)
REDIS_URL=redis://localhost:6379
```

### Thresholds (Configurable in security.service.ts)

```typescript
const FAILED_LOGIN_THRESHOLD = 5;        // Lock after 5 failed attempts
const FAILED_LOGIN_WINDOW = 900;         // 15 minutes in seconds
const ACCOUNT_LOCK_DURATION = 1800;      // 30 minutes in seconds
const SUSPICIOUS_PAYMENT_THRESHOLD = 5;  // 5 failed payments
const SUSPICIOUS_PAYMENT_WINDOW = 3600;  // 1 hour in seconds
```

## Monitoring and Alerts

### Redis Keys

The system uses the following Redis keys:

- `security:failed_login:{phoneNumber}` - Failed login counter
- `security:account_lock:{userId}` - Account lock data
- `security:failed_payment:{userId}` - Failed payment list
- `security:events:{userId}` - Security event log

### Key Expiration

- Failed login counters: 15 minutes
- Account locks: 30 minutes (default)
- Failed payment lists: 1 hour
- Security event logs: 24 hours

### Monitoring Recommendations

1. **Set up alerts** for high volumes of security events
2. **Monitor Redis memory** usage for security keys
3. **Track lock rates** to identify attack patterns
4. **Review security events** regularly for anomalies
5. **Audit unlock operations** by administrators

## Testing

The security monitoring system includes comprehensive tests:

```bash
# Run security service tests
npm test security.service.test.ts
```

**Test Coverage:**
- Failed login tracking
- Account locking and unlocking
- Failed payment tracking
- Breach detection
- Security event logging
- SMS alert sending
- Suspicious activity detection

## Security Best Practices

1. **Rate Limiting**: Combine with rate limiting middleware for additional protection
2. **IP Blocking**: Consider blocking IPs with excessive failed attempts
3. **Monitoring**: Set up real-time monitoring and alerting
4. **Audit Logs**: Regularly review security events
5. **User Education**: Inform users about security features
6. **Incident Response**: Have a plan for handling security incidents
7. **Regular Updates**: Keep thresholds and durations tuned to your needs

## Troubleshooting

### Account Locked Unexpectedly

**Problem**: User reports account is locked without reason

**Solution**:
1. Check security events: `GET /api/security/events`
2. Review failed login attempts in Redis
3. Verify IP address and user agent
4. Manually unlock if legitimate: `POST /api/security/unlock/:userId`

### SMS Alerts Not Sending

**Problem**: Users not receiving security alert SMS

**Solution**:
1. Verify Africa's Talking credentials in `.env`
2. Check SMS balance in Africa's Talking dashboard
3. Verify phone number format (+234...)
4. Check logs for SMS sending errors
5. Ensure `NODE_ENV` is not set to 'test'

### High False Positive Rate

**Problem**: Too many legitimate users getting locked

**Solution**:
1. Increase thresholds (e.g., 10 attempts instead of 5)
2. Extend time windows (e.g., 30 minutes instead of 15)
3. Reduce lock duration (e.g., 15 minutes instead of 30)
4. Review and adjust detection logic

### Redis Memory Issues

**Problem**: Redis running out of memory

**Solution**:
1. Verify key expiration is working
2. Reduce event log retention (24 hours → 12 hours)
3. Implement key cleanup job
4. Increase Redis memory allocation

## Production Deployment

### Checklist

- [ ] Configure Africa's Talking credentials
- [ ] Set up Redis with persistence
- [ ] Configure monitoring and alerting
- [ ] Test SMS delivery in production
- [ ] Set appropriate thresholds
- [ ] Document incident response procedures
- [ ] Train support team on unlock procedures
- [ ] Set up log aggregation
- [ ] Configure backup and recovery
- [ ] Test failover scenarios

### Monitoring Metrics

Track these metrics in production:

- Failed login attempts per hour
- Account locks per day
- Failed payment attempts per hour
- SMS delivery success rate
- Average lock duration
- Manual unlock frequency
- Security event volume

## References

- [OWASP Account Lockout](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#account-lockout)
- [OWASP Credential Stuffing Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Credential_Stuffing_Prevention_Cheat_Sheet.html)
- [Africa's Talking SMS API](https://developers.africastalking.com/docs/sms/overview)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
