import requests

# Test the wallet balance endpoint
url = "http://localhost:8000/api/wallet/balance"

print(f"Testing: {url}")
print("=" * 60)

try:
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")

# Also test without /api prefix
url2 = "http://localhost:8000/wallet/balance"
print(f"\nTesting: {url2}")
print("=" * 60)

try:
    response = requests.get(url2)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")

# Test the docs to see what routes are available
print("\nChecking available routes...")
print("=" * 60)
try:
    response = requests.get("http://localhost:8000/openapi.json")
    if response.status_code == 200:
        data = response.json()
        paths = data.get("paths", {})
        wallet_paths = [p for p in paths.keys() if "wallet" in p.lower()]
        print(f"Found {len(wallet_paths)} wallet-related paths:")
        for path in wallet_paths:
            print(f"  - {path}")
    else:
        print(f"Could not get OpenAPI spec: {response.status_code}")
except Exception as e:
    print(f"Error: {e}")
