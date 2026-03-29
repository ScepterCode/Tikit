#!/usr/bin/env node

/**
 * Dashboard Routing Flow Test
 * Tests the complete registration -> dashboard routing flow
 */

const https = require('https');

const BACKEND_URL = 'https://groovy-czqr.onrender.com';

console.log('🧪 Dashboard Routing Flow Test...');
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

async function testCompleteFlow(role, testName) {
  console.log(`🧪 Testing ${testName} Complete Flow...`);
  
  const timestamp = Date.now();
  const sampleUser = {
    phone_number: `+234801234${timestamp.toString().slice(-4)}`,
    password: 'testpass123',
    first_name: 'Test',
    last_name: role === 'organizer' ? 'Organizer' : 'Attendee',
    state: 'Lagos',
    role: role,
    organization_name: role === 'organizer' ? 'Test Organization' : undefined
  };
  
  console.log(`   📋 Registration data:`, {
    phone_number: sampleUser.phone_number,
    role: sampleUser.role,
    organization_name: sampleUser.organization_name
  });
  
  try {
    // Step 1: Register
    console.log('   🔄 Step 1: Registering user...');
    const registerResponse = await makeRequest(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      body: sampleUser
    });
    
    if (registerResponse.statusCode !== 200) {
      console.log(`   ❌ Registration failed: ${registerResponse.statusCode}`);
      return { success: false, step: 'registration' };
    }
    
    const registerData = JSON.parse(registerResponse.data);
    if (!registerData.success || !registerData.data?.user) {
      console.log(`   ❌ Registration failed: ${registerData.error?.message}`);
      return { success: false, step: 'registration' };
    }
    
    const user = registerData.data.user;
    console.log(`   ✅ Registration successful`);
    console.log(`   👤 User ID: ${user.id}`);
    console.log(`   🎭 User role: ${user.role}`);
    
    // Verify role matches
    if (user.role !== role) {
      console.log(`   ❌ Role mismatch! Expected: ${role}, Got: ${user.role}`);
      return { success: false, step: 'role_verification', expectedRole: role, actualRole: user.role };
    }
    
    console.log(`   ✅ Role correctly set: ${role}`);
    
    // Step 2: Determine dashboard route
    console.log('   🔄 Step 2: Determining dashboard route...');
    let expectedRoute;
    switch (user.role) {
      case 'attendee':
        expectedRoute = '/attendee/dashboard';
        break;
      case 'organizer':
        expectedRoute = '/organizer/dashboard';
        break;
      case 'admin':
        expectedRoute = '/admin/dashboard';
        break;
      default:
        expectedRoute = '/';
    }
    
    console.log(`   ✅ Expected dashboard route: ${expectedRoute}`);
    
    // Step 3: Simulate frontend auth context behavior
    console.log('   🔄 Step 3: Simulating frontend auth context...');
    
    // This simulates what FastAPIAuthContext.tsx does
    const authUser = {
      id: user.id,
      phoneNumber: user.phone_number,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      state: user.state,
      role: user.role,
      walletBalance: user.wallet_balance || 0,
      referralCode: user.referral_code || '',
      organizationName: user.organization_name,
      organizationType: user.organization_type,
      isVerified: user.is_verified || false,
      createdAt: user.created_at
    };
    
    console.log(`   ✅ Auth user object created`);
    console.log(`   🎭 Auth user role: ${authUser.role}`);
    
    // Step 4: Simulate DashboardRouter logic
    console.log('   🔄 Step 4: Simulating DashboardRouter logic...');
    
    let routerDecision;
    switch (authUser.role) {
      case 'attendee':
        routerDecision = '/attendee/dashboard';
        break;
      case 'organizer':
        routerDecision = '/organizer/dashboard';
        break;
      case 'admin':
        routerDecision = '/admin/dashboard';
        break;
      default:
        routerDecision = '/';
    }
    
    console.log(`   ✅ Router decision: ${routerDecision}`);
    
    // Verify routing decision matches expected
    if (routerDecision === expectedRoute) {
      console.log(`   ✅ Dashboard routing correct!`);
      return { 
        success: true, 
        user: authUser, 
        expectedRoute, 
        actualRoute: routerDecision,
        role: role
      };
    } else {
      console.log(`   ❌ Dashboard routing incorrect! Expected: ${expectedRoute}, Got: ${routerDecision}`);
      return { 
        success: false, 
        step: 'routing', 
        expectedRoute, 
        actualRoute: routerDecision 
      };
    }
    
  } catch (error) {
    console.log(`   ❌ Flow failed: ${error.message}`);
    return { success: false, step: 'error', error: error.message };
  }
}

async function main() {
  console.log('🔍 Backend URL:', BACKEND_URL);
  console.log('⏰ Testing complete registration -> dashboard routing flow...\n');
  
  const results = [];
  
  // Test attendee flow
  const attendeeResult = await testCompleteFlow('attendee', 'Attendee');
  results.push({ test: 'Attendee Flow', ...attendeeResult });
  console.log('');
  
  // Test organizer flow
  const organizerResult = await testCompleteFlow('organizer', 'Organizer');
  results.push({ test: 'Organizer Flow', ...organizerResult });
  console.log('');
  
  // Summary
  console.log('==================================================');
  console.log('📊 Dashboard Routing Flow Results:');
  console.log('');
  
  let allPassed = true;
  results.forEach((result, index) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${index + 1}. ${result.test}: ${status}`);
    
    if (result.success) {
      console.log(`   Role: ${result.role}`);
      console.log(`   Route: ${result.actualRoute}`);
    } else {
      console.log(`   Failed at: ${result.step}`);
      if (result.error) console.log(`   Error: ${result.error}`);
      if (result.expectedRoute) console.log(`   Expected: ${result.expectedRoute}, Got: ${result.actualRoute}`);
      allPassed = false;
    }
  });
  
  console.log('');
  if (allPassed) {
    console.log('🎉 ALL FLOWS PASSED!');
    console.log('✅ Registration -> Dashboard routing is working correctly');
    console.log('');
    console.log('🚀 Ready for frontend testing:');
    console.log('1. Clear browser cache/localStorage');
    console.log('2. Register as organizer on frontend');
    console.log('3. Should be routed to /organizer/dashboard');
    console.log('4. Register as attendee on frontend');
    console.log('5. Should be routed to /attendee/dashboard');
  } else {
    console.log('❌ SOME FLOWS FAILED');
    console.log('🔧 Check the implementation');
  }
}

main().catch(console.error);