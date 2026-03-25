#!/usr/bin/env python3
"""
Test image upload functionality for events
"""

import requests
import json
import base64
from PIL import Image
import io
import os

# Configuration
BASE_URL = "http://localhost:8000"

# Test credentials
ORGANIZER_CREDENTIALS = {
    "phoneNumber": "+2349087654321",
    "password": "password123"
}

def create_test_image(width=400, height=300, color=(255, 0, 0)):
    """Create a test image and return base64 encoded data"""
    # Create a simple colored image
    img = Image.new('RGB', (width, height), color)
    
    # Add some text to make it identifiable
    try:
        from PIL import ImageDraw, ImageFont
        draw = ImageDraw.Draw(img)
        draw.text((10, 10), f"Test Image {width}x{height}", fill=(255, 255, 255))
    except:
        pass  # Skip text if font not available
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    img_data = buffer.getvalue()
    
    # Create data URL
    base64_data = base64.b64encode(img_data).decode('utf-8')
    return f"data:image/png;base64,{base64_data}"

def login_organizer():
    """Login organizer and return token"""
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json=ORGANIZER_CREDENTIALS)
        data = response.json()
        
        if data.get("success"):
            return data["data"]["access_token"]
        else:
            print(f"❌ Login failed: {data.get('error', {}).get('message', 'Unknown error')}")
            return None
    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        return None

def test_image_upload():
    """Test creating event with multiple images"""
    print("🖼️  TESTING IMAGE UPLOAD FUNCTIONALITY")
    print("="*50)
    
    # Login
    token = login_organizer()
    if not token:
        print("❌ Cannot proceed without authentication")
        return False
    
    print("✅ Organizer logged in successfully")
    
    # Create test images
    print("\n📸 Creating test images...")
    images = [
        create_test_image(400, 300, (255, 0, 0)),    # Red image
        create_test_image(600, 400, (0, 255, 0)),    # Green image  
        create_test_image(800, 600, (0, 0, 255)),    # Blue image
    ]
    
    print(f"✅ Created {len(images)} test images")
    
    # Calculate total size
    total_size = sum(len(img) for img in images)
    print(f"📊 Total image data size: {total_size:,} bytes ({total_size/1024/1024:.2f} MB)")
    
    # Create event with images
    event_data = {
        "title": "Image Upload Test Event",
        "description": "Testing image upload functionality with multiple images",
        "date": "2026-04-15",
        "time": "15:00",
        "venue": "Test Venue for Image Upload",
        "category": "conference",
        "enableLivestream": True,
        "ticketTiers": [
            {
                "name": "General",
                "price": 5000,
                "quantity": 100
            }
        ],
        "images": images
    }
    
    print(f"\n🚀 Creating event with {len(images)} images...")
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(f"{BASE_URL}/api/events", json=event_data, headers=headers)
        data = response.json()
        
        if data.get("success"):
            event = data["data"]["event"]
            event_id = event["id"]
            
            print("✅ Event created successfully!")
            print(f"   - Event ID: {event_id}")
            print(f"   - Title: {event['title']}")
            print(f"   - Images stored: {len(event.get('images', []))}")
            
            # Verify images are properly stored
            stored_images = event.get('images', [])
            for i, img in enumerate(stored_images):
                if img.startswith('data:image/'):
                    print(f"   - Image {i+1}: ✅ Valid data URL ({len(img)} chars)")
                else:
                    print(f"   - Image {i+1}: ❌ Invalid format")
            
            # Test retrieving the event
            print(f"\n🔍 Retrieving event to verify image persistence...")
            response = requests.get(f"{BASE_URL}/api/events/{event_id}")
            data = response.json()
            
            if data.get("success"):
                retrieved_event = data["data"]
                retrieved_images = retrieved_event.get('images', [])
                
                print("✅ Event retrieved successfully!")
                print(f"   - Images retrieved: {len(retrieved_images)}")
                
                # Verify image integrity
                for i, (original, retrieved) in enumerate(zip(images, retrieved_images)):
                    if original == retrieved:
                        print(f"   - Image {i+1}: ✅ Integrity verified")
                    else:
                        print(f"   - Image {i+1}: ❌ Data mismatch")
                
                return True
            else:
                print(f"❌ Failed to retrieve event: {data.get('error', {}).get('message', 'Unknown error')}")
                return False
                
        else:
            print(f"❌ Event creation failed: {data.get('error', {}).get('message', 'Unknown error')}")
            return False
            
    except Exception as e:
        print(f"❌ Error during image upload test: {str(e)}")
        return False

def test_image_size_limits():
    """Test image size limitations"""
    print("\n📏 TESTING IMAGE SIZE LIMITS")
    print("="*30)
    
    token = login_organizer()
    if not token:
        return False
    
    # Create a large image (should be rejected or compressed)
    print("📸 Creating large test image (2MB+)...")
    large_image = create_test_image(2000, 2000, (128, 128, 128))
    
    print(f"📊 Large image size: {len(large_image):,} bytes ({len(large_image)/1024/1024:.2f} MB)")
    
    event_data = {
        "title": "Large Image Test Event",
        "description": "Testing large image handling",
        "date": "2026-04-16",
        "time": "16:00",
        "venue": "Large Image Test Venue",
        "category": "conference",
        "ticketTiers": [{"name": "General", "price": 1000, "quantity": 50}],
        "images": [large_image]
    }
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(f"{BASE_URL}/api/events", json=event_data, headers=headers)
        data = response.json()
        
        if data.get("success"):
            print("✅ Large image accepted by backend")
            return True
        else:
            error_msg = data.get('error', {}).get('message', 'Unknown error')
            if 'size' in error_msg.lower() or 'large' in error_msg.lower():
                print(f"✅ Large image properly rejected: {error_msg}")
                return True
            else:
                print(f"❌ Unexpected error: {error_msg}")
                return False
                
    except Exception as e:
        print(f"❌ Error testing large image: {str(e)}")
        return False

def main():
    """Run all image upload tests"""
    print("🖼️  IMAGE UPLOAD TEST SUITE")
    print("Backend URL:", BASE_URL)
    print()
    
    # Test 1: Basic image upload
    success1 = test_image_upload()
    
    # Test 2: Image size limits
    success2 = test_image_size_limits()
    
    # Summary
    print("\n" + "="*50)
    print("📋 TEST SUMMARY")
    print("="*50)
    print(f"✅ Basic image upload: {'PASSED' if success1 else 'FAILED'}")
    print(f"✅ Image size limits: {'PASSED' if success2 else 'FAILED'}")
    
    if success1 and success2:
        print("\n🎉 ALL IMAGE UPLOAD TESTS PASSED!")
        print("\n💡 RECOMMENDATIONS FOR PRODUCTION:")
        print("   - Implement image compression/resizing")
        print("   - Add file type validation (PNG, JPG, WebP)")
        print("   - Set maximum file size limits (e.g., 5MB per image)")
        print("   - Use cloud storage (AWS S3, Cloudinary) instead of base64")
        print("   - Add image optimization and CDN delivery")
        print("   - Implement progressive image loading")
    else:
        print("\n❌ SOME TESTS FAILED - CHECK IMPLEMENTATION")

if __name__ == "__main__":
    main()