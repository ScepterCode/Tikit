#!/usr/bin/env node

/**
 * Tikit System Analysis - Backend and Database State
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 TIKIT SYSTEM ANALYSIS');
console.log('=' .repeat(50));

const analysis = {
  timestamp: new Date().toISOString(),
  architecture: {},
  backend: {},
  database: {},
  frontend: {},
  deployment: {},
  issues: [],
  recommendations: []
};

// Analyze Project Structure
function analyzeProjectStructure() {
  console.log('\n📁 PROJECT STRUCTURE ANALYSIS:');
  
  const structure = {
    hasBackend: fs.existsSync('apps/backend'),
    hasFrontend: fs.existsSync('apps/frontend'),
    hasDatabase: fs.existsSync('apps/backend/prisma') || fs.existsSync('apps/backend/src/scripts/supabase-schema.sql'),
    hasTests: fs.existsSync('apps/frontend/tests'),
    hasDocumentation: fs.existsSync('README.md')
  };
  
  analysis.architecture.structure = structure;
  
  console.log(`   Backend: ${structure.hasBackend ? '✅ Present' : '❌ Missing'}`);
  console.log(`   Frontend: ${structure.hasFrontend ? '✅ Present' : '❌ Missing'}`);
  console.log(`   Database: ${structure.hasDatabase ? '✅ Present' : '❌ Missing'}`);
  console.log(`   Tests: ${structure.hasTests ? '✅ Present' : '❌ Missing'}`);
}

// Analyze Backend Configuration
function analyzeBackend() {
  console.log('\n🔧 BACKEND ANALYSIS:');
  
  try {
    // Read package.json
    const backendPackage = JSON.parse(fs.readFileSync('apps/backend/package.json', 'utf8'));
    
    analysis.backend = {
      framework: 'Express.js',
      version: backendPackage.version,
      dependencies: Object.keys(backendPackage.dependencies || {}),
      scripts: backendPackage.scripts,
      type: backendPackage.type || 'commonjs'
    };
    
    console.log(`   Framework: ${analysis.backend.framework}`);
    console.log(`   Version: ${analysis.backend.version}`);
    console.log(`   Module Type: ${analysis.backend.type}`);
    console.log(`   Dependencies: ${analysis.backend.dependencies.length} packages`);
    
    // Check for key dependencies
    const keyDeps = ['express', '@supabase/supabase-js', '@prisma/client', 'redis'];
    keyDeps.forEach(dep => {
      const hasIt = analysis.backend.dependencies.includes(dep);
      console.log(`     ${dep}: ${hasIt ? '✅' : '❌'}`);
    });
    
    // Analyze routes
    const routesDir = 'apps/backend/src/routes';
    if (fs.existsSync(routesDir)) {
      const routes = fs.readdirSync(routesDir).filter(f => f.endsWith('.ts'));
      analysis.backend.routes = routes.map(r => r.replace('.routes.ts', ''));
      console.log(`   API Routes: ${analysis.backend.routes.length} modules`);
      analysis.backend.routes.forEach(route => {
        console.log(`     /api/${route}`);
      });
    }
    
  } catch (error) {
    analysis.backend.error = error.message;
    console.log(`   ❌ Error analyzing backend: ${error.message}`);
  }
}

// Analyze Database Configuration
function analyzeDatabase() {
  console.log('\n🗄️ DATABASE ANALYSIS:');
  
  try {
    // Check for Supabase schema
    const supabaseSchema = 'apps/backend/src/scripts/supabase-schema.sql';
    if (fs.existsSync(supabaseSchema)) {
      const schema = fs.readFileSync(supabaseSchema, 'utf8');
      
      // Extract table names
      const tableMatches = schema.match(/CREATE TABLE IF NOT EXISTS (\w+)/g) || [];
      const tables = tableMatches.map(match => match.replace('CREATE TABLE IF NOT EXISTS ', ''));
      
      // Extract indexes
      const indexMatches = schema.match(/CREATE INDEX IF NOT EXISTS/g) || [];
      
      // Extract RLS policies
      const rlsMatches = schema.match(/CREATE POLICY/g) || [];
      
      analysis.database = {
        type: 'PostgreSQL (Supabase)',
        schema: 'supabase-schema.sql',
        tables: tables,
        tableCount: tables.length,
        indexes: indexMatches.length,
        rlsPolicies: rlsMatches.length,
        features: {
          rls: schema.includes('ROW LEVEL SECURITY'),
          triggers: schema.includes('CREATE TRIGGER'),
          functions: schema.includes('CREATE OR REPLACE FUNCTION'),
          extensions: schema.includes('CREATE EXTENSION')
        }
      };
      
      console.log(`   Type: ${analysis.database.type}`);
      console.log(`   Tables: ${analysis.database.tableCount}`);
      console.log(`   Indexes: ${analysis.database.indexes}`);
      console.log(`   RLS Policies: ${analysis.database.rlsPolicies}`);
      console.log(`   Features:`);
      Object.entries(analysis.database.features).forEach(([feature, enabled]) => {
        console.log(`     ${feature.toUpperCase()}: ${enabled ? '✅' : '❌'}`);
      });
      
      console.log(`   Tables:`);
      tables.forEach(table => {
        console.log(`     - ${table}`);
      });
    }
    
    // Check for Prisma
    const prismaSchema = 'apps/backend/prisma/schema.prisma';
    if (fs.existsSync(prismaSchema)) {
      analysis.database.orm = 'Prisma';
      console.log(`   ORM: Prisma (schema.prisma found)`);
    }
    
  } catch (error) {
    analysis.database.error = error.message;
    console.log(`   ❌ Error analyzing database: ${error.message}`);
  }
}

// Analyze Frontend Configuration
function analyzeFrontend() {
  console.log('\n📱 FRONTEND ANALYSIS:');
  
  try {
    const frontendPackage = JSON.parse(fs.readFileSync('apps/frontend/package.json', 'utf8'));
    
    analysis.frontend = {
      framework: 'React',
      bundler: 'Vite',
      version: frontendPackage.version,
      dependencies: Object.keys(frontendPackage.dependencies || {}),
      scripts: frontendPackage.scripts
    };
    
    console.log(`   Framework: ${analysis.frontend.framework}`);
    console.log(`   Bundler: ${analysis.frontend.bundler}`);
    console.log(`   Version: ${analysis.frontend.version}`);
    
    // Check for key frontend dependencies
    const keyDeps = ['react', '@supabase/supabase-js', 'react-router-dom'];
    keyDeps.forEach(dep => {
      const hasIt = analysis.frontend.dependencies.includes(dep);
      console.log(`     ${dep}: ${hasIt ? '✅' : '❌'}`);
    });
    
    // Check authentication setup
    const authContexts = [];
    const contextsDir = 'apps/frontend/src/contexts';
    if (fs.existsSync(contextsDir)) {
      const contexts = fs.readdirSync(contextsDir).filter(f => f.includes('Auth'));
      authContexts.push(...contexts);
    }
    
    analysis.frontend.authContexts = authContexts;
    console.log(`   Auth Contexts: ${authContexts.length}`);
    authContexts.forEach(ctx => {
      console.log(`     - ${ctx}`);
    });
    
  } catch (error) {
    analysis.frontend.error = error.message;
    console.log(`   ❌ Error analyzing frontend: ${error.message}`);
  }
}

// Analyze Deployment Configuration
function analyzeDeployment() {
  console.log('\n🚀 DEPLOYMENT ANALYSIS:');
  
  const deploymentFiles = {
    vercel: fs.existsSync('vercel.json'),
    netlify: fs.existsSync('netlify.toml'),
    docker: fs.existsSync('Dockerfile'),
    github: fs.existsSync('.github/workflows'),
    render: fs.existsSync('apps/backend/render.yaml')
  };
  
  analysis.deployment = deploymentFiles;
  
  console.log(`   Vercel: ${deploymentFiles.vercel ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   Netlify: ${deploymentFiles.netlify ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   Docker: ${deploymentFiles.docker ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   GitHub Actions: ${deploymentFiles.github ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   Render: ${deploymentFiles.render ? '✅ Configured' : '❌ Not configured'}`);
  
  // Check environment files
  const envFiles = {
    frontendLocal: fs.existsSync('apps/frontend/.env.local'),
    frontendProd: fs.existsSync('apps/frontend/.env.production'),
    backendLocal: fs.existsSync('apps/backend/.env'),
    backendProd: fs.existsSync('apps/backend/.env.production')
  };
  
  console.log(`   Environment Files:`);
  Object.entries(envFiles).forEach(([file, exists]) => {
    console.log(`     ${file}: ${exists ? '✅' : '❌'}`);
  });
}

// Identify Issues and Generate Recommendations
function analyzeIssuesAndRecommendations() {
  console.log('\n⚠️ ISSUES & RECOMMENDATIONS:');
  
  // Check for common issues
  if (analysis.backend.dependencies && !analysis.backend.dependencies.includes('@supabase/supabase-js')) {
    analysis.issues.push({
      type: 'backend',
      severity: 'medium',
      message: 'Backend missing Supabase integration'
    });
  }
  
  if (analysis.frontend.authContexts && analysis.frontend.authContexts.length > 1) {
    analysis.issues.push({
      type: 'frontend',
      severity: 'low',
      message: 'Multiple auth contexts detected - may cause confusion'
    });
  }
  
  // Generate recommendations
  if (analysis.database.type === 'PostgreSQL (Supabase)') {
    analysis.recommendations.push({
      type: 'architecture',
      priority: 'high',
      message: 'Consider serverless architecture with Supabase-only backend',
      benefit: 'Simplified deployment and better scalability'
    });
  }
  
  if (analysis.deployment.vercel && !analysis.deployment.render) {
    analysis.recommendations.push({
      type: 'deployment',
      priority: 'medium',
      message: 'Frontend configured for Vercel but backend not deployed',
      benefit: 'Deploy backend or go serverless for full functionality'
    });
  }
  
  console.log(`   Issues Found: ${analysis.issues.length}`);
  analysis.issues.forEach((issue, i) => {
    console.log(`     ${i + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);
  });
  
  console.log(`   Recommendations: ${analysis.recommendations.length}`);
  analysis.recommendations.forEach((rec, i) => {
    console.log(`     ${i + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`);
  });
}

// Generate Summary
function generateSummary() {
  console.log('\n📊 SYSTEM SUMMARY:');
  console.log('=' .repeat(50));
  
  const status = {
    backend: analysis.backend.framework ? 'Configured' : 'Missing',
    frontend: analysis.frontend.framework ? 'Configured' : 'Missing',
    database: analysis.database.type ? 'Configured' : 'Missing',
    deployment: Object.values(analysis.deployment).some(Boolean) ? 'Configured' : 'Missing'
  };
  
  console.log(`   Backend: ${status.backend}`);
  console.log(`   Frontend: ${status.frontend}`);
  console.log(`   Database: ${status.database}`);
  console.log(`   Deployment: ${status.deployment}`);
  
  const overallHealth = Object.values(status).every(s => s === 'Configured') ? 'EXCELLENT' : 
                       Object.values(status).filter(s => s === 'Configured').length >= 3 ? 'GOOD' : 'NEEDS WORK';
  
  console.log(`\n   Overall Health: ${overallHealth}`);
  
  // Architecture assessment
  const isFullStack = analysis.backend.framework && analysis.frontend.framework && analysis.database.type;
  const isServerless = analysis.frontend.framework && analysis.database.type && !analysis.backend.framework;
  
  console.log(`   Architecture: ${isFullStack ? 'Full-Stack' : isServerless ? 'Serverless' : 'Incomplete'}`);
  
  return analysis;
}

// Main execution
function runAnalysis() {
  try {
    analyzeProjectStructure();
    analyzeBackend();
    analyzeDatabase();
    analyzeFrontend();
    analyzeDeployment();
    analyzeIssuesAndRecommendations();
    const results = generateSummary();
    
    // Save results
    fs.writeFileSync('system-analysis-report.json', JSON.stringify(results, null, 2));
    console.log('\n💾 Detailed report saved to: system-analysis-report.json');
    
    return results;
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    return null;
  }
}

// Run the analysis
runAnalysis();