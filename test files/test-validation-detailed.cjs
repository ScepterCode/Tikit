#!/usr/bin/env node

/**
 * Detailed Validation Test
 * Tests specific validation scenarios
 */

const https = require('https');

const BACKEND_URL = 'https://groovy-czqr.onrender.com';

console.log('🧪 Detailed Validation Test...');
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
      timeout: 15000
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

async function testValidation(testName, requestBody, expectedStatus, expectedError) {
  console.log(`🧪 Testing ${testName}...`);
  console.log(`   📋 Request body:`, requestBody);
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      body: requestBody
    });
    
    console.log(`   📊 Response status: ${response.statusCode}`);
    
    const data = JSON.parse(response.data);
    console.log(`   📄 Response data:`, data);
    
    if (response.statusCode === expectedStatus) {
      if (expectedStatus === 400) {
        // Handle FastAPI HTTPException format
        const errorData = data.detail || data;
        if (errorData.error) {
          console.log(`   ✅ Correctly rejected with error: ${errorData.error.message}`);
          return { success: true, validationWorking: true };
        }
      } else if (expectedStatus === 200 && data.success) {
        console.log(`   ✅ Successfully accepted`);
        return { success: true, accepted: true, user: data.data?.user };
      }
    }
    
    console.log(`   ❌ Unexpected response`);
    return { success: false, error: 'Unexpected response', actualStatus: response.statusCode, expectedStatus };
    
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🔍 Backend URL:', BACKEND_URL);
  console.log('⏰ Testing detailed validation scenarios...\n');
  
  const timestamp = Date.now();
  
  // Test 1: Missing role field
  await testValidation(
    'Missing Role Field',
    {
      phone_number: `+234801234${timestamp.toString().slice(-4)}`,
      password: 'testpass123',
      first_name: 'Test',
      last_name: 'User',
      state: 'Lagos'
      // role field intentionally missing
    },
    400, // Should return 400 error
    'Missing required fields: role'
  );
  console.log('');
  
  // Test 2: Invalid role value
  await testValidation(
    'Invalid Role Value',
    {
      phone_number: `+234801234${(timestamp + 1).toString().slice(-4)}`,
      password: 'testpass123',
      first_name: 'Test',
      last_name: 'User',
      state: 'Lagos',
      role: 'invalid_role'
    },
    400, // Should return 400 error
    'Invalid role'
  );
  console.log('');
  
  // Test 3: Organizer without organization_name
  await testValidation(
    'Organizer Without Organization Name',
    {
      phone_number: `+234801234${(timestamp + 2).toString().slice(-4)}`,
      password: 'testpass123',
      first_name: 'Test',
      last_name: 'User',
      state: 'Lagos',
      role: 'organizer'
      // organization_name missing
    },
    400, // Should return 400 error
    'Organization name is required'
  );
  console.log('');
  
  // Test 4: Valid attendee registration
  await testValidation(
    'Valid Attendee Registration',
    {
      phone_number: `+234801234${(timestamp + 3).toString().slice(-4)}`,
      password: 'testpass123',
      first_name: 'Test',
      last_name: 'User',
      state: 'Lagos',
      role: 'attendee'
    },
    200, // Should succeed
    null
  );
  console.log('');
  
  // Test 5: Valid organizer registration
  await testValidation(
    'Valid Organizer Registration',
    {
      phone_number: `+234801234${(timestamp + 4).toString().slice(-4)}`,
      password: 'testpass123',
      first_name: 'Test',
      last_name: 'User',
      state: 'Lagos',
      role: 'organizer',
      organization_name: 'Test Organization'
    },
    200, // Should succeed
    null
  );
}

main().catch(console.error);