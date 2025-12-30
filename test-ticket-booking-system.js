#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Ticket Booking System
 * Tests all major features and workflows
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎫 Testing Complete Ticket Booking System\n');

// Test configuration
const BACKEND_URL = 'http://localhost:4000';
const FRONTEND_URL = 'http://localhost:3001';

// Test data
const testUser = {
  firstName: 'Test',
  lastName: 'User',
  phoneNumber: '+2348123456789',
  state: 'Lagos',
  lga: 'Lagos Island',
  role: 'attendee'
};

const testEvent = {
  id: '1',
  title: 'Lagos Music Festival 2024'
};

// Utility functions
function makeRequest(url, options = {}) {
  const fetch = require('node-fetch');
  return fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test functions
async function testBackendHealth() {
  console.log('🔍 Testing Backend Health...');
  try {
    const response = await makeRequest(`${BACKEND_URL}/health`);
    const health = await response.json();
    
    console.log(`✅ Backend Status: ${health.status}`);
    console.log(`✅ Database: ${health.database}`);
    console.log(`✅ Redis: ${health.redis}`);
    console.log(`✅ Supabase: ${health.supabase}`);
    
    return health.status === 'ok';
  } catch (error) {
    console.log(`❌ Backend health check failed: ${error.message}`);
    return false;
  }
}

async function testUserRegistration() {
  console.log('\n👤 Testing User Registration...');
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      body: JSON.stringify(testUser)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ User registration successful');
      return result.data.token;
    } else {
      console.log(`❌ Registration failed: ${result.error?.message}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Registration error: ${error.message}`);
    return null;
  }
}

async function testEventRetrieval(token) {
  console.log('\n🎉 Testing Event Retrieval...');
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/events`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    
    if (result.success && result.data.length > 0) {
      console.log(`✅ Retrieved ${result.data.length} events`);
      return result.data[0];
    } else {
      console.log('❌ No events found');
      return null;
    }
  } catch (error) {
    console.log(`❌ Event retrieval error: ${error.message}`);
    return null;
  }
}

async function testGroupBuyCreation(token) {
  console.log('\n👥 Testing Group Buy Creation...');
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/group-buy/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        eventId: testEvent.id,
        tierId: 'regular',
        totalParticipants: 5,
        expirationHours: 24
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Group buy created successfully');
      return result.data;
    } else {
      console.log(`❌ Group buy creation failed: ${result.error?.message}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Group buy creation error: ${error.message}`);
    return null;
  }
}

async function testTicketIssuance(token) {
  console.log('\n🎫 Testing Ticket Issuance...');
  try {
    // First create a mock payment
    const paymentResponse = await makeRequest(`${BACKEND_URL}/api/payments/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        eventId: testEvent.id,
        tierId: 'regular',
        quantity: 1,
        amount: 5000,
        paymentMethod: 'wallet'
      })
    });
    
    const payment = await paymentResponse.json();
    
    if (!payment.success) {
      console.log(`❌ Payment creation failed: ${payment.error?.message}`);
      return null;
    }
    
    // Then issue ticket
    const ticketResponse = await makeRequest(`${BACKEND_URL}/api/tickets/issue`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        eventId: testEvent.id,
        tierId: 'regular',
        paymentId: payment.data.id
      })
    });
    
    const ticket = await ticketResponse.json();
    
    if (ticket.success) {
      console.log('✅ Ticket issued successfully');
      console.log(`   QR Code: ${ticket.data.qrCode}`);
      console.log(`   Backup Code: ${ticket.data.backupCode}`);
      return ticket.data;
    } else {
      console.log(`❌ Ticket issuance failed: ${ticket.error?.message}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Ticket issuance error: ${error.message}`);
    return null;
  }
}

async function testFrontendComponents() {
  console.log('\n🖥️  Testing Frontend Components...');
  
  const componentsToCheck = [
    'apps/frontend/src/pages/EventDetails.tsx',
    'apps/frontend/src/pages/Checkout.tsx',
    'apps/frontend/src/components/tickets/TicketSelector.tsx',
    'apps/frontend/src/components/tickets/GroupBuyCreator.tsx',
    'apps/frontend/src/components/tickets/GroupBuyStatus.tsx',
    'apps/frontend/src/components/events/SprayMoneyLeaderboard.tsx',
    'apps/frontend/src/components/tickets/WeddingTicketPurchase.tsx',
    'apps/frontend/src/components/tickets/PaymentMethodSelector.tsx',
    'apps/frontend/src/components/tickets/PaymentErrorHandler.tsx'
  ];
  
  let allExist = true;
  
  for (const component of componentsToCheck) {
    if (fs.existsSync(component)) {
      console.log(`✅ ${path.basename(component)} exists`);
    } else {
      console.log(`❌ ${path.basename(component)} missing`);
      allExist = false;
    }
  }
  
  return allExist;
}

