"""
Check Flutterwave Account Balance
"""

import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv('apps/backend-fastapi/.env')

def check_flutterwave_balance():
    """Check Flutterwave account balance"""
    
    # Get Flutterwave credentials
    secret_key = (
        os.getenv('FLUTTERWAVE_LIVE_SECRET_KEY') or
        os.getenv('FLUTTERWAVE_SECRET_KEY') or 
        os.getenv('FLUTTERWAVE_CLIENT_SECRET_KEY')
    )
    
    if not secret_key:
        print("❌ Flutterwave secret key not found in environment")
        return
    
    print(f"✅ Flutterwave secret key found (length: {len(secret_key)})")
    print(f"   Key starts with: {secret_key[:10]}...")
    
    # Check balance
    try:
        headers = {
            'Authorization': f'Bearer {secret_key}',
            'Content-Type': 'application/json'
        }
        
        print("\n🔍 Checking Flutterwave balance...")
        response = requests.get(
            'https://api.flutterwave.com/v3/balances',
            headers=headers,
            timeout=30
        )
        
        print(f"   Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Response: {data}")
            
            if data.get('status') == 'success':
                balances = data.get('data', [])
                
                print(f"\n✅ Flutterwave API accessible")
                print(f"   Found {len(balances)} currency balances:")
                
                for balance in balances:
                    currency = balance.get('currency')
                    available = float(balance.get('available_balance', 0))
                    ledger = float(balance.get('ledger_balance', 0))
                    
                    print(f"\n   {currency}:")
                    print(f"     Available: {available:,.2f}")
                    print(f"     Ledger: {ledger:,.2f}")
                    
                    if currency == 'NGN':
                        if available < 100:
                            print(f"\n⚠️  WARNING: NGN available balance is low!")
                            print(f"   Available: ₦{available:,.2f}")
                            print(f"   Ledger: ₦{ledger:,.2f}")
                            
                            if ledger > available:
                                print(f"\n💡 SOLUTION:")
                                print(f"   You have ₦{ledger:,.2f} in collection balance")
                                print(f"   Go to Flutterwave Dashboard → Settlements")
                                print(f"   Click 'Settle Now' to move funds to available balance")
                        else:
                            print(f"\n✅ NGN balance is sufficient for withdrawals")
            else:
                print(f"❌ API returned error: {data}")
        else:
            print(f"❌ API request failed: {response.status_code}")
            print(f"   Response: {response.text}")
            
            if response.status_code == 401:
                print("\n⚠️  Authentication failed - check your secret key")
            elif response.status_code == 403:
                print("\n⚠️  Access forbidden - possible IP whitelisting issue")
                
    except Exception as e:
        print(f"❌ Error checking balance: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("="*80)
    print("  FLUTTERWAVE BALANCE CHECK")
    print("="*80 + "\n")
    
    check_flutterwave_balance()
    
    print("\n" + "="*80)
