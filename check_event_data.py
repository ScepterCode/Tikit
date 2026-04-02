import requests
import json

event_id = "59bf9756-83da-495b-bbef-940f6aa561ed"

# Test the backend endpoint
response = requests.get(f'http://localhost:8000/api/events/{event_id}')
print(f"Status: {response.status_code}")
print(f"\nResponse:")
print(json.dumps(response.json(), indent=2))
