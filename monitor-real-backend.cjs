#!/usr/bin/env node

/**
 * Monitor Real Backend Deployment
 * Watches for when the real backend (main.py) is deployed instead of mock (simple_main.py)
 */

const https = require('https');

const BACKEND_URL = 'https://groovy-czqr.onrender.com';

console.log('🔍 Monitoring Real Backend Deployment...');
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

async function checkBackendType() {
  try {
    // Test registration endpoint to see if it's mock or real
    const timestamp = Date.now();
    const testUser = {
      phone_number: `+234801234${timestamp.toString().slice(-4)}`,
      password: 'testpass123',
      first_name: 'Test',
      last_name: 'User',
      state: 'Lagos',
      role: 'organizer'
    };
    
    const response = await makeRequest(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      body: testUser
    });
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.data);
      
      if (data.data?.user?.id === 'test-user-id') {
        return { type: 'mock', data };
      } else if (data.data?.user?.id && data.data.user.id !== 'test-user-id') {
        return { type: 'real', data };
      } else if (data.success === false && data.error?.code === 'MISSING_ROLE') {
        return { type: 'real', data, validationWorking: true };
      }
    } else if (response.statusCode === 400) {
      const data = JSON.parse(response.data);
      if (data.error?.code === 'MISSING_ROLE' || data.error?.code === 'USER_EXISTS') {
        return { type: 'real', data, validationWorking: true };
      }
    }
    
    return { type: 'unknown', statusCode: response.statusCode, data: response.data };
    
  } catch (error) {
    return { type: 'error', error: error.message };
  }
}

async function monitorDeployment() {
  let attempts = 0;
  const maxAttempts = 40; // 10 minutes with 15-second intervals
  
  console.log('⏰ Monitoring backend deployment...');
  console.log('Looking for switch from mock backend to real backend\n');
  
  while (attempts < maxAttempts) {
    attempts++;
    
    console.log(`🔍 Check ${attempts}/${maxAttempts}:`);
    
    const result = await checkBackendType();
    
    if (result.type === 'mock') {
      console.log('   ⚠️  Still using mock backend (simple_main.py)');
      console.log('   🔄 Deployment in progress...');
    } else if (result.type === 'real') {
      console.log('   ✅ Real backend deployed! (main.py)');
      
      if (result.validationWorking) {
        console.log('   ✅ Role validation working correctly');
      } else {
        console.log('   📊 Registration endpoint responding');
      }
      
      console.log('\n==================================================');
      console.log('🎉 REAL BACKEND IS NOW LIVE!');
      console.log('✅ The comprehensive role fixes are now active');
      console.log('\n🧪 Running final test...');
      
      // Run a quick test
      const { execSync } = require('child_process');
      try {
        execSync('node test-role-registration-complete.cjs', { stdio: 'inherit' });
      } catch (e) {
        console.log('Test completed (check results above)');
      }
      
      console.log('\n📝 Next Steps:');
      console.log('1. Clear browser cache and localStorage');
      console.log('2. Go to: https://grooovy.netlify.app');
      console.log('3. Register as organizer');
      console.log('4. You should now land on organizer dashboard!');
      console.log('5. Check browser console for debug logs');
      return;
    } else if (result.type === 'error') {
      console.log(`   ❌ Backend error: ${result.error}`);
    } else {
      console.log(`   ❓ Unknown response: ${result.statusCode}`);
    }
    
    if (attempts < maxAttempts) {
      console.log('   ⏳ Waiting 15 seconds before next check...\n');
      await new Promise(resolve => setTimeout(resolve, 15000));
    }
  }
  
  console.log('\n==================================================');
  console.log('⏰ Monitoring timeout reached');
  console.log('The deployment may still be in progress.');
  console.log('Check your Render dashboard: https://dashboard.render.com');
}

monitorDeployment().catch(console.error);