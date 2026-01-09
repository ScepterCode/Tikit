#!/usr/bin/env node

/**
 * Comprehensive System Test for Tikit Product
 * Tests backend, database, and overall system health
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

console.log('🔍 TIKIT SYSTEM ANALYSIS STARTING...\n');

// Configuration
const SUPABASE_URL = 'https://hwwzbsppzwcyvambeade.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3d3pic3BwendjeXZhbWJlYWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3NjgyOTYsImV4cCI6MjA4MjM0NDI5Nn0.Cwsvgq1qJ7fAfxT2opSfmnJkShy8F6lcRa4xXLdAbnc';
const BACKEND_URL = 'http://localhost:4000';
const FRONTEND_URL = 'http://localhost:3000';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const results = {
  timestamp: new Date().toISOString(),
  frontend: {},
  backend: {},
  database: {},
  architecture: {},
  issues: [],
  recommendations: []
};

// Test Frontend Status
async function testFrontend() {
  console.log('📱 TESTING FRONTEND...');
  
  try {
    const response = await fetch(FRONTEND_URL, { timeout: 5000 });
    results.frontend.status = response.ok ? 'running' : 'error';
    results.frontend.port = 3000;
    results.frontend.framework = 'React + Vite';
    results.frontend.auth = 'Supabase Auth';
    
    console.log(`✅ Frontend: ${results.frontend.status} on port 3000`);
  } catch (error) {
    results.frontend.status = 'offline';
    results.frontend.error = error.message;
    console.log(`❌ Frontend: offline - ${error.message}`);
  }
}

// Test Backend Status
async function testBackend() {
  console.log('🔧 TESTING BACKEND...');
  
  try {
    const response = await fetch(`${BACKEND_URL}/health`, { timeout: 5000 });
    const health = await response.json();
    
    results.backend = {
      status: response.ok ? 'running' : 'error',
      port: 4000,
      framework: 'Express.js',
      health: health,
      dependencies: {
        database: health.database,
        redis: health.redis,
        supabase: health.supabase
      }
    };
    
    console.log(`✅ Backend: ${results.backend.status} on port 4000`);
    console.log(`   Database: ${health.database}`);
    console.log(`   Redis: ${health.redis}`);
    console.log(`   Supabase: ${health.supabase}`);
    
  } catch (error) {
    results.backend = {
      status: 'offline',
      error: error.message,
      port: 4000
    };
    console.log(`❌ Backend: offline - ${error.message}`);
  }
}

// Test Database Schema and Data
async function testDatabase() {
  console.log('🗄️ TESTING DATABASE...');
  
  try {
    // Test Supabase connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (connectionError) {
      throw new Error(`Connection failed: ${connectionError.message}`);
    }
    
    results.database.connection = 'connected';
    results.database.type = 'PostgreSQL (Supabase)';
    
    // Test each table
    const tables = ['users', 'events', 'tickets', 'payments', 'group_buys', 'referrals'];
    results.database.tables = {};
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          results.database.tables[table] = { status: 'error', error: error.message };
        } else {
          results.database.tables[table] = { status: 'exists', count: count || 0 };
        }
        
        console.log(`   ${table}: ${results.database.tables[table].status} (${count || 0} records)`);
      } catch (err) {
        results.database.tables[table] = { status: 'missing', error: err.message };
        console.log(`   ${table}: missing or inaccessible`);
      }
    }
    
    // Test RLS policies
    try {
      const { data: rlsTest, error: rlsError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      results.database.rls = rlsError ? 'blocking' : 'configured';
      console.log(`   RLS Policies: ${results.database.rls}`);
    } catch (err) {
      results.database.rls = 'unknown';
    }
    
  } catch (error) {
    results.database = {
      connection: 'failed',
      error: error.message
    };
    console.log(`❌ Database: ${error.message}`);
  }
}

// Analyze Architecture
async function analyzeArchitecture() {
  console.log('🏗️ ANALYZING ARCHITECTURE...');
  
  // Check if backend is actually needed
  const backendRoutes = [
    '/api/auth', '/api/events', '/api/tickets', '/api/payments',
    '/api/group-buy', '/api/notifications', '/api/ussd', '/api/referrals'
  ];
  
  results.architecture = {
    pattern: 'Hybrid (Frontend + Backend + Supabase)',
    frontend: 'React SPA with Supabase Auth',
    backend: 'Express.js API server',
    database: 'Supabase PostgreSQL',
    authentication: 'Supabase Auth',
    realtime: 'Supabase Realtime',
    storage: 'Supabase Storage (if used)',
    deployment: {
      frontend: 'Vercel',
      backend: 'Not deployed (localhost only)',
      database: 'Supabase Cloud'
    }
  };
  
  // Check for backend dependency
  let backendRequired = false;
  
  // Read frontend source to check for backend API calls
  try {
    const frontendSrc = 'apps/frontend/src';
    if (fs.existsSync(frontendSrc)) {
      const files = getAllFiles(frontendSrc, '.tsx');
      let backendCalls = 0;
      
      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('localhost:4000') || content.includes('api/')) {
          backendCalls++;
        }
      });
      
      backendRequired = backendCalls > 0;
    }
  } catch (err) {
    console.log('   Could not analyze frontend source');
  }
  
  results.architecture.backendRequired = backendRequired;
  
  console.log(`   Pattern: ${results.architecture.pattern}`);
  console.log(`   Backend Required: ${backendRequired ? 'Yes' : 'No'}`);
  console.log(`   Auth Method: ${results.architecture.authentication}`);
}

// Helper function to get all files
function getAllFiles(dir, ext) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    items.forEach(item => {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (fullPath.endsWith(ext)) {
        files.push(fullPath);
      }
    });
  }
  
  traverse(dir);
  return files;
}

// Identify Issues and Recommendations
function analyzeIssues() {
  console.log('⚠️ ANALYZING ISSUES...');
  
  // Check for common issues
  if (results.backend.status === 'offline') {
    results.issues.push({
      type: 'backend',
      severity: 'high',
      message: 'Backend server is not running',
      impact: 'API endpoints unavailable'
    });
  }
  
  if (results.database.connection === 'failed') {
    results.issues.push({
      type: 'database',
      severity: 'critical',
      message: 'Database connection failed',
      impact: 'No data persistence'
    });
  }
  
  if (results.backend.health?.supabase === 'disconnected') {
    results.issues.push({
      type: 'integration',
      severity: 'medium',
      message: 'Backend cannot connect to Supabase',
      impact: 'Real-time features may not work'
    });
  }
  
  // Architecture recommendations
  if (!results.architecture.backendRequired) {
    results.recommendations.push({
      type: 'architecture',
      priority: 'high',
      message: 'Consider going serverless with Supabase-only architecture',
      benefit: 'Simpler deployment, better scalability, lower costs'
    });
  }
  
  if (results.frontend.status === 'running' && results.backend.status === 'offline') {
    results.recommendations.push({
      type: 'deployment',
      priority: 'medium',
      message: 'Frontend works without backend - deploy as static site',
      benefit: 'Faster deployment, better reliability'
    });
  }
  
  console.log(`   Found ${results.issues.length} issues`);
  console.log(`   Generated ${results.recommendations.length} recommendations`);
}

// Generate Report
function generateReport() {
  console.log('\n📊 SYSTEM ANALYSIS REPORT');
  console.log('=' .repeat(50));
  
  console.log('\n🎯 OVERALL STATUS:');
  const overallHealth = 
    results.frontend.status === 'running' && 
    results.database.connection === 'connected' ? 'HEALTHY' : 'NEEDS ATTENTION';
  
  console.log(`   System Health: ${overallHealth}`);
  console.log(`   Frontend: ${results.frontend.status || 'unknown'}`);
  console.log(`   Backend: ${results.backend.status || 'unknown'}`);
  console.log(`   Database: ${results.database.connection || 'unknown'}`);
  
  console.log('\n🏗️ ARCHITECTURE:');
  console.log(`   Pattern: ${results.architecture.pattern}`);
  console.log(`   Authentication: ${results.architecture.authentication}`);
  console.log(`   Backend Required: ${results.architecture.backendRequired ? 'Yes' : 'No'}`);
  
  if (results.database.tables) {
    console.log('\n🗄️ DATABASE TABLES:');
    Object.entries(results.database.tables).forEach(([table, info]) => {
      console.log(`   ${table}: ${info.status} (${info.count || 0} records)`);
    });
  }
  
  if (results.issues.length > 0) {
    console.log('\n⚠️ ISSUES FOUND:');
    results.issues.forEach((issue, i) => {
      console.log(`   ${i + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);
      console.log(`      Impact: ${issue.impact}`);
    });
  }
  
  if (results.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    results.recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`);
      console.log(`      Benefit: ${rec.benefit}`);
    });
  }
  
  console.log('\n📄 DETAILED RESULTS:');
  console.log(JSON.stringify(results, null, 2));
}

// Main execution
async function runTests() {
  try {
    await testFrontend();
    await testBackend();
    await testDatabase();
    await analyzeArchitecture();
    analyzeIssues();
    generateReport();
    
    // Save results to file
    fs.writeFileSync('system-analysis-report.json', JSON.stringify(results, null, 2));
    console.log('\n💾 Report saved to: system-analysis-report.json');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

runTests();