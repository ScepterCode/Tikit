#!/usr/bin/env node

/**
 * Grooovy Deployment Verification Script
 * Checks if the app is properly deployed and configured
 */

import https from 'https';

const APP_URL = 'https://grooovy-ik4l.vercel.app';

console.log('🔍 Verifying Grooovy Deployment...\n');

// Check if app is accessible
function checkAppStatus() {
  return new Promise((resolve, reject) => {
    https.get(APP_URL, (res) => {
      console.log(`✅ App Status: ${res.statusCode} ${res.statusMessage}`);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // Check if it's showing the setup screen or the actual app
        if (data.includes('Supabase Setup Required')) {
          console.log('⚠️  App is showing Supabase setup screen');
          console.log('   → Need to configure Supabase credentials in Vercel');
        } else if (data.includes('Grooovy')) {
          console.log('✅ App is loading properly');
        } else {
          console.log('❓ App status unclear');
        }
        resolve(data);
      });
    }).on('error', (err) => {
      console.log('❌ App is not accessible:', err.message);
      reject(err);
    });
  });
}

// Check deployment status
async function verifyDeployment() {
  try {
    console.log(`🌐 Checking: ${APP_URL}`);
    await checkAppStatus();
    
    console.log('\n📋 Next Steps:');
    console.log('1. If showing setup screen → Configure Supabase in Vercel');
    console.log('2. If app loads → Test registration and login');
    console.log('3. If errors → Check browser console for details');
    
    console.log('\n🔗 Useful Links:');
    console.log('- App: https://grooovy-ik4l.vercel.app');
    console.log('- Vercel Dashboard: https://vercel.com/dashboard');
    console.log('- Supabase: https://supabase.com');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

verifyDeployment();