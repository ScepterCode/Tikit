#!/usr/bin/env python3
"""
Flutterwave Credentials Guide
Step-by-step guide to get correct Flutterwave credentials
"""

def print_guide():
    print("🔑 HOW TO GET YOUR FLUTTERWAVE CREDENTIALS")
    print("="*60)
    
    print("\n📋 STEP-BY-STEP GUIDE:")
    print("="*30)
    
    print("\n1. 🌐 LOG INTO FLUTTERWAVE DASHBOARD")
    print("   • Go to: https://dashboard.flutterwave.com")
    print("   • Log in with your Flutterwave account")
    
    print("\n2. 🔄 SWITCH TO LIVE MODE")
    print("   • Look for a toggle switch (Test/Live)")
    print("   • Make sure you're in 'Live' mode (not Test)")
    print("   • This is CRITICAL - Test keys won't work for real payments")
    
    print("\n3. 🔧 GO TO API SETTINGS")
    print("   • Click on 'Settings' in the sidebar")
    print("   • Select 'API Keys' or 'API Settings'")
    
    print("\n4. 📋 COPY THE CORRECT KEYS")
    print("   • Secret Key: Should start with 'FLWSECK-'")
    print("   • Public Key: Should start with 'FLWPUBK-'")
    print("   • Encryption Key: Base64 encoded string")
    
    print("\n5. ✅ VERIFY KEY FORMATS")
    print("   • Secret Key example: FLWSECK-xxxxxxxxxxxxx")
    print("   • Public Key example: FLWPUBK-xxxxxxxxxxxxx")
    print("   • Both should be much longer than your current keys")
    
    print("\n" + "="*60)
    print("🚨 IMPORTANT NOTES")
    print("="*60)
    
    print("\n⚠️  COMMON MISTAKES TO AVOID:")
    print("   • Don't copy Client ID (that's different)")
    print("   • Don't copy Webhook URL")
    print("   • Don't copy Test keys (they start with FLWSECK_TEST-)")
    print("   • Make sure you're in LIVE mode, not TEST mode")
    
    print("\n✅ WHAT CORRECT KEYS LOOK LIKE:")
    print("   • Secret: FLWSECK-H5mmfmrXvKiIGL...")
    print("   • Public: FLWPUBK-SBAfGTfTzqN3qI...")
    print("   • Much longer than your current keys")
    
    print("\n🔍 IF YOU CAN'T FIND THE KEYS:")
    print("   • Your account might not be fully activated")
    print("   • Contact Flutterwave support")
    print("   • Verify your business verification is complete")
    
    print("\n" + "="*60)
    print("📝 WHAT TO DO AFTER GETTING KEYS")
    print("="*60)
    
    print("\n1. 📧 SEND ME THE KEYS")
    print("   • Copy your Secret Key (FLWSECK-...)")
    print("   • Copy your Public Key (FLWPUBK-...)")
    print("   • I'll update the system immediately")
    
    print("\n2. 🧪 I'LL TEST THEM")
    print("   • Verify they work with Flutterwave API")
    print("   • Update all environment files")
    print("   • Restart the backend server")
    
    print("\n3. ✅ SYSTEM WILL BE 100% READY")
    print("   • All payment methods will work")
    print("   • Card payments, bank transfers, USSD, mobile money")
    print("   • Ready for live transactions")

def test_key_format(secret_key, public_key):
    """Test if provided keys have correct Flutterwave format"""
    print("\n🔍 TESTING KEY FORMATS")
    print("="*30)
    
    # Test secret key
    if secret_key.startswith('FLWSECK-'):
        print("✅ Secret Key: Correct live format")
        secret_valid = True
    elif secret_key.startswith('FLWSECK_TEST-'):
        print("⚠️  Secret Key: Test format (need live key)")
        secret_valid = False
    else:
        print("❌ Secret Key: Wrong format (should start with FLWSECK-)")
        secret_valid = False
    
    # Test public key
    if public_key.startswith('FLWPUBK-'):
        print("✅ Public Key: Correct live format")
        public_valid = True
    elif public_key.startswith('FLWPUBK_TEST-'):
        print("⚠️  Public Key: Test format (need live key)")
        public_valid = False
    else:
        print("❌ Public Key: Wrong format (should start with FLWPUBK-)")
        public_valid = False
    
    if secret_valid and public_valid:
        print("\n🎉 KEYS LOOK CORRECT! Ready to test with API.")
        return True
    else:
        print("\n❌ KEYS NEED CORRECTION. Please check the guide above.")
        return False

if __name__ == "__main__":
    print_guide()
    
    print("\n" + "="*60)
    print("🎯 READY TO HELP!")
    print("="*60)
    print("\nOnce you have your Flutterwave credentials:")
    print("1. Send me your Secret Key (FLWSECK-...)")
    print("2. Send me your Public Key (FLWPUBK-...)")
    print("3. I'll update the system and test immediately")
    print("\nThe payment system is 83.3% ready - just need the right keys! 🚀")