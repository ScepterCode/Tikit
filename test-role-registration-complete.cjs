#!/usr/bin/env node

/**
 * Complete Role Registration Test
 * Tests the entire registration flow to ensure roles are handled correctly
 */

const https = require('https');

const BACKEND_URL = 'https://groovy-czqr.onrender.com';

console.log('🧪 Complete Role Registration Test...');
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

async function testRegistration(role, testName) {
  console.log(`🧪 Testing ${testName}...`);
  
  const timestamp = Date.now();
  const sampleUser = {
    phone_number: `+234801234${timestamp.toString().slice(-4)}`, // Unique phone
    password: 'testpass123',
    first_name: 'Test',
    last_name: role === 'organizer' ? 'Organizer' : 'Attendee',
    state: 'Lagos',
    role: role,
    organization_name: role === 'organizer' ? 'Test Organization' : undefined
  };
  
  console.log(`   📋 Test data:`, {
    phone_number: sampleUser.phone_number,
    role: sampleUser.role,
    organization_name: sampleUser.organization_name
  });
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      body: sampleUser
    });
    
    console.log(`   📊 Response status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.data);
      
      if (data.success && data.data?.user) {
        const user = data.data.user;
        console.log(`   ✅ Registration successful`);
        console.log(`   👤 User ID: ${user.id}`);
        console.log(`   🎭 User role: ${user.role}`);
        console.log(`   🏢 Organization: ${user.organization_name || 'N/A'}`);
        
        // Verify role matches what we sent
        if (user.role === role) {
          console.log(`   ✅ Role correctly preserved: ${role}`);
          return { success: true, user, expectedRole: role };
        } else {
          console.log(`   ❌ Role mismatch! Expected: ${role}, Got: ${user.role}`);
          return { success: false, error: 'Role mismatch', expectedRole: role, actualRole: user.role };
        }
      } else {
        console.log(`   ❌ Registration failed: ${data.error?.message || 'Unknown error'}`);
        return { success: false, error: data.error?.message || 'Registration failed' };
      }
    } else {
      const errorData = JSON.parse(response.data);
      console.log(`   ❌ HTTP Error: ${errorData.detail || errorData.error?.message || 'Unknown error'}`);
      return { success: false, error: errorData.detail || errorData.error?.message };
    }
    
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testMissingRole() {
  console.log(`🧪 Testing Missing Role Validation...`);
  
  const timestamp = Date.now();
  const sampleUser = {
    phone_number: `+234801234${timestamp.toString().slice(-4)}`,
    password: 'testpass123',
    first_name: 'Test',
    last_name: 'NoRole',
    state: 'Lagos'
    // Intentionally omit role field
  };
  
  console.log(`   📋 Test data (no role):`, sampleUser);
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      body: sampleUser
    });
    
    console.log(`   📊 Response status: ${response.statusCode}`);
    
    if (response.statusCode === 400) {
      const data = JSON.parse(response.data);
      console.log(`   ✅ Correctly rejected missing role`);
      console.log(`   📝 Error: ${data.error?.message || data.detail}`);
      return { success: true, validationWorking: true };
    } else if (response.statusCode === 200) {
      const data = JSON.parse(response.data);
      if (data.data?.user?.role) {
        console.log(`   ❌ Should have rejected missing role, but got: ${data.data.user.role}`);
        return { success: false, error: 'Missing role validation failed' };
      }
    }
    
    return { success: false, error: 'Unexpected response' };
    
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🔍 Backend URL:', BACKEND_URL);
  console.log('⏰ Testing role registration and validation...\n');
  
  const results = [];
  
  // Test attendee registration
  const attendeeResult = await testRegistration('attendee', 'Attendee Registration');
  results.push({ test: 'Attendee Registration', ...attendeeResult });
  console.log('');
  
  // Test organizer registration
  const organizerResult = await testRegistration('organizer', 'Organizer Registration');
  results.push({ test: 'Organizer Registration', ...organizerResult });
  console.log('');
  
  // Test missing role validation
  const missingRoleResult = await testMissingRole();
  results.push({ test: 'Missing Role Validation', ...missingRoleResult });
  console.log('');
  
  // Summary
  console.log('==================================================');
  console.log('📊 Test Results Summary:');
  console.log('');
  
  let allPassed = true;
  results.forEach((result, index) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${index + 1}. ${result.test}: ${status}`);
    
    if (!result.success) {
      console.log(`   Error: ${result.error}`);
      allPassed = false;
    } else if (result.expectedRole) {
      console.log(`   Role: ${result.expectedRole} ✅`);
    } else if (result.validationWorking) {
      console.log(`   Validation: Working ✅`);
    }
  });
  
  console.log('');
  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('✅ Role registration is working correctly');
    console.log('✅ Role validation is working correctly');
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('1. Clear browser cache/localStorage');
    console.log('2. Test registration on frontend');
    console.log('3. Verify dashboard routing works');
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('🔧 Check the backend implementation');
    console.log('📝 Review error messages above');
  }
}

main().catch(console.error);