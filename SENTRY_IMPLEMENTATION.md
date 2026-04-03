# 🔍 Sentry Error Tracking Implementation

## Overview
Implement Sentry for error tracking and monitoring across backend and frontend.

**Time**: 2 hours  
**Priority**: 🔴 CRITICAL  
**Status**: Ready to implement

---

## 🎯 What Sentry Provides

1. **Real-time Error Tracking** - Know when errors happen
2. **Stack Traces** - See exactly where errors occur
3. **User Context** - Know which users are affected
4. **Performance Monitoring** - Track slow endpoints
5. **Release Tracking** - Compare error rates across versions
6. **Alerts** - Get notified of critical errors

---

## 📋 Implementation Steps

### Step 1: Create Sentry Account (5 min)

1. Go to: https://sentry.io/signup/
2. Create free account
3. Create new project:
   - **Backend**: Python/FastAPI
   - **Frontend**: React
4. Copy DSN keys for both projects

---

### Step 2: Backend Setup (30 min)

#### Install Sentry SDK

```bash
cd apps/backend-fastapi
pip install sentry-sdk[fastapi]
```

#### Update requirements.txt

Add to `apps/backend-fastapi/requirements.txt`:
```
sentry-sdk[fastapi]==1.40.0
```

#### Configure Sentry in main.py

Add to `apps/backend-fastapi/main.py`:

```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

# Initialize Sentry
if config.SENTRY_DSN:
    sentry_sdk.init(
        dsn=config.SENTRY_DSN,
        integrations=[
            FastApiIntegration(),
            SqlalchemyIntegration(),
        ],
        traces_sample_rate=1.0 if config.ENVIRONMENT == "development" else 0.1,
        profiles_sample_rate=1.0 if config.ENVIRONMENT == "development" else 0.1,
        environment=config.ENVIRONMENT,
        release=f"tikit-backend@{config.VERSION}",
        # Send user context
        send_default_pii=False,  # Don't send PII by default
    )
    logger.info("✅ Sentry initialized for error tracking")
else:
    logger.warning("⚠️ Sentry DSN not configured - error tracking disabled")
```

#### Add User Context to Errors

Update `apps/backend-fastapi/middleware/auth.py`:

```python
import sentry_sdk

async def get_current_user(token: str = Depends(oauth2_scheme)):
    # ... existing code ...
    
    # Add user context to Sentry
    if user:
        sentry_sdk.set_user({
            "id": user["id"],
            "email": user.get("email"),
            "role": user.get("role")
        })
    
    return user
```

#### Add Environment Variables

Add to `apps/backend-fastapi/.env`:
```env
# Sentry Configuration
SENTRY_DSN=https://your-backend-dsn@sentry.io/project-id
VERSION=1.0.0
```

Add to `apps/backend-fastapi/config.py`:
```python
# Sentry Configuration
SENTRY_DSN: str = os.getenv("SENTRY_DSN", "")
VERSION: str = os.getenv("VERSION", "1.0.0")
```

---

### Step 3: Frontend Setup (30 min)

#### Install Sentry SDK

```bash
cd apps/frontend
npm install @sentry/react
```

#### Configure Sentry

Create `apps/frontend/src/lib/sentry.ts`:

```typescript
import * as Sentry from "@sentry/react";

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    console.warn("⚠️ Sentry DSN not configured - error tracking disabled");
    return;
  }

  Sentry.init({
    dsn,
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // Performance Monitoring
    tracesSampleRate: import.meta.env.MODE === "development" ? 1.0 : 0.1,
    
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    environment: import.meta.env.MODE,
    release: `tikit-frontend@${import.meta.env.VITE_VERSION || "1.0.0"}`,
    
    // Don't send PII
    beforeSend(event) {
      // Remove sensitive data
      if (event.request) {
        delete event.request.cookies;
      }
      return event;
    },
  });

  console.log("✅ Sentry initialized for error tracking");
}
```

#### Initialize in App

Update `apps/frontend/src/main.tsx`:

```typescript
import { initSentry } from './lib/sentry';

// Initialize Sentry before React
initSentry();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

#### Add Error Boundary

Update `apps/frontend/src/App.tsx`:

```typescript
import * as Sentry from "@sentry/react";

function App() {
  return (
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <BrowserRouter>
        {/* ... existing code ... */}
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  );
}

// Error fallback component
function ErrorFallback() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h1>😔 Something went wrong</h1>
      <p>We've been notified and are working on a fix.</p>
      <button 
        onClick={() => window.location.href = '/'}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          background: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        Go to Homepage
      </button>
    </div>
  );
}
```

#### Add User Context

Update `apps/frontend/src/contexts/SupabaseAuthContext.tsx`:

```typescript
import * as Sentry from "@sentry/react";

// In the auth context, after user login:
useEffect(() => {
  if (user) {
    // Set user context in Sentry
    Sentry.setUser({
      id: user.id,
      email: user.email,
      role: user.role
    });
  } else {
    // Clear user context on logout
    Sentry.setUser(null);
  }
}, [user]);
```

#### Add Environment Variables

Add to `apps/frontend/.env`:
```env
# Sentry Configuration
VITE_SENTRY_DSN=https://your-frontend-dsn@sentry.io/project-id
VITE_VERSION=1.0.0
```

---

### Step 4: Test Error Tracking (15 min)

#### Backend Test

Add test endpoint in `apps/backend-fastapi/main.py`:

```python
@app.get("/test-sentry")
async def test_sentry():
    """Test Sentry error tracking"""
    try:
        # Intentional error
        result = 1 / 0
    except Exception as e:
        sentry_sdk.capture_exception(e)
        raise HTTPException(status_code=500, detail="Test error for Sentry")
