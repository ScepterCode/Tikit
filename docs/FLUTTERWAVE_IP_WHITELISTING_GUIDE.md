# Flutterwave IP Whitelisting - Complete Guide

## The Error You're Getting

```
"Transfer failed: Please enable IP Whitelisting to access this service"
```

## What This Means

**This is a SECURITY FEATURE, not a bug!**

Flutterwave requires you to whitelist the IP addresses of servers that make transfer/payout API calls. This prevents unauthorized transfers from your account.

### Why Flutterwave Requires This:

1. **Security**: Only whitelisted IPs can process payouts (transfers from your account)
2. **Fraud Prevention**: Prevents unauthorized access even if API keys are compromised
3. **Compliance**: Required for all transfer/payout operations via API

## How to Fix This

### Step 1: Get Your Server's IP Address

Since you're running locally, you need your public IP address:

**Option A: Check Your Public IP**
```bash
# Visit this URL in your browser:
https://api.ipify.org?format=json

# Or use command line:
curl https://api.ipify.org
```

**Option B: Use PowerShell**
```powershell
(Invoke-WebRequest -Uri "https://api.ipify.org").Content
```

**Option C: Google It**
- Just search "what is my ip" on Google
- It will show your public IP address

### Step 2: Whitelist Your IP on Flutterwave Dashboard

1. **Login to Flutterwave Dashboard**
   - Go to: https://dashboard.flutterwave.com/

2. **Navigate to Settings**
   - Click on **"Settings"** in the left sidebar

3. **Go to Whitelisted IP Addresses**
   - Click on **"Whitelisted IP addresses"**

4. **Add Your IP Address**
   - Click **"Add IP Address"** button
   - Enter your public IP address (e.g., `102.89.23.45`)
   - Select **IPv4** format from dropdown
   - Click **"Add"** or **"Save"**

5. **Verify with OTP**
   - You'll receive an OTP via email or WhatsApp
   - Enter the OTP to complete the setup

6. **Confirm**
   - Your IP should now appear in the whitelist
   - Status should show as "Active"

### Step 3: Test Withdrawal Again

Once your IP is whitelisted:
1. Go back to your app
2. Try the withdrawal again
3. Should work now! ✅

## Important Notes

### For Development (Local Testing)

**Problem**: Your home/office IP might change (dynamic IP)

**Solutions**:

1. **Re-whitelist when IP changes**
   - Check your current IP: `curl https://api.ipify.org`
   - If different, add new IP to whitelist
   - Remove old IP

2. **Use a Static IP** (if available from ISP)
   - Contact your internet provider
   - Request a static IP address
   - Whitelist that permanent IP

3. **Use a VPN with Static IP**
   - Get a VPN service with static IP
   - Connect to VPN
   - Whitelist the VPN's IP

### For Production (Deployment)

When you deploy to a server (Railway, Render, Vercel, etc.):

1. **Get Server's IP Address**
   - Railway: Check deployment logs or settings
   - Render: Check service settings
   - Vercel: Vercel uses dynamic IPs (see note below)
   - AWS/DigitalOcean: Check instance IP

2. **Whitelist Production IP**
   - Add production server IP to Flutterwave
   - Keep development IP separate

3. **Multiple IPs**
   - You can whitelist multiple IPs
   - One for development
   - One for production
   - One for staging (if needed)

### Special Cases

**Vercel/Serverless Platforms**:
- These use dynamic IPs that change frequently
- Not ideal for Flutterwave transfers
- Consider:
  - Using a dedicated backend server (Railway, Render)
  - Using Vercel Edge Functions with static IP proxy
  - Moving transfer logic to a separate service

**Behind NAT/Router**:
- Whitelist your public IP (not local 192.168.x.x)
- Your router's external IP is what Flutterwave sees

**Corporate Network**:
- May need to whitelist company's public IP
- Contact IT department for the IP address

## IP Format Examples

### IPv4 (Most Common)
```
102.89.23.45
197.210.55.132
41.203.67.89
```

### IPv6 (Less Common)
```
2001:0db8:85a3:0000:0000:8a2e:0370:7334
2001:db8:0:0:0:0:0:1
```

## Troubleshooting

### Still Getting Error After Whitelisting?

1. **Verify IP is Correct**
   ```bash
   curl https://api.ipify.org
   ```
   - Compare with whitelisted IP
   - Must match exactly

2. **Check Whitelist Status**
   - Go to Flutterwave Dashboard → Settings → Whitelisted IP addresses
   - Ensure IP shows as "Active"
   - Not "Pending" or "Disabled"

3. **Wait a Few Minutes**
   - Changes may take 1-5 minutes to propagate
   - Try withdrawal again after waiting

4. **Check Multiple IPs**
   - If using VPN, ensure VPN is connected
   - If on mobile hotspot, IP might be different

5. **Remove and Re-add**
   - Remove the IP from whitelist
   - Add it again
   - Verify with OTP

### Error: "Invalid IP Format"

- Ensure no spaces in IP address
- Use dots (.) not commas
- IPv4 format: `xxx.xxx.xxx.xxx`
- Each segment: 0-255

### Can't Receive OTP?

- Check email spam folder
- Check WhatsApp messages
- Ensure email/phone is verified on Flutterwave
- Contact Flutterwave support

## Security Best Practices

1. **Only Whitelist Trusted IPs**
   - Don't whitelist public/shared IPs
   - Only your server IPs

2. **Regular Audits**
   - Review whitelisted IPs monthly
   - Remove unused IPs

3. **Separate Dev and Prod**
   - Different IPs for development and production
   - Easier to manage and more secure

4. **Document Your IPs**
   - Keep a record of which IP is for what
   - Makes troubleshooting easier

5. **Monitor Changes**
   - If your IP changes, update immediately
   - Set up alerts if possible

## Alternative: Use Test Mode First

If you want to test without whitelisting:

1. **Use Test API Keys**
   - Test keys don't require IP whitelisting
   - Can test transfer flow without restrictions

2. **Switch to Live Later**
   - Once testing is complete
   - Get live keys and whitelist IP
   - Deploy to production

## Quick Reference

| Task | Action |
|------|--------|
| **Get Your IP** | Visit https://api.ipify.org |
| **Whitelist IP** | Dashboard → Settings → Whitelisted IP addresses |
| **Add IP** | Click "Add IP Address" → Enter IP → Verify OTP |
| **Check Status** | Dashboard → Settings → Whitelisted IP addresses |
| **Remove IP** | Click "Remove" next to IP in whitelist |

## Summary

**The error is expected behavior** - Flutterwave requires IP whitelisting for security.

**To fix**:
1. Get your public IP: `curl https://api.ipify.org`
2. Login to Flutterwave Dashboard
3. Go to Settings → Whitelisted IP addresses
4. Add your IP and verify with OTP
5. Try withdrawal again

**For production**: Whitelist your production server's IP address.

---

## Need Help?

### Flutterwave Support:
- Email: developers@flutterwavego.com
- Help Center: https://flutterwave.com/us/support
- Dashboard: https://dashboard.flutterwave.com/

### Video Tutorial:
Flutterwave has a YouTube video showing how to whitelist IPs:
- Search "Flutterwave IP whitelisting" on YouTube

---

**Status**: This is a required security feature, not a bug. Once you whitelist your IP, withdrawals will work perfectly! 🔒✅
