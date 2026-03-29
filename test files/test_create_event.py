"""
Test creating an event with Supabase JWT token
"""
import requests
import json

# Test with organizer@grooovy.netlify.app
# First, let's try to get a token by logging in through Supabase

# For now, let's just test if the endpoint is accessible
url = "http://localhost:8000/api/events"

# Test data
event_data = {
    "title": "Test Event",
    "description": "This is a test event",
    "venue": "Test Venue",
    "date": "2025-03-20",
    "time": "18:00",
    "ticketPrice": 5000,
    "totalTickets": 100,
    "category": "conference"
}

# Try without auth first to see the error
print("Testing without authentication...")
response = requests.post(url, json=event_data)
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")
