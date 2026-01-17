#!/usr/bin/env node

/**
 * Force Deployment Script
 * Makes a small change to trigger Render deployment
 */

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 Forcing Render Deployment...');
console.log('==================================================\n');

try {
  // Add a deployment trigger comment to main.py
  const mainPyPath = 'apps/backend-fastapi/main.py';
  const timestamp = new Date().toISOString();
  const triggerComment = `\n# Deployment trigger: ${timestamp}\n`;
  
  console.log('📝 Adding deployment trigger to main.py...');
  fs.appendFileSync(mainPyPath, triggerComment);
  console.log('✅ Trigger comment added');
  
  // Commit and push
  console.log('\n📤 Committing and pushing changes...');
  execSync('git add apps/backend-fastapi/main.py', { stdio: 'inherit' });
  execSync(`git commit -m "Force deployment trigger - ${timestamp}"`, { stdio: 'inherit' });
  execSync('git push origin main', { stdio: 'inherit' });
  
  console.log('\n==================================================');
  console.log('✅ Deployment trigger pushed to GitHub!');
  console.log('🔄 Render should now start deploying the real backend');
  console.log('⏰ This will take 2-5 minutes');
  console.log('\n📝 Next steps:');
  console.log('1. Wait 2-5 minutes for deployment');
  console.log('2. Run: node test-role-registration-complete.cjs');
  console.log('3. Look for real user IDs (not "test-user-id")');
  console.log('4. Test frontend registration');
  
} catch (error) {
  console.error('❌ Error forcing deployment:', error.message);
  process.exit(1);
}