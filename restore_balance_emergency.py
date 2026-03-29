"""
Emergency Balance Restoration
Restores balance that was incorrectly deducted
"""
import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv('apps/backend-fastapi/.env')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print("=" * 80)
print("EMERGENCY BALANCE RESTORATION")
print("=" * 80)

# User ID for sc@gmail.com
user_id = 'b9d3197e-2db2-4c8c-a943-5c9685c6d8df'
user_email = 'sc@gmail.com'

# Get current balance
result = supabase.table('users').select('wallet_balance').eq('id', user_id).execute()

if result.data:
    current_balance = float(result.data[0]['wallet_balance'])
    print(f"\nUser: {user_email}")
    print(f"Current Balance: ₦{current_balance:,.2f}")
    
    # Ask for amount to restore
    print("\n" + "-" * 80)
    print("How much was incorrectly deducted?")
    print("(Press Enter to restore ₦100, or type a different amount)")
    amount_input = input("Amount to restore (₦): ").strip()
    
    if amount_input == "":
        amount_to_restore = 100.0
    else:
        try:
            amount_to_restore = float(amount_input)
        except:
            print("Invalid amount. Using ₦100")
            amount_to_restore = 100.0
    
    new_balance = current_balance + amount_to_restore
    
    print(f"\nRestoring ₦{amount_to_restore:,.2f}...")
    print(f"New balance will be: ₦{new_balance:,.2f}")
    
    confirm = input("\nProceed? (yes/no): ").strip().lower()
    
    if confirm == 'yes' or confirm == 'y':
        # Update balance
        update_result = supabase.table('users').update({
            'wallet_balance': new_balance
        }).eq('id', user_id).execute()
        
        print(f"\n✅ Balance restored successfully!")
        print(f"   Previous: ₦{current_balance:,.2f}")
        print(f"   Restored: +₦{amount_to_restore:,.2f}")
        print(f"   New: ₦{new_balance:,.2f}")
    else:
        print("\n❌ Restoration cancelled")
else:
    print(f"\n❌ User not found: {user_email}")

print("\n" + "=" * 80)
