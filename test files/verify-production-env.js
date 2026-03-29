#!/usr/bin/env node

/**
 * Verify Production Environment Variables
 * 
 * This script helps verify that Vercel has the correct environment variables set
 */

console.log('🔍 Vercel Environment Variables Check\n');

console.log('📋 REQUIRED ENVIRONMENT VARIABLES FOR VERCEL:');
console.log('');
console.log('Variable Name: VITE_SUPABASE_URL');
console.log('Value: https://hwwzbsppzwcyvambeade.supabase.co');
console.log('');
console.log('Variable Name: VITE_SUPABASE_ANON_KEY');
console.log('Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3d3pic3BwendjeXZhbWJlYWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3NjgyOTYsImV4cCI6MjA4MjM0NDI5Nn0.Cwsvgq1qJ7fAfxT2opSfmnJkShy8F6lcRa4xXLdAbnc');
console.log('');

console.log('🚀 STEPS TO FIX VERCEL DEPLOYMENT:');
console.log('');
console.log('1. Go to: https://vercel.com/dashboard');
console.log('2. Click on your "grooovy-theta" project');
console.log('3. Go to Settings tab');
console.log('4. Click "Environment Variables" in the sidebar');
console.log('5. Add the two variables above');
console.log('6. Click "Redeploy" or push new code to trigger deployment');
console.log('');

console.log('🔍 HOW TO VERIFY IT WORKED:');
console.log('');
console.log('✅ Visit: https://grooovy-theta.vercel.app');
console.log('✅ Open browser console (F12)');
console.log('✅ Look for: "Supabase client created: true"');
console.log('✅ Should NOT see: "localhost:4000" errors');
console.log('✅ Try registering a new account');
console.log('✅ Try logging in');
console.log('');

console.log('🎯 EXPECTED CONSOLE OUTPUT AFTER FIX:');
console.log('');
console.log('✅ Supabase Debug Info:');
console.log('✅ URL: https://hwwzbsppzwcyvambeade.supabase.co');
console.log('✅ Key length: 208');
console.log('✅ Supabase client created: true');
console.log('✅ Session check successful: false');
console.log('');

console.log('❌ CURRENT BROKEN OUTPUT:');
console.log('');
console.log('❌ POST http://localhost:4000/api/auth/login net::ERR_FAILED');
console.log('❌ CORS policy: No Access-Control-Allow-Origin header');
console.log('❌ Error loading PWA icon');
console.log('');

console.log('💡 The app code is correct - it just needs environment variables in Vercel!');
console.log('');
console.log('📞 If you need help:');
console.log('   1. Check Vercel build logs for errors');
console.log('   2. Verify environment variables are saved correctly');
console.log('   3. Make sure to redeploy after adding variables');
console.log('   4. Test in incognito mode to avoid cache issues');