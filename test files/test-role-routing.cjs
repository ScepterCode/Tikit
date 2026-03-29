#!/usr/bin/env node

/**
 * Test Role Routing Fix
 * Tests that users are correctly routed to their appropriate dashboards based on role
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Role Routing Fix...');
console.log('==================================================\n');

// Test 1: Check API Service Field Mapping
console.log('🧪 Test 1: API Service Field Mapping...');
const apiServicePath = path.join(__dirname, 'apps/frontend/src/services/api.ts');
const apiServiceContent = fs.readFileSync(apiServicePath, 'utf8');

// Check if registration method converts camelCase to snake_case
const hasPhoneNumberMapping = apiServiceContent.includes('phone_number: userData.phoneNumber');
const hasFirstNameMapping = apiServiceContent.includes('first_name: userData.firstName');
const hasLastNameMapping = apiServiceContent.includes('last_name: userData.lastName');
const hasRoleMapping = apiServiceContent.includes('role: userData.role');

if (hasPhoneNumberMapping && hasFirstNameMapping && hasLastNameMapping && hasRoleMapping) {
  console.log('✅ API Service correctly maps camelCase to snake_case');
} else {
  console.log('❌ API Service field mapping incomplete');
  console.log('   - phone_number mapping:', hasPhoneNumberMapping);
  console.log('   - first_name mapping:', hasFirstNameMapping);
  console.log('   - last_name mapping:', hasLastNameMapping);
  console.log('   - role mapping:', hasRoleMapping);
}

// Test 2: Check Auth Context User Mapping
console.log('\n🧪 Test 2: Auth Context User Mapping...');
const authContextPath = path.join(__dirname, 'apps/frontend/src/contexts/FastAPIAuthContext.tsx');
const authContextContent = fs.readFileSync(authContextPath, 'utf8');

// Check if auth context maps backend response to frontend user object
const hasBackendUserMapping = authContextContent.includes('const backendUser = apiResponse.data.user');
const hasRoleExtraction = authContextContent.includes('role: backendUser.role');
const hasPhoneNumberExtraction = authContextContent.includes('phoneNumber: backendUser.phone_number');

if (hasBackendUserMapping && hasRoleExtraction && hasPhoneNumberExtraction) {
  console.log('✅ Auth Context correctly maps backend response to frontend user');
} else {
  console.log('❌ Auth Context user mapping incomplete');
  console.log('   - backend user mapping:', hasBackendUserMapping);
  console.log('   - role extraction:', hasRoleExtraction);
  console.log('   - phone number extraction:', hasPhoneNumberExtraction);
}

// Test 3: Check Dashboard Router Logic
console.log('\n🧪 Test 3: Dashboard Router Logic...');
const dashboardRouterPath = path.join(__dirname, 'apps/frontend/src/pages/DashboardRouter.tsx');
const dashboardRouterContent = fs.readFileSync(dashboardRouterPath, 'utf8');

// Check if dashboard router has correct role-based routing
const hasAttendeeRoute = dashboardRouterContent.includes("case 'attendee':");
const hasOrganizerRoute = dashboardRouterContent.includes("case 'organizer':");
const hasAdminRoute = dashboardRouterContent.includes("case 'admin':");
const hasAttendeeRedirect = dashboardRouterContent.includes('"/attendee/dashboard"');
const hasOrganizerRedirect = dashboardRouterContent.includes('"/organizer/dashboard"');

if (hasAttendeeRoute && hasOrganizerRoute && hasAdminRoute && hasAttendeeRedirect && hasOrganizerRedirect) {
  console.log('✅ Dashboard Router has correct role-based routing logic');
} else {
  console.log('❌ Dashboard Router routing logic incomplete');
  console.log('   - attendee route:', hasAttendeeRoute);
  console.log('   - organizer route:', hasOrganizerRoute);
  console.log('   - admin route:', hasAdminRoute);
  console.log('   - attendee redirect:', hasAttendeeRedirect);
  console.log('   - organizer redirect:', hasOrganizerRedirect);
}

// Test 4: Check Backend Schema
console.log('\n🧪 Test 4: Backend Schema Validation...');
const backendSchemaPath = path.join(__dirname, 'apps/backend-fastapi/models/schemas.py');
const backendSchemaContent = fs.readFileSync(backendSchemaPath, 'utf8');

// Check if backend schema has correct role field
const hasRoleField = backendSchemaContent.includes('role: Literal["attendee", "organizer"]');
const hasPhoneNumberField = backendSchemaContent.includes('phone_number: str');

if (hasRoleField && hasPhoneNumberField) {
  console.log('✅ Backend schema correctly defines role and phone_number fields');
} else {
  console.log('❌ Backend schema validation incomplete');
  console.log('   - role field:', hasRoleField);
  console.log('   - phone_number field:', hasPhoneNumberField);
}

// Test 5: Check Backend Auth Service
console.log('\n🧪 Test 5: Backend Auth Service...');
const authServicePath = path.join(__dirname, 'apps/backend-fastapi/services/auth_service.py');
const authServiceContent = fs.readFileSync(authServicePath, 'utf8');

// Check if auth service saves and returns role correctly
const savesRole = authServiceContent.includes("'role': user_data.get('role', 'attendee')");
const returnsRole = authServiceContent.includes("'role': user['role']");

if (savesRole && returnsRole) {
  console.log('✅ Backend Auth Service correctly handles role field');
} else {
  console.log('❌ Backend Auth Service role handling incomplete');
  console.log('   - saves role:', savesRole);
  console.log('   - returns role:', returnsRole);
}

// Summary
console.log('\n==================================================');
console.log('📊 Role Routing Fix Summary:');

const allTestsPassed = 
  hasPhoneNumberMapping && hasFirstNameMapping && hasLastNameMapping && hasRoleMapping &&
  hasBackendUserMapping && hasRoleExtraction && hasPhoneNumberExtraction &&
  hasAttendeeRoute && hasOrganizerRoute && hasAdminRoute && hasAttendeeRedirect && hasOrganizerRedirect &&
  hasRoleField && hasPhoneNumberField &&
  savesRole && returnsRole;

if (allTestsPassed) {
  console.log('✅ All role routing fixes are in place');
  console.log('🎉 Users should now be correctly routed based on their selected role');
  console.log('\n🚀 Next Steps:');
  console.log('1. Test registration with different roles');
  console.log('2. Verify dashboard routing works correctly');
  console.log('3. Check browser console for debug logs');
} else {
  console.log('❌ Some role routing fixes are missing');
  console.log('🔧 Please review the failed tests above');
}

console.log('\n📝 Debug Instructions:');
console.log('1. Open browser developer tools');
console.log('2. Register as organizer');
console.log('3. Check console logs for user data and routing');
console.log('4. Verify you land on organizer dashboard');