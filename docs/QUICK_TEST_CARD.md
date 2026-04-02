# 🎯 Quick Test Card - Withdrawal System

## ⚡ 5-Minute Test

### 1. Login
```
URL: http://localhost:3000
Email: sc@gmail.com
Password: password123
```

### 2. Navigate
```
Click: Wallet (in sidebar)
Verify: Balance shows ₦200.00
```

### 3. Withdraw
```
Click: "Withdraw" button
Select: Your bank
Enter: Your account number (10 digits)
Amount: ₦100
PIN: 000000
Click: "Withdraw Now"
```

### 4. Verify
```
✅ Success message appears
✅ Balance updates to ₦100.00
✅ Transaction in history
✅ Money in bank (2-24 hours)
```

---

## 🧪 Quick Validation Tests

| Test | Input | Expected |
|------|-------|----------|
| Below Min | ₦50 | ❌ Error: "Minimum ₦100" |
| Too Much | ₦500 | ❌ Error: "Insufficient balance" |
| Wrong PIN | 999999 | ❌ Error: "Invalid PIN" |
| Valid | ₦100 | ✅ Success |

---

## 📊 Current Status

- **Backend**: ✅ Running (port 8000)
- **Frontend**: ✅ Running (port 3000)
- **Database**: ✅ Connected
- **Balance**: ₦200.00
- **PIN**: 000000

---

## 🆘 Quick Fixes

**Modal won't open?**
→ Hard refresh (Ctrl+Shift+R)

**Banks won't load?**
→ Check backend is running

**Withdrawal fails?**
→ Check PIN is 000000

**IP whitelist error?**
→ Add IP to Flutterwave dashboard

---

## 📁 Documentation

- `WITHDRAWAL_TEST_GUIDE.md` - Full guide
- `WITHDRAWAL_READY_TO_TEST.md` - Features
- `SYSTEM_STATUS_FINAL.md` - Status

---

**Status**: ✅ READY
**Time**: 5 minutes
**Difficulty**: Easy