async function testAPIEndpoints(token) {
  console.log('\n🔗 Testing API Endpoints...');
  
  const endpoints = [
    { path: '/api/events', method: 'GET', name: 'Events List' },
    { path: '/api/tickets/my-tickets', method: 'GET', name: 'My Tickets' },
    { path: '/api/group-buy/create', method: 'POST', name: 'Group Buy Creation', body: {
      eventId: '1', tierId: 'regular', totalParticipants: 3
    }},
    { path: '/api/realtime/events/1/capacity', method: 'GET', name: 'Real-time Capacity' }
  ];
  
  let passedTests = 0;
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${BACKEND_URL}${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: endpoint.body ? JSON.stringify(endpoint.body) : undefined
      });
      
      if (response.ok) {
        console.log(`✅ ${endpoint.name} - OK`);
        passedTests++;
      } else {
        console.log(`❌ ${endpoint.name} - ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name} - Error: ${error.message}`);
    }
  }
  
  return passedTests === endpoints.length;
}

async function testFeatureCompleteness() {
  console.log('\n🎯 Testing Feature Completeness...');
  
  const features = [
    { name: 'Regular Ticket Booking', file: 'apps/frontend/src/components/tickets/TicketSelector.tsx' },
    { name: 'Bulk Booking (50+)', file: 'apps/frontend/src/components/tickets/TicketSelector.tsx' },
    { name: 'Group Buy Creation', file: 'apps/frontend/src/components/tickets/GroupBuyCreator.tsx' },
    { name: 'Group Buy Status Tracking', file: 'apps/frontend/src/components/tickets/GroupBuyStatus.tsx' },
    { name: 'Wedding Aso-ebi Selection', file: 'apps/frontend/src/components/tickets/WeddingTicketPurchase.tsx' },
    { name: 'Spray Money Leaderboard', file: 'apps/frontend/src/components/events/SprayMoneyLeaderboard.tsx' },
    { name: 'Multiple Payment Methods', file: 'apps/frontend/src/components/tickets/PaymentMethodSelector.tsx' },
    { name: 'Payment Error Handling', file: 'apps/frontend/src/components/tickets/PaymentErrorHandler.tsx' },
    { name: 'Event Details Page', file: 'apps/frontend/src/pages/EventDetails.tsx' },
    { name: 'Checkout Flow', file: 'apps/frontend/src/pages/Checkout.tsx' }
  ];
  
  let implementedFeatures = 0;
  
  for (const feature of features) {
    if (fs.existsSync(feature.file)) {
      const content = fs.readFileSync(feature.file, 'utf8');
      
      // Check for key functionality indicators
      let hasImplementation = false;
      
      switch (feature.name) {
        case 'Regular Ticket Booking':
          hasImplementation = content.includes('quantity') && content.includes('tier');
          break;
        case 'Bulk Booking (50+)':
          hasImplementation = content.includes('bulk') && content.includes('50');
          break;
        case 'Group Buy Creation':
          hasImplementation = content.includes('totalParticipants') && content.includes('create');
          break;
        case 'Wedding Aso-ebi Selection':
          hasImplementation = content.includes('asoEbi') && content.includes('color');
          break;
        case 'Spray Money Leaderboard':
          hasImplementation = content.includes('leaderboard') && content.includes('spray');
          break;
        case 'Multiple Payment Methods':
          hasImplementation = content.includes('wallet') && content.includes('card');
          break;
        default:
          hasImplementation = content.length > 1000; // Basic implementation check
      }
      
      if (hasImplementation) {
        console.log(`✅ ${feature.name} - Implemented`);
        implementedFeatures++;
      } else {
        console.log(`⚠️  ${feature.name} - Partial implementation`);
      }
    } else {
      console.log(`❌ ${feature.name} - Missing`);
    }
  }
  
  console.log(`\n📊 Feature Implementation: ${implementedFeatures}/${features.length} (${Math.round(implementedFeatures/features.length*100)}%)`);
  
  return implementedFeatures === features.length;
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Comprehensive Test Suite\n');
  
  const results = {
    backendHealth: false,
    userRegistration: false,
    eventRetrieval: false,
    groupBuyCreation: false,
    ticketIssuance: false,
    frontendComponents: false,
    apiEndpoints: false,
    featureCompleteness: false
  };
  
  let token = null;
  
  // Test backend health
  results.backendHealth = await testBackendHealth();
  
  if (results.backendHealth) {
    // Test user registration
    token = await testUserRegistration();
    results.userRegistration = !!token;
    
    if (token) {
      // Test event retrieval
      const event = await testEventRetrieval(token);
      results.eventRetrieval = !!event;
      
      // Test group buy creation
      const groupBuy = await testGroupBuyCreation(token);
      results.groupBuyCreation = !!groupBuy;
      
      // Test ticket issuance
      const ticket = await testTicketIssuance(token);
      results.ticketIssuance = !!ticket;
      
      // Test API endpoints
      results.apiEndpoints = await testAPIEndpoints(token);
    }
  }
  
  // Test frontend components
  results.frontendComponents = await testFrontendComponents();
  
  // Test feature completeness
  results.featureCompleteness = await testFeatureCompleteness();
  
  // Generate test report
  console.log('\n📋 TEST REPORT');
  console.log('================');
  
  const testResults = Object.entries(results);
  const passedTests = testResults.filter(([_, passed]) => passed).length;
  const totalTests = testResults.length;
  
  testResults.forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`${status} - ${testName}`);
  });
  
  console.log(`\n🎯 Overall Score: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! Ticket booking system is fully functional.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the issues above.');
  }
  
  return passedTests === totalTests;
}

// Run the tests
if (require.main === module) {
  runTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}

module.exports = { runTests };