"""
Test the /api/wallet/fund endpoint to see what it returns
"""
import requests
import json

print("=" * 80)
print("TESTING /api/wallet/fund ENDPOINT")
print("=" * 80)

# Test with mock token (organizer)
url = "http://localhost:8000/api/wallet/fund"
headers = {
    "Authorization": "Bearer eyJhbGciOiJFUzI1NiIsImt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4IjoiYWJjZGVmIiwieSI6Inh5ejEyMyJ9.eyJzdWIiOiJ0ZXN0LW9yZ2FuaXplci0wMDEiLCJlbWFpbCI6Im9yZ2FuaXplckBncm9vb292eS5uZXRsaWZ5LmFwcCIsInJvbGUiOiJvcmdhbml6ZXIiLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6OTk5OTk5OTk5OX0.fake_signature",
    "Content-Type": "application/json"
}
data = {
    "amount": 1000,
    "description": "Test add funds",
    "payment_method": "card"
}

print(f"\n📤 REQUEST:")
print(f"   URL: {url}")
print(f"   Headers: Authorization: Bearer [token]")
print(f"   Body: {json.dumps(data, indent=2)}")

try:
    response = requests.post(url, headers=headers, json=data)
    
    print(f"\n📥 RESPONSE:")
    print(f"   Status Code: {response.status_code}")
    print(f"   Headers: {dict(response.headers)}")
    
    try:
        response_json = response.json()
        print(f"   Body: {json.dumps(response_json, indent=2)}")
        
        # Check if response has required fields
        print(f"\n✅ VALIDATION:")
        if response_json.get("success"):
            print(f"   ✅ success: {response_json.get('success')}")
        else:
            print(f"   ❌ success: {response_json.get('success')}")
            
        if response_json.get("tx_ref"):
            print(f"   ✅ tx_ref: {response_json.get('tx_ref')}")
        else:
            print(f"   ❌ tx_ref: MISSING")
            
        if response_json.get("amount"):
            print(f"   ✅ amount: {response_json.get('amount')}")
        else:
            print(f"   ❌ amount: MISSING")
            
        if response_json.get("user_email"):
            print(f"   ✅ user_email: {response_json.get('user_email')}")
        else:
            print(f"   ❌ user_email: MISSING")
            
        if response_json.get("user_name"):
            print(f"   ✅ user_name: {response_json.get('user_name')}")
        else:
            print(f"   ❌ user_name: MISSING")
            
    except Exception as e:
        print(f"   ❌ Failed to parse JSON: {e}")
        print(f"   Raw response: {response.text}")
        
except Exception as e:
    print(f"\n❌ REQUEST FAILED: {e}")

print("\n" + "=" * 80)
print("DIAGNOSIS:")
print("=" * 80)
print("\nIf the endpoint returns all required fields (success, tx_ref, amount, user_email, user_name),")
print("then the issue is in the frontend JavaScript code.")
print("\nIf any fields are missing, the frontend is waiting for data that never comes.")
