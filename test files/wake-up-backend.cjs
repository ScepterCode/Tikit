#!/usr/bin/env node

/**
 * Wake Up Backend Script
 * Wakes up the Render backend and tests the connection
 */

const https = require('https');

const BACKEND_URL = 'https://groovy-czqr.onrender.com';

console.log('🚀 Waking up Render backend...');
console.log('==================================================\n');

async function makeRequest(url, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const req = https.get(url, { timeout }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        resolve({
          statusCode: res.statusCode,
          data: data,
          duration: duration,
          headers: res.headers
        });
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.on('error', (err) => {
      reject(err);
    });
  });
}

async function testEndpoint(endpoint, description) {
  console.log(`🧪 Testing ${description}...`);
  
  try {
    const response = await makeRequest(`${BACKEND_URL}${endpoint}`);
    
    console.log(`✅ ${description} - Status: ${response.statusCode}`);
    console.log(`   Duration: ${response.duration}ms`);
    
    if (response.statusCode === 200) {
      try {
        const jsonData = JSON.parse(response.data);
        console.log(`   Response:`, jsonData);
      } catch (e) {
        console.log(`   Response: ${response.data.substring(0, 100)}...`);
      }
    }
    
    return response.statusCode === 200;
    
  } catch (error) {
    console.log(`❌ ${description} - Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔍 Backend URL:', BACKEND_URL);
  console.log('⏰ This may take up to 30 seconds if the backend is sleeping...\n');
  
  // Test health endpoint
  const healthOk = await testEndpoint('/health', 'Health Check');
  
  if (!healthOk) {
    console.log('\n❌ Backend is not responding. Possible issues:');
    console.log('1. Render app is sleeping (free tier sleeps after 15 min)');
    console.log('2. Render app failed to deploy');
    console.log('3. Network connectivity issues');
    console.log('\n🔧 Solutions:');
    console.log('1. Wait 30-60 seconds for Render to wake up');
    console.log('2. Check Render dashboard for deployment status');
    console.log('3. Redeploy the backend if needed');
    return;
  }
  
  console.log('\n🧪 Testing API endpoints...');
  
  // Test API endpoints
  await testEndpoint('/api/health', 'API Health');
  await testEndpoint('/docs', 'API Documentation');
  
  console.log('\n==================================================');
  console.log('✅ Backend wake-up complete!');
  console.log('🎯 Your frontend should now work correctly');
  console.log('\n📝 Next steps:');
  console.log('1. Refresh your browser');
  console.log('2. Try registering as organizer again');
  console.log('3. Check browser console for debug logs');
}

main().catch(console.error);