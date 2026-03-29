#!/usr/bin/env python3
"""
Instructions for disabling email confirmation in Supabase
This allows test users to login without confirming their email
"""

print("""
DISABLE EMAIL CONFIRMATION IN SUPABASE
======================================

To allow test users to login without email confirmation:

1. Go to Supabase Dashboard:
   https://app.supabase.com

2. Select your project:
   hwwzbsppzwcyvambeade

3. Navigate to Authentication settings:
   - Click "Authentication" in left sidebar
   - Click "Providers"
   - Click "Email"

4. Find the setting "Confirm email"
   - Toggle it OFF (disable it)
   - This allows users to login without confirming their email

5. Click "Save"

6. Test users can now login immediately:
   - Email: admin@grooovy.netlify.app
   - Password: password123

IMPORTANT NOTES:
================
- This is for TESTING ONLY
- In production, keep email confirmation enabled
- After testing, re-enable email confirmation
- Users will need to confirm their email before accessing the app

ALTERNATIVE: Manually Confirm Emails
=====================================
If you prefer to keep email confirmation enabled:

1. Go to Supabase Dashboard
2. Navigate to Authentication > Users
3. For each test user:
   - Click the three-dot menu (...)
   - Select "Confirm email"
4. Users can now login

TEST USERS:
===========
admin@grooovy.netlify.app / password123
organizer@grooovy.netlify.app / password123
attendee@grooovy.netlify.app / password123
""")
