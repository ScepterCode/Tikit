"""
Get Your Public IP Address
Run this to find out what IP to whitelist on Flutterwave
"""
import requests

print("=" * 80)
print("GETTING YOUR PUBLIC IP ADDRESS")
print("=" * 80)

try:
    # Method 1: ipify
    print("\n📍 Checking your public IP address...")
    response = requests.get('https://api.ipify.org?format=json', timeout=10)
    data = response.json()
    ip_address = data['ip']
    
    print(f"\n✅ Your Public IP Address: {ip_address}")
    print("\n" + "=" * 80)
    print("NEXT STEPS:")
    print("=" * 80)
    print("\n1. Copy this IP address: " + ip_address)
    print("\n2. Go to: https://dashboard.flutterwave.com/")
    print("\n3. Click: Settings → Whitelisted IP addresses")
    print("\n4. Click: 'Add IP Address'")
    print("\n5. Paste: " + ip_address)
    print("\n6. Select: IPv4 format")
    print("\n7. Verify: Enter OTP sent to your email/WhatsApp")
    print("\n8. Done: Try withdrawal again!")
    
    print("\n" + "=" * 80)
    print("IMPORTANT NOTES:")
    print("=" * 80)
    print("\n• This is your PUBLIC IP (what Flutterwave sees)")
    print("• If you're on dynamic IP, it may change")
    print("• You'll need to re-whitelist if IP changes")
    print("• For production, whitelist your server's IP")
    
    # Try to get additional info
    try:
        print("\n" + "=" * 80)
        print("ADDITIONAL IP INFORMATION:")
        print("=" * 80)
        
        response2 = requests.get('https://ipapi.co/json/', timeout=10)
        info = response2.json()
        
        print(f"\n• IP: {info.get('ip', 'N/A')}")
        print(f"• City: {info.get('city', 'N/A')}")
        print(f"• Region: {info.get('region', 'N/A')}")
        print(f"• Country: {info.get('country_name', 'N/A')}")
        print(f"• ISP: {info.get('org', 'N/A')}")
        print(f"• Type: {info.get('version', 'N/A')}")
        
    except Exception as e:
        print(f"\n⚠️  Could not get additional info: {e}")
    
    print("\n" + "=" * 80)
    
except Exception as e:
    print(f"\n❌ Error getting IP address: {e}")
    print("\nAlternative methods:")
    print("1. Visit: https://api.ipify.org in your browser")
    print("2. Google: 'what is my ip'")
    print("3. PowerShell: (Invoke-WebRequest -Uri 'https://api.ipify.org').Content")
