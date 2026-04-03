#!/usr/bin/env python3
"""
Test Supabase Edge Function for Email Processing
This script tests the send-emails Edge Function
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client
import requests

# Load environment variables
load_dotenv('apps/backend-fastapi/.env')

def test_edge_function():
    """Test the send-emails Edge Function"""
    
    print("=" * 60)
    print("🧪 SUPABASE EDGE FUNCTION TEST")
    print("=" * 60)
    print()
    
    # Get Supabase credentials
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not supabase_key:
        print("❌ Error: Supabase credentials not found in .env file")
        print()
        print("Required variables:")
        print("  - SUPABASE_URL")
        print("  - SUPABASE_SERVICE_ROLE_KEY")
        return False
    
    print("✅ Supabase credentials loaded")
    print()
    
    # Create Supabase client
    try:
        supabase: Client = create_client(supabase_url, supabase_key)
        print("✅ Supabase client created")
    except Exception as e:
        print(f"❌ Failed to create Supabase client: {e}")
        return False
    
    print()
    
    # Check if email_queue table exists
    try:
        result = supabase.table('email_queue').select('id').limit(1).execute()
        print("✅ email_queue table exists")
    except Exception as e:
        print(f"❌ email_queue table not found: {e}")
        print()
        print("Please run EMAIL_VERIFICATION_MIGRATION.sql first")
        return False
    
    print()
    
    # Check for pending emails
    try:
        pending = supabase.table('email_queue').select('*').eq('status', 'pending').execute()
        pending_count = len(pending.data) if pending.data else 0
        print(f"📬 Pending emails in queue: {pending_count}")
    except Exception as e:
        print(f"⚠️ Could not check pending emails: {e}")
        pending_count = 0
    
    print()
    
    # Test Edge Function
    print("📤 Testing Edge Function...")
    print()
    
    function_url = f"{supabase_url}/functions/v1/send-emails"
    headers = {
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(function_url, headers=headers, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Edge Function executed successfully!")
            print()
            print("📊 Results:")
            print(f"  - Total emails processed: {result.get('summary', {}).get('total', 0)}")
            print(f"  - Successfully sent: {result.get('summary', {}).get('sent', 0)}")
            print(f"  - Failed: {result.get('summary', {}).get('failed', 0)}")
            print()
            
            if result.get('results'):
                print("📧 Email Details:")
                for email in result['results']:
                    status_icon = "✅" if email['status'] == 'sent' else "❌"
                    print(f"  {status_icon} {email['to']}: {email['status']}")
                    if email.get('error'):
                        print(f"     Error: {email['error']}")
            
            return True
            
        elif response.status_code == 404:
            print("❌ Edge Function not found!")
            print()
            print("The send-emails function is not deployed.")
            print()
            print("Deploy it with:")
            print("  supabase functions deploy send-emails")
            print()
            print("Or use the deployment script:")
            print("  ./deploy_email_function.sh")
            return False
            
        else:
            print(f"❌ Edge Function returned error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("⏱️ Request timed out (function may still be processing)")
        print()
        print("Check function logs:")
        print("  supabase functions logs send-emails")
        return False
        
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - could not reach Edge Function")
        print()
        print("Possible causes:")
        print("  1. Function not deployed")
        print("  2. Incorrect SUPABASE_URL")
        print("  3. Network issues")
        return False
        
    except Exception as e:
        print(f"❌ Error testing Edge Function: {e}")
        return False

def main():
    """Main function"""
    success = test_edge_function()
    
    print()
    print("=" * 60)
    
    if success:
        print("✅ TEST PASSED")
        print()
        print("Next steps:")
        print("1. Set up cron job to run function every 5 minutes")
        print("2. Queue test emails: python test_supabase_email.py")
        print("3. Monitor logs: supabase functions logs send-emails --tail")
    else:
        print("❌ TEST FAILED")
        print()
        print("Troubleshooting:")
        print("1. Ensure database migration is complete")
        print("2. Deploy Edge Function: supabase functions deploy send-emails")
        print("3. Check Supabase credentials in .env file")
        print("4. View detailed guide: SUPABASE_EMAIL_DEPLOYMENT.md")
    
    print("=" * 60)
    print()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
