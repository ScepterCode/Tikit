"""
Check Flutterwave Dashboard for Recent Transfers
"""
import os
import requests
from dotenv import load_dotenv
from datetime import datetime, timedelta

# Load environment variables
load_dotenv('apps/backend-fastapi/.env')

FLUTTERWAVE_SECRET_KEY = (
    os.getenv('FLUTTERWAVE_LIVE_SECRET_KEY') or
    os.getenv('FLUTTERWAVE_SECRET_KEY') or 
    os.getenv('FLUTTERWAVE_CLIENT_SECRET_KEY')
)

print("=" * 80)
print("CHECKING FLUTTERWAVE DASHBOARD FOR RECENT TRANSFERS")
print("=" * 80)

try:
    headers = {
        'Authorization': f'Bearer {FLUTTERWAVE_SECRET_KEY}',
        'Content-Type': 'application/json'
    }
    
    # Get recent transfers
    print("\nFetching recent transfers from Flutterwave...")
    response = requests.get(
        'https://api.flutterwave.com/v3/transfers',
        headers=headers,
        timeout=30
    )
    
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        
        if data.get('status') == 'success':
            transfers = data.get('data', [])
            
            print(f"\n✅ Found {len(transfers)} recent transfers:")
            print("-" * 80)
            
            if not transfers:
                print("No transfers found in your Flutterwave account")
                print("\nPossible reasons:")
                print("1. This is a test/sandbox account with no real transfers")
                print("2. Transfers were made on a different account")
                print("3. Using wrong API key")
            else:
                for i, transfer in enumerate(transfers[:10], 1):  # Show last 10
                    print(f"\nTransfer #{i}:")
                    print(f"   ID: {transfer.get('id')}")
                    print(f"   Reference: {transfer.get('reference')}")
                    print(f"   Amount: ₦{transfer.get('amount', 0):,.2f}")
                    print(f"   Fee: ₦{transfer.get('fee', 0):,.2f}")
                    print(f"   Status: {transfer.get('status')}")
                    print(f"   Account: {transfer.get('account_number')} ({transfer.get('bank_name')})")
                    print(f"   Recipient: {transfer.get('full_name')}")
                    print(f"   Created: {transfer.get('created_at')}")
                    print(f"   Message: {transfer.get('complete_message', 'N/A')}")
                    
                    # Check if this is the failed withdrawal
                    if transfer.get('status') in ['NEW', 'FAILED']:
                        print(f"   ⚠️  THIS TRANSFER WAS NOT COMPLETED!")
        else:
            print(f"❌ API Error: {data.get('message')}")
    else:
        print(f"❌ HTTP Error {response.status_code}: {response.text}")
        
    # Check account balance
    print("\n" + "=" * 80)
    print("CHECKING FLUTTERWAVE ACCOUNT BALANCE")
    print("=" * 80)
    
    response = requests.get(
        'https://api.flutterwave.com/v3/balances',
        headers=headers,
        timeout=30
    )
    
    if response.status_code == 200:
        data = response.json()
        if data.get('status') == 'success':
            balances = data.get('data', [])
            print(f"\nAccount Balances:")
            for balance in balances:
                currency = balance.get('currency')
                available = balance.get('available_balance', 0)
                ledger = balance.get('ledger_balance', 0)
                print(f"   {currency}: Available: {available:,.2f} | Ledger: {ledger:,.2f}")
                
                if currency == 'NGN' and available < 100:
                    print(f"   ⚠️  INSUFFICIENT BALANCE FOR TRANSFERS!")
                    print(f"   You need to fund your Flutterwave account to process withdrawals")
        else:
            print(f"❌ Could not fetch balance: {data.get('message')}")
    else:
        print(f"❌ HTTP Error: {response.text}")
        
except Exception as e:
    print(f"❌ Exception: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)
print("""
If you see transfers with status 'NEW' or 'FAILED' above:
- These transfers were queued but never processed
- Money was NOT actually sent
- But your app deducted the balance anyway (BUG!)

If you see 'INSUFFICIENT BALANCE' warning:
- You need to fund your Flutterwave account
- Transfers require money in your Flutterwave wallet
- Go to Flutterwave Dashboard → Fund Account

If you see 'No transfers found':
- Either no withdrawals were attempted
- Or using wrong API key (test vs live)
- Or transfers are on a different account
""")

print("\n" + "=" * 80)
