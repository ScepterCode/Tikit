import requests

# Test with trailing slash
response = requests.get('http://localhost:8000/api/events/')
print(f"Status: {response.status_code}")
print(f"Response: {response.text[:500]}")
