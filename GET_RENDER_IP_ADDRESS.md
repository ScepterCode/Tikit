# How to Get Your Render Backend IP Address

## Important: Render Uses Dynamic IPs

**Render does NOT provide static IP addresses** on free/starter plans. The IP address can change when:
- Your service restarts
- Render performs maintenance
- Your service is redeployed

## Solutions for Render + Flutterwave

### Option 1: Use Render's Outbound IP Addresses (Recommended)

Render provides a **range of outbound IP addresses** that your service might use. You need to whitelist ALL of them.

#### Step 1: Get Render's IP Ranges

Render's outbound IPs are documented here:
- **US Region (Oregon)**: Check Render's documentation
- **EU Region**: Different IP ranges

#### Step 2: Contact Render Support

1. Go to your Render dashboard
2. Click on your backend service
3. Go to "Support" or use the chat
4. Ask: "What are the outbound IP addresses for my service?"
5. They'll provide a list of IPs

#### Step 3: Whitelist All IPs

Once you get the list (usually 3-10 IPs):
1. Go to Flutterwave Dashboard
2. Settings → Whitelisted IP addresses
3. Add each IP one by one
4. Verify each with OTP

### Option 2: Add an IP Detection Endpoint (Quick Check)

Add this endpoint to your backend to see what IP Flutterwave sees:

**File: `apps/backend-fastapi/routers/wallet.py`**

```python
@router.get("/my-ip")
async def get_my_ip(request: Request):
    """Get the IP address that external services see"""
    import requests
    try:
        # Get IP from external service
        response = requests.get('https://api.ipify.org?format=json', timeout=10)
        data = response.json()
        
        return {
            "success": True,
            "ip": data['ip'],
            "note": "This is the IP that Flutterwave sees"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
```

Then call this endpoint from your deployed Render service:
```
https://your-backend.onrender.com/api/wallet/my-ip
```

### Option 3: Check Render Logs During Deployment

1. Go to Render Dashboard
2. Select your backend service
3. Go to "Logs" tab
4. Look for any IP-related information during startup

### Option 4: Use Render's Static IP Add-on (Paid)

Render offers **Static Outbound IPs** as a paid add-on:

**Pricing**: ~$5-10/month per service

**How to Enable**:
1. Go to your Render service
2. Click "Settings"
3. Look for "Static Outbound IP" add-on
4. Enable it
5. You'll get a dedicated static IP
6. Whitelist that single IP on Flutterwave

**This is the BEST solution for production!**

### Option 5: Use a Proxy Service

Use a service like **QuotaGuard** or **Fixie** that provides static IPs:

1. Sign up for QuotaGuard/Fixie
2. Get your static IP
3. Configure Render to route requests through proxy
4. Whitelist the proxy IP on Flutterwave

## Recommended Approach for Your Setup

### For Development (Now):
```
✅ Whitelist your local IP: 102.89.68.25
✅ Test withdrawals locally
✅ Everything works on your machine
```

### For Production (Render):

**Best Option**: Get Render's Static IP Add-on ($5-10/month)
- Single static IP
- Easy to manage
- Reliable
- Worth the cost for production

**Alternative**: Whitelist Render's IP Range
- Free but more complex
- Need to whitelist multiple IPs
- IPs might still change

## Step-by-Step: Get Render's Current IP

### Method 1: Deploy IP Detection Endpoint

1. **Add endpoint to your backend** (see code above)

2. **Deploy to Render**
   ```bash
   git add .
   git commit -m "Add IP detection endpoint"
   git push
   ```

3. **Wait for deployment** (Render auto-deploys)

4. **Call the endpoint**
   ```
   https://your-backend.onrender.com/api/wallet/my-ip
   ```

5. **Get the IP** from response

6. **Whitelist on Flutterwave**

### Method 2: Use curl from Render Shell

If Render provides shell access:

1. Go to Render Dashboard
2. Select your service
3. Look for "Shell" or "Console"
4. Run: `curl https://api.ipify.org`
5. Get the IP
6. Whitelist on Flutterwave

### Method 3: Check Render Documentation

1. Go to: https://render.com/docs
2. Search for "outbound IP addresses"
3. Find your region's IP ranges
4. Whitelist all IPs in the range

## About Netlify (Frontend)

**Good news**: You DON'T need Netlify's IP!

Why? Because:
- Frontend (Netlify) calls backend (Render)
- Backend (Render) calls Flutterwave
- Flutterwave only sees Render's IP
- Netlify's IP is irrelevant

So you only need to whitelist **Render's IP**, not Netlify's.

## Summary

### What You Need to Whitelist:

1. **Development**: `102.89.68.25` (your local IP) ✅
2. **Production**: Render backend IP (need to get this)

### How to Get Render IP:

**Option A** (Recommended): Buy Render's Static IP add-on ($5-10/month)
- Single IP
- Never changes
- Easy to manage

**Option B** (Free): Get Render's IP range from support
- Multiple IPs to whitelist
- Might change
- More complex

**Option C** (Quick): Deploy IP detection endpoint
- See what IP Render uses
- Whitelist that IP
- May need to update if it changes

### Next Steps:

1. For now: Whitelist your local IP (`102.89.68.25`) to test
2. For production: Get Render's static IP add-on
3. Whitelist Render's IP on Flutterwave
4. Deploy and test

## Contact Information

**Render Support**:
- Dashboard: https://dashboard.render.com/
- Docs: https://render.com/docs
- Support: support@render.com

**Flutterwave Support**:
- Dashboard: https://dashboard.flutterwave.com/
- Support: developers@flutterwavego.com

---

**Recommendation**: For production, invest in Render's Static IP add-on. It's worth the $5-10/month for reliability and ease of management! 🚀
