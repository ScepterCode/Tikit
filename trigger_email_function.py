#!/usr/bin/env python3
"""
Trigger the send-emails Edge Function to process queued emails
"""

import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv('apps/backend-fastapi/.env')

def trigger_function():
    """Trigger the Edge Function to send emails"""
    
    print("=" * 60)
    print("🚀 TRIGGERING EMAIL EDGE FUNCTION")
    print("=" * 60)
    print()
    
    # Get credentials
    supabase_url = os.getenv('SUPABASE_URL')
    service_key = os.getenv('SUPABASE_SERVICE_KEY')
    
    if not supabase_url or not service_key:
        print("❌ Error: Supabase credentials not found")
        return False
    
    # Build function URL
    function_url = f"{supabase_url}/functions/v1/send-emails"
    
    print(f"📤 Calling: {function_url}")
    print()
    
    # Call the function
    headers = {
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json"
    }
    
    try:
        print("⏳ Processing emails...")
        response = requests.post(function_url, headers=headers, timeout=30)
        
        print()
        print("=" * 60)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ SUCCESS!")
            print()
            print("📊 Results:")
            print(f"  Total emails processed: {result.get('summary', {}).get('total', 0)}")
            print(f"  Successfully sent: {result.get('summary', {}).get('sent', 0)}")
            print(f"  Failed: {result.get('summary', {}).get('failed', 0)}")
            print()
            
            if result.get('results'):
                print("📧 Email Details:")
                for email in result['results']:
                    status_icon = "✅" if email['status'] == 'sent' else "❌"
                    print(f"  {status_icon} {email['to']}: {email['status']}")
                    if email.get('error'):
                        print(f"     Error: {email['error']}")
            
            print()
            print("=" * 60)
            print()
            print("🎉 Check your inbox at scepterboss@gmail.com!")
            print()
            return True
            
        else:
            print(f"❌ Error: HTTP {response.status_code}")
            print(f"Response: {response.text}")
            print()
            return False
            
    except requests.exceptions.Timeout:
        print("⏱️ Request timed out")
        print("The function may still be processing emails.")
        print("Check the Supabase Dashboard logs.")
        return False
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = trigger_function()
    exit(0 if success else 1)
