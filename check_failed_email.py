"""
Check why the last email failed
"""
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('apps/backend-fastapi/.env')

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')
)

print("\n" + "="*60)
print("🔍 CHECKING FAILED EMAIL")
print("="*60)

# Get the most recent failed email
result = supabase.table('email_queue').select('*').eq('status', 'failed').order('created_at', desc=True).limit(1).execute()

if result.data:
    email = result.data[0]
    print(f"\n❌ Most Recent Failed Email:")
    print(f"   To: {email['to_email']}")
    print(f"   Type: {email['email_type']}")
    print(f"   Subject: {email['subject']}")
    print(f"   Attempts: {email['attempts']}")
    print(f"   Created: {email['created_at']}")
    print(f"   Error: {email.get('error_message', 'No error message')}")
else:
    print("\n✅ No failed emails found")

# Check all pending
pending = supabase.table('email_queue').select('*').eq('status', 'pending').execute()
print(f"\n📬 Pending emails: {len(pending.data)}")

for email in pending.data:
    print(f"   • {email['to_email']} - {email['email_type']}")
