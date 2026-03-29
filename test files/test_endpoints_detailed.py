#!/usr/bin/env python3
"""Detailed endpoint testing"""

import requests
import json

BACKEND_URL = "http://localhost:8000"

def test_endpoint(name, method, url, data=None, headers=None):
    """Test an endpoint and show detailed results"""
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=10)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=10)
        
        print(f"\n{name}:")
        print(f"  URL: {url}")
        print(f"  Status: {response.status_code}")
        print(f"  Response: {response.text[:200]}")
        return response.status_code, response.text
    except Exception as e:
        print(f"\n{name}:")
        print(f"  URL: {url}")
        print(f"  Error: {e}")
        return None, str(e)

print("="*70)
print("DETAILED ENDPOINT TESTING")
print("="*70)

# Test payment methods
test_endpoint("Payment Methods", "GET", f"{BACKEND_URL}/api/payments/methods")

# Test wallet balance
test_endpoint("Wallet Balance", "GET", f"{BACKEND_URL}/api/wallet/balance")

# Test event creation
test_endpoint("Event Creation", "POST", f"{BACKEND_URL}/api/events", {"test": "data"})

# Test events list
test_endpoint("Events List", "GET", f"{BACKEND_URL}/api/events")

# Test wallet endpoints
test_endpoint("Wallet Transactions", "GET", f"{BACKEND_URL}/api/wallet/transactions")
test_endpoint("Wallet Fund", "POST", f"{BACKEND_URL}/api/wallet/fund", {"amount": 1000})
