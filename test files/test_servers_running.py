#!/usr/bin/env python3
"""
Quick test to verify both servers are running
"""

import asyncio
import aiohttp
import json

async def test_servers():
    """Test both frontend and backend servers"""
    print("🔄 Testing server connectivity...")
    
    async with aiohttp.ClientSession() as session:
        # Test backend server
        try:
            async with session.get("http://localhost:8000/health") as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ Backend server: {data.get('message', 'Running')}")
                else:
                    print(f"❌ Backend server returned status {response.status}")
        except Exception as e:
            print(f"❌ Backend server connection failed: {e}")
        
        # Test frontend server (just check if it responds)
        try:
            async with session.get("http://localhost:3000") as response:
                if response.status == 200:
                    print("✅ Frontend server: Running and accessible")
                else:
                    print(f"❌ Frontend server returned status {response.status}")
        except Exception as e:
            print(f"❌ Frontend server connection failed: {e}")
    
    print("\n🎉 Server restart complete!")
    print("📱 Frontend: http://localhost:3000")
    print("🔧 Backend API: http://localhost:8000")
    print("📚 API Docs: http://localhost:8000/docs")

if __name__ == "__main__":
    asyncio.run(test_servers())