```

Test:
```bash
curl http://localhost:8000/test-sentry
```

Check Sentry dashboard for error.

#### Frontend Test

Add test button in development:

```typescript
// In any component (for testing only)
<button onClick={() => {
  throw new Error("Test error for Sentry");
}}>
  Test Sentry
</button>
```

Click button and check Sentry dashboard.

---

### Step 5: Configure Alerts (15 min)

1. Go to Sentry dashboard
2. Click "Alerts" > "Create Alert"
3. Set up alerts for:
   - **Critical Errors**: Any error in production
   - **High Error Rate**: > 10 errors/minute
   - **New Issues**: First occurrence of new error
   - **Regression**: Error that was marked as resolved

4. Configure notification channels:
   - Email
   - Slack (optional)
   - Discord (optional)

---

### Step 6: Add Custom Error Tracking (15 min)

#### Track Email Failures

Update `apps/backend-fastapi/services/email_service.py`:

```python
import sentry_sdk

async def send_email(self, to_email: str, subject: str, html_body: str):
    try:
        # ... existing code ...
        
        if not result.data:
            # Track email failure in Sentry
            sentry_sdk.capture_message(
                f"Email failed to queue: {to_email}",
                level="error",
                extras={
                    "to_email": to_email,
                    "subject": subject,
                    "error": "Failed to insert into email_queue"
                }
            )
            
        return result
    except Exception as e:
        # Capture exception with context
        sentry_sdk.capture_exception(
            e,
            extras={
                "to_email": to_email,
                "subject": subject
            }
        )
        raise
```

#### Track Payment Failures

Update payment services to track failures:

```python
import sentry_sdk

# In payment service
try:
    # ... payment processing ...
except PaymentError as e:
    sentry_sdk.capture_exception(
        e,
        extras={
            "user_id": user_id,
            "amount": amount,
            "payment_method": payment_method
        }
    )
    raise
```

---

## 📊 Monitoring Dashboard

### Key Metrics to Watch

1. **Error Rate** - Errors per minute
2. **Affected Users** - Number of users experiencing errors
3. **Most Common Errors** - Top 10 errors
4. **Slowest Endpoints** - Performance bottlenecks
5. **Error Trends** - Are errors increasing?

### Sentry Dashboard Views

1. **Issues** - All errors grouped by type
2. **Performance** - Slow transactions
3. **Releases** - Compare versions
4. **Discover** - Custom queries
5. **Alerts** - Notification rules

---

## 🔒 Security & Privacy

### Don't Send PII

Configure Sentry to NOT send:
- Passwords
- Credit card numbers
- Personal emails
- Phone numbers
- API keys

### Scrub Sensitive Data

```python
# Backend
sentry_sdk.init(
    before_send=scrub_sensitive_data,
    send_default_pii=False
)

def scrub_sensitive_data(event, hint):
    # Remove sensitive fields
    if 'request' in event:
        if 'data' in event['request']:
            data = event['request']['data']
            if isinstance(data, dict):
                data.pop('password', None)
                data.pop('credit_card', None)
    return event
```

---

## 🧪 Testing Checklist

- [ ] Backend Sentry initialized
- [ ] Frontend Sentry initialized
- [ ] Test error captured in backend
- [ ] Test error captured in frontend
- [ ] User context attached to errors
- [ ] Email failures tracked
- [ ] Payment failures tracked
- [ ] Alerts configured
- [ ] Sensitive data scrubbed
- [ ] Error boundary working

---

## 📈 Success Metrics

### After Implementation

- ✅ All errors tracked in real-time
- ✅ Notified within 1 minute of critical errors
- ✅ Stack traces available for debugging
- ✅ User context helps identify affected users
- ✅ Performance bottlenecks identified

### Production Targets

- Error rate < 0.1% of requests
- Mean time to detection (MTTD) < 1 minute
- Mean time to resolution (MTTR) < 1 hour for critical
- 99.9% of errors have stack traces

---

## 💰 Cost

**Sentry Pricing:**
- Free tier: 5,000 errors/month
- Team plan: $26/month for 50,000 errors
- Business plan: $80/month for 150,000 errors

**Recommendation**: Start with free tier, upgrade as needed

---

## 🚀 Next Steps After Sentry

1. **Security Hardening** - 2FA, rate limiting
2. **Critical Tests** - Core flow testing
3. **Performance Optimization** - Caching, CDN

---

## 📞 Support

**Documentation:**
- Sentry Docs: https://docs.sentry.io/
- FastAPI Integration: https://docs.sentry.io/platforms/python/guides/fastapi/
- React Integration: https://docs.sentry.io/platforms/javascript/guides/react/

**Files Created:**
- `apps/frontend/src/lib/sentry.ts`
- Updated: `main.py`, `App.tsx`, `config.py`

---

**Ready to implement?** This will take about 2 hours and provide immediate value for monitoring your email system and catching production errors!
