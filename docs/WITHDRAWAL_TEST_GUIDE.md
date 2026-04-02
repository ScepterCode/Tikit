# Withdrawal System Test Guide

## System Status

✅ **Backend Running**: http://localhost:8000
✅ **Frontend Running**: http://localhost:3000
✅ **Database**: Supabase connected
✅ **Payment Gateway**: Flutterwave configured
✅ **Current Balance**: ₦200.00 (sc@gmail.com)

## Withdrawal Features Implemented

### 1. Security Features
- ✅ Transaction PIN verification (default: 000000)
- ✅ Balance validation
- ✅ Minimum withdrawal: ₦100
- ✅ Flutterwave balance check before withdrawal

### 2. Bank Integration
- ✅ Get list of Nigerian banks
- ✅ Verify bank account details
- ✅ Real-time transfer via Flutterwave API

### 3. Error Handling
- ✅ Insufficient balance detection
- ✅ Invalid PIN rejection
- ✅ Below minimum amount rejection
- ✅ Flutterwave balance check
- ✅ IP whitelisting detection

### 4. Transaction Management
- ✅ Transaction history recording
- ✅ Balance deduction only after transfer confirmation
- ✅ Webhook for failed transfer refunds

## Manual Testing Steps

### Step 1: Login
1. Go to http://localhost:3000
2. Login with: sc@gmail.com / password123
3. Navigate to Wallet section

### Step 2: Check Balance
- Current balance should show: ₦200.00
- Transaction history should show 2 previous payments

### Step 3: Test Withdrawal Validations

#### Test A: Below Minimum Amount
1. Click "Withdraw"
2. Enter amount: ₦50
3. Enter any bank details
4. Expected: Error "Minimum withdrawal amount is ₦100"

#### Test B: Insufficient Balance
1. Enter amount: ₦500 (more than ₦200 balance)
2. Enter bank details
3. Expected: Error "Insufficient balance. Available: ₦200.00"

#### Test C: Invalid PIN
1. Enter amount: ₦100
2. Enter valid bank details
3. Enter PIN: 999999 (wrong)
4. Expected: Error "Invalid transaction PIN"

### Step 4: Successful Withdrawal Test

**IMPORTANT**: Use a real bank account you own for testing

1. Enter amount: ₦100
2. Select your bank from dropdown
3. Enter your 10-digit account number
4. System will verify account and show account name
5. Enter PIN: 000000 (default)
6. Click "Withdraw"

**Expected Results**:
- ✅ Success message: "₦100.00 successfully sent to [Your Name]"
- ✅ New balance: ₦100.00 (₦200 - ₦100)
- ✅ Transaction appears in history
- ✅ Money arrives in your bank account (2-24 hours)


## API Endpoints for Testing

### 1. Get Balance
```bash
GET /api/wallet/balance
Authorization: Bearer {supabase_jwt_token}
```

### 2. Get Nigerian Banks
```bash
GET /api/wallet/banks
Authorization: Bearer {supabase_jwt_token}
```

### 3. Verify Bank Account
```bash
POST /api/wallet/verify-bank-account
Authorization: Bearer {supabase_jwt_token}
Content-Type: application/json

{
  "account_number": "0123456789",
  "bank_code": "044"
}
```

### 4. Withdraw Money
```bash
POST /api/wallet/withdraw-flutterwave
Authorization: Bearer {supabase_jwt_token}
Content-Type: application/json

{
  "amount": 100,
  "account_number": "0123456789",
  "bank_code": "044",
  "pin": "000000"
}
```

### 5. Get Transaction History
```bash
GET /api/wallet/transactions
Authorization: Bearer {supabase_jwt_token}
```

## Troubleshooting

### Issue: "IP whitelisting required"
**Solution**: 
1. Go to Flutterwave Dashboard → Settings → Whitelisted IP addresses
2. Get your server IP: `GET /api/wallet/my-ip`
3. Add the IP to Flutterwave whitelist

### Issue: "Withdrawal service temporarily unavailable"
**Possible Causes**:
1. Flutterwave balance insufficient
2. Funds in collection balance (not available balance)
3. Network connectivity issues

**Solution**:
- Check Flutterwave dashboard balance
- Settle collection balance to available balance
- Contact Flutterwave support if needed

### Issue: "Invalid bank account details"
**Solution**:
- Verify account number is exactly 10 digits
- Ensure correct bank code is selected
- Try the verify endpoint first to confirm account

## Testing Checklist

- [ ] Backend server running (port 8000)
- [ ] Frontend server running (port 3000)
- [ ] User logged in successfully
- [ ] Balance displays correctly (₦200.00)
- [ ] Transaction history shows previous payments
- [ ] Bank list loads successfully
- [ ] Account verification works
- [ ] Below minimum amount rejected
- [ ] Insufficient balance rejected
- [ ] Invalid PIN rejected
- [ ] Successful withdrawal completes
- [ ] Balance updates after withdrawal
- [ ] Transaction recorded in history

## Next Steps After Testing

1. **If all tests pass**: System is ready for production
2. **If IP whitelisting needed**: Add server IP to Flutterwave
3. **If balance issues**: Top up Flutterwave account
4. **If account verification fails**: Check Flutterwave API credentials

## Support

For issues or questions:
- Check backend logs for detailed error messages
- Review Flutterwave dashboard for transfer status
- Verify Supabase database for transaction records
