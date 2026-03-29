#!/usr/bin/env node

/**
 * Tikit Production Deployment Helper
 * This script helps configure and deploy the Tikit application to production
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Tikit Production Deployment Helper\n');

// Check if we're in the right directory
if (!fs.existsSync('apps/frontend') || !fs.existsSync('apps/backend')) {
  console.error('❌ Error: Please run this script from the project root directory');
  process.exit(1);
}

console.log('✅ Project structure verified');

// Check if PWA icons exist
const iconPath = 'apps/frontend/public/pwa-192x192.png';
if (fs.existsSync(iconPath)) {
  console.log('✅ PWA icons found');
} else {
  console.log('⚠️  PWA icons missing - run: cd apps/frontend && node generate-icons.js');
}

// Check environment files
const prodEnvPath = 'apps/frontend/.env.production';
if (fs.existsSync(prodEnvPath)) {
  console.log('✅ Production environment file found');
} else {
  console.log('❌ Production environment file missing');
}

// Read current API URL
const envPath = 'apps/frontend/.env';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const apiUrl = envContent.match(/VITE_API_URL=(.+)/)?.[1];
  
  if (apiUrl === 'http://localhost:4000') {
    console.log('⚠️  Frontend still configured for localhost');
    console.log('   Update VITE_API_URL in Vercel environment variables');
  } else {
    console.log('✅ Frontend configured for production API');
  }
}

console.log('\n📋 Deployment Checklist:');
console.log('1. ✅ Frontend deployed to Vercel');
console.log('2. ⏳ Deploy backend to Render');
console.log('3. ⏳ Update Vercel environment variables');
console.log('4. ⏳ Configure database and services');

console.log('\n🔗 Useful Links:');
console.log('- Frontend: https://tikit-ik4l.vercel.app');
console.log('- Render Dashboard: https://render.com');
console.log('- Vercel Dashboard: https://vercel.com');

console.log('\n📖 Next Steps:');
console.log('1. Deploy backend using render.yaml configuration');
console.log('2. Get backend URL from Render');
console.log('3. Update VITE_API_URL in Vercel environment variables');
console.log('4. Redeploy frontend to apply changes');

console.log('\n🎯 Current Issue:');
console.log('Frontend is trying to connect to localhost:4000');
console.log('This will be fixed once backend is deployed and environment variables are updated');

console.log('\n✨ Deployment guide available in: PRODUCTION_DEPLOYMENT_GUIDE.md');