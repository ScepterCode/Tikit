#!/usr/bin/env node

/**
 * Supabase Production Setup Helper for Grooovy
 * This script helps you configure Supabase for production deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔥 Grooovy Supabase Production Setup\n');

// Check if we're in the right directory
if (!fs.existsSync('apps/frontend') || !fs.existsSync('apps/backend')) {
  console.error('❌ Error: Please run this script from the project root directory');
  process.exit(1);
}

console.log('✅ Project structure verified');

// Check current environment configuration
const envPath = 'apps/frontend/.env';
const prodEnvPath = 'apps/frontend/.env.production';

console.log('\n📋 Current Configuration Status:');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1];
  const supabaseKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/)?.[1];
  
  if (supabaseUrl && supabaseUrl !== 'https://your-project.supabase.co') {
    console.log('✅ Supabase URL configured in .env');
  } else {
    console.log('⚠️  Supabase URL not configured in .env');
  }
  
  if (supabaseKey && supabaseKey !== 'your_supabase_anon_key_here') {
    console.log('✅ Supabase anon key configured in .env');
  } else {
    console.log('⚠️  Supabase anon key not configured in .env');
  }
} else {
  console.log('❌ .env file not found');
}

if (fs.existsSync(prodEnvPath)) {
  console.log('✅ Production environment file exists');
} else {
  console.log('❌ Production environment file missing');
}

console.log('\n🎯 Setup Instructions:');
console.log('1. Create a Supabase project at https://supabase.com');
console.log('2. Go to Settings → API in your Supabase dashboard');
console.log('3. Copy your Project URL and anon/public key');
console.log('4. Update Vercel environment variables:');
console.log('   - VITE_SUPABASE_URL=https://your-project-id.supabase.co');
console.log('   - VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...');
console.log('5. Run the SQL schema in your Supabase SQL Editor');
console.log('6. Redeploy your Vercel app');

console.log('\n📊 Database Schema:');
console.log('Run this SQL in your Supabase SQL Editor:');
console.log('👉 See SUPABASE_PRODUCTION_SETUP.md for complete schema');

console.log('\n🔧 Authentication Mode:');
console.log('The app will automatically detect Supabase configuration and switch modes:');
console.log('- ✅ Supabase configured → Uses Supabase Auth + Database');
console.log('- ❌ Supabase not configured → Uses Backend API (localhost:4000)');

console.log('\n🚀 Expected Results:');
console.log('Once Supabase is configured:');
console.log('- ✅ User registration/login will work');
console.log('- ✅ Real-time features will function');
console.log('- ✅ Data will persist in Supabase');
console.log('- ✅ No more localhost connection errors');

console.log('\n📱 Test Your Setup:');
console.log('1. Visit your deployed app');
console.log('2. Try to register a new account');
console.log('3. Check Supabase dashboard for new user');
console.log('4. Test real-time features');

console.log('\n🔗 Useful Links:');
console.log('- Supabase Dashboard: https://supabase.com/dashboard');
console.log('- Vercel Dashboard: https://vercel.com/dashboard');
console.log('- Your App: https://grooovy-ik4l.vercel.app');

console.log('\n✨ The app is ready for Supabase - just add your credentials!');