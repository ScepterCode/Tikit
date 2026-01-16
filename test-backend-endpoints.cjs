#!/usr/bin/env node

/**
 * Test Backend Endpoints
 * Tests the actual FastAPI endpoints to verify they're working
 */

const https = require('https');

const BACKEND_URL = 'https://groovy-czqr.onrender.com';

console.log('🧪 Testing Backend Endpoints...');
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
      }
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
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testEndpoint(endpoint, description, options = {}) {
  console.log(`🧪 Testing ${description}...`);
  console.log(`   URL: ${BACKEND_URL}${endpoint}`);
  
  try {
    const response = await makeRequest(`${BACKEND_URL}${endpoint}`, options);
    
    console.log(`   Status: ${response.statusCode}`);
    
    if (response.data) {
      try {
        const jsonData = JSON.parse(response.data);
        console.log(`   Response:`, JSON.stringify(jsonData, null, 2));
      } catch (e) {
        console.log(`   Response: ${response.data.substring(0, 200)}...`);
      }
    }
    
    console.log('');
    return response;
    
  } catch (error) {
    console.log(`   Error: ${error.message}\n`);
    return null;
  }
}

async function main() {
  // Test various endpoint patterns
  await testEndpoint('/health', 'Health Check');
  await testEndpoint('/api/health', 'API Health Check');
  await testEndpoint('/docs', 'API Documentation (should return HTML)');
  await testEndpoint('/api/auth/register', 'Registration Endpoint (GET - should fail)', { method: 'GET' });
  
  // Test registration with sample data
  const sampleUser = {
    phone_number: '+2348012345678',
    password: 'testpass123',
    first_name: 'Test',
    last_name: 'User',
    state: 'Lagos',
    role: 'organizer'
  };
  
  console.log('🧪 Testing Registration with Sample Data...');
  await testEndpoint('/api/auth/register', 'Registration POST', {
    method: 'POST',
    body: sampleUser
  });
  
  console.log('==================================================');
  console.log('✅ Endpoint testing complete!');
}

main().catch(console.error);