#!/usr/bin/env node

/**
 * Monitor Deployment Script
 * Monitors the Render deployment and tests when the real backend is ready
 */

const https = require('https');

const BACKEND_URL = 'https://groovy-czqr.onrender.com';

console.log('🚀 Monitoring Backend Deployment...');
console.log('==================================================\n');

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: 10000
    };
    
    const req = https.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data,
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
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function checkBackendVersion() {
  try {
    const response = await makeRequest(`${BACKEND_URL}/health`);
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.data);
      return {
        isUp: true,
        version: data.version,
        message: data.message,
        services: data.services || {}
      };
    }
    
    return { isUp: false, error: `HTTP ${response.statusCode}` };
    
  } catch (error) {
    return { isUp: false, error: error.message };
  }
}

async function testRegistrationEndpoint() {
  try {
    const sampleUser = {
      phone_number: '+2348012345678',
      password: 'testpass123',
      first_name: 'Test',
      last_name: 'Organizer',
      state: 'Lagos',
      role: 'organizer'
    };
    
    const response = await makeRequest(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      body: sampleUser
    });
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.data);
      
      // Check if it's the mock response (simple_main.py)
      if (data.data?.user?.id === 'test-user-id') {
        return { isMock: true, data };
      }
      
      // Check if it's the real response (main.py)
      return { isMock: false, data };
    }
    
    return { error: `HTTP ${response.statusCode}`, data: response.data };
    
  } catch (error) {
    return { error: error.message };
  }
}

async function monitorDeployment() {
  let attempts = 0;
  const maxAttempts = 30; // 5 minutes with 10-second intervals
  
  console.log('⏰ Waiting for deployment to complete...');
  console.log('This may take 2-5 minutes for Render to build and deploy.\n');
  
  while (attempts < maxAttempts) {
    attempts++;
    
    console.log(`🔍 Check ${attempts}/${maxAttempts}:`);
    
    // Check if backend is up
    const healthCheck = await checkBackendVersion();
    
    if (!healthCheck.isUp) {
      console.log(`   ❌ Backend down: ${healthCheck.error}`);
    } else {
      console.log(`   ✅ Backend up: ${healthCheck.message}`);
      console.log(`   📊 Services: Supabase=${healthCheck.services.supabase || 'unknown'}`);
      
      // Test registration endpoint
      const regTest = await testRegistrationEndpoint();
      
      if (regTest.error) {
        console.log(`   ❌ Registration test failed: ${regTest.error}`);
      } else if (regTest.isMock) {
        console.log(`   ⚠️  Still using mock backend (simple_main.py)`);
        console.log(`   🔄 Deployment in progress...`);
      } else {
        console.log(`   ✅ Real backend deployed! (main.py)`);
        console.log(`   🎯 Registration endpoint working correctly`);
        
        console.log('\n==================================================');
        console.log('🎉 DEPLOYMENT COMPLETE!');
        console.log('✅ Backend is now using the real authentication system');
        console.log('🎯 Role routing should now work correctly');
        console.log('\n📝 Next Steps:');
        console.log('1. Clear your browser cache/localStorage');
        console.log('2. Go to your frontend application');
        console.log('3. Register as an organizer');
        console.log('4. You should now land on the organizer dashboard!');
        return;
      }
    }
    
    if (attempts < maxAttempts) {
      console.log(`   ⏳ Waiting 10 seconds before next check...\n`);
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  console.log('\n==================================================');
  console.log('⏰ Monitoring timeout reached');
  console.log('The deployment may still be in progress.');
  console.log('Please check your Render dashboard for deployment status.');
}

monitorDeployment().catch(console.error);