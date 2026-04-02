import requests

# Test events endpoint
response = requests.get('http://localhost:8000/api/events')
print(f"Status: {response.status_code}")
print(f"Response: {response.text}")
