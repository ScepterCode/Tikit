#!/usr/bin/env node

/**
 * Backend Integration Audit Script
 * Checks that all frontend components use FastAPI backend and not old Express or direct Supabase calls
 */

const fs = require('fs');
const path = require('path');

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

const log = {
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`${colors.cyan}🔍 ${msg}${colors.reset}`)
};

// Patterns to detect different backend integrations
const patterns = {
  // FastAPI integration (GOOD)
  fastapi: [
    /apiService\./g,
    /from ['"]\.\.\/services\/api['"]/g,
    /import.*apiService/g,
    /FastAPIAuthContext/g,
    /useFastAPIAuth/g,
    /VITE_API_BASE_URL/g
  ],
  
  // Old Express backend (BAD)
  express: [
    /localhost:4000/g,
    /http:\/\/localhost:4000/g,
    /fetch\(['"`]http:\/\/localhost:4000/g,
    /axios\.get\(['"`]http:\/\/localhost:4000/g,
    /axios\.post\(['"`]http:\/\/localhost:4000/g
  ],
  
  // Direct Supabase backend calls (BAD - should only be for real-time)
  supabaseBackend: [
    /supabase\.from\(['"`]users['"`]\)\.insert/g,
    /supabase\.from\(['"`]events['"`]\)\.insert/g,
    /supabase\.from\(['"`]tickets['"`]\)\.insert/g,
    /supabase\.from\(['"`]payments['"`]\)\.insert/g,
    /supabase\.from\(['"`]users['"`]\)\.update/g,
    /supabase\.from\(['"`]events['"`]\)\.update/g,
    /supabase\.from\(['"`]tickets['"`]\)\.update/g,
    /supabase\.from\(['"`]payments['"`]\)\.update/g,
    /supabase\.from\(['"`]users['"`]\)\.delete/g,
    /supabase\.from\(['"`]events['"`]\)\.delete/g,
    /supabase\.from\(['"`]tickets['"`]\)\.delete/g,
    /supabase\.from\(['"`]payments['"`]\)\.delete/g
  ],
  
  // Acceptable Supabase usage (GOOD - real-time only)
  supabaseRealtime: [
    /supabase\.channel/g,
    /supabase\.from.*\.on\(/g,
    /supabase\.auth\./g,
    /supabase\.from.*\.select.*\.subscribe/g
  ]
};

// Files to check
const frontendDir = 'apps/frontend/src';

// Recursively find all TypeScript/JavaScript files
function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  if (!fs.existsSync(dir)) {
    log.error(`Directory not found: ${dir}`);
    return files;
  }
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and other irrelevant directories
      if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
        files.push(...findFiles(fullPath, extensions));
      }
    } else if (extensions.some(ext => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Check a file for patterns
function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(process.cwd(), filePath);
  
  const results = {
    file: relativePath,
    fastapi: [],
    express: [],
    supabaseBackend: [],
    supabaseRealtime: [],
    issues: []
  };
  
  // Check for FastAPI integration
  patterns.fastapi.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      results.fastapi.push(...matches);
    }
  });
  
  // Check for old Express backend calls
  patterns.express.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      results.express.push(...matches);
    }
  });
  
  // Check for direct Supabase backend calls
  patterns.supabaseBackend.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      results.supabaseBackend.push(...matches);
    }
  });
  
  // Check for acceptable Supabase real-time usage
  patterns.supabaseRealtime.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      results.supabaseRealtime.push(...matches);
    }
  });
  
  // Determine issues
  if (results.express.length > 0) {
    results.issues.push('Uses old Express backend');
  }
  
  if (results.supabaseBackend.length > 0) {
    results.issues.push('Makes direct Supabase backend calls');
  }
  
  if (results.fastapi.length === 0 && (results.express.length > 0 || results.supabaseBackend.length > 0)) {
    results.issues.push('Not using FastAPI integration');
  }
  
  return results;
}

// Main audit function
function runAudit() {
  log.header('Backend Integration Audit');
  console.log('='.repeat(50));
  
  // Find all files to check
  const files = findFiles(frontendDir);
  log.info(`Found ${files.length} files to check`);
  
  const results = {
    total: files.length,
    clean: 0,
    issues: 0,
    details: []
  };
  
  // Check each file
  files.forEach(file => {
    const fileResult = checkFile(file);
    results.details.push(fileResult);
    
    if (fileResult.issues.length === 0) {
      results.clean++;
    } else {
      results.issues++;
    }
  });
  
  // Report results
  console.log('\n' + '='.repeat(50));
  log.header('AUDIT RESULTS');
  console.log('='.repeat(50));
  
  log.info(`Total files checked: ${results.total}`);
  log.success(`Clean files: ${results.clean}`);
  
  if (results.issues > 0) {
    log.error(`Files with issues: ${results.issues}`);
  } else {
    log.success('No issues found!');
  }
  
  // Detailed results
  console.log('\n' + colors.cyan + '📋 DETAILED RESULTS' + colors.reset);
  console.log('='.repeat(50));
  
  // Group results by category
  const categories = {
    clean: [],
    expressIssues: [],
    supabaseIssues: [],
    noFastAPI: []
  };
  
  results.details.forEach(detail => {
    if (detail.issues.length === 0) {
      categories.clean.push(detail);
    } else {
      if (detail.express.length > 0) {
        categories.expressIssues.push(detail);
      }
      if (detail.supabaseBackend.length > 0) {
        categories.supabaseIssues.push(detail);
      }
      if (detail.fastapi.length === 0 && detail.issues.length > 0) {
        categories.noFastAPI.push(detail);
      }
    }
  });
  
  // Report Express backend issues
  if (categories.expressIssues.length > 0) {
    console.log(`\n${colors.red}🚨 FILES USING OLD EXPRESS BACKEND:${colors.reset}`);
    categories.expressIssues.forEach(detail => {
      console.log(`  ${colors.red}❌ ${detail.file}${colors.reset}`);
      detail.express.forEach(match => {
        console.log(`    - ${match}`);
      });
    });
  }
  
  // Report direct Supabase backend issues
  if (categories.supabaseIssues.length > 0) {
    console.log(`\n${colors.yellow}⚠️  FILES MAKING DIRECT SUPABASE BACKEND CALLS:${colors.reset}`);
    categories.supabaseIssues.forEach(detail => {
      console.log(`  ${colors.yellow}⚠️  ${detail.file}${colors.reset}`);
      detail.supabaseBackend.forEach(match => {
        console.log(`    - ${match}`);
      });
    });
  }
  
  // Report files not using FastAPI
  if (categories.noFastAPI.length > 0) {
    console.log(`\n${colors.magenta}🔄 FILES NOT USING FASTAPI INTEGRATION:${colors.reset}`);
    categories.noFastAPI.forEach(detail => {
      console.log(`  ${colors.magenta}🔄 ${detail.file}${colors.reset}`);
      detail.issues.forEach(issue => {
        console.log(`    - ${issue}`);
      });
    });
  }
  
  // Report clean files using FastAPI
  const fastapiFiles = results.details.filter(d => d.fastapi.length > 0);
  if (fastapiFiles.length > 0) {
    console.log(`\n${colors.green}✅ FILES PROPERLY USING FASTAPI:${colors.reset}`);
    fastapiFiles.forEach(detail => {
      console.log(`  ${colors.green}✅ ${detail.file}${colors.reset}`);
    });
  }
  
  // Report files with acceptable Supabase usage
  const realtimeFiles = results.details.filter(d => d.supabaseRealtime.length > 0);
  if (realtimeFiles.length > 0) {
    console.log(`\n${colors.blue}🔄 FILES USING SUPABASE FOR REAL-TIME (ACCEPTABLE):${colors.reset}`);
    realtimeFiles.forEach(detail => {
      console.log(`  ${colors.blue}🔄 ${detail.file}${colors.reset}`);
    });
  }
  
  // Summary and recommendations
  console.log('\n' + '='.repeat(50));
  log.header('SUMMARY & RECOMMENDATIONS');
  console.log('='.repeat(50));
  
  if (results.issues === 0) {
    log.success('🎉 All files are properly integrated with FastAPI!');
    log.info('Your frontend is correctly using the FastAPI backend for all operations.');
  } else {
    log.warning(`Found ${results.issues} files that need attention.`);
    
    if (categories.expressIssues.length > 0) {
      log.error('ACTION REQUIRED: Update files using old Express backend');
      console.log('  - Replace direct API calls with apiService methods');
      console.log('  - Update authentication to use FastAPIAuthContext');
      console.log('  - Remove localhost:4000 references');
    }
    
    if (categories.supabaseIssues.length > 0) {
      log.warning('REVIEW NEEDED: Files making direct Supabase calls');
      console.log('  - Move CRUD operations to FastAPI backend');
      console.log('  - Keep only real-time subscriptions in Supabase');
      console.log('  - Use apiService for data operations');
    }
    
    if (categories.noFastAPI.length > 0) {
      log.info('INTEGRATION NEEDED: Files not using FastAPI');
      console.log('  - Import and use apiService for API calls');
      console.log('  - Update authentication context');
      console.log('  - Follow the FastAPI integration pattern');
    }
  }
  
  // Configuration check
  console.log('\n' + colors.cyan + '⚙️  CONFIGURATION CHECK' + colors.reset);
  console.log('='.repeat(50));
  
  // Check environment files
  const envFiles = [
    'apps/frontend/.env.local',
    'apps/frontend/.env.production'
  ];
  
  envFiles.forEach(envFile => {
    if (fs.existsSync(envFile)) {
      const envContent = fs.readFileSync(envFile, 'utf8');
      if (envContent.includes('VITE_API_BASE_URL')) {
        log.success(`${envFile} has FastAPI configuration`);
      } else {
        log.warning(`${envFile} missing VITE_API_BASE_URL`);
      }
    } else {
      log.warning(`${envFile} not found`);
    }
  });
  
  // Check App.tsx for correct auth provider
  const appFile = 'apps/frontend/src/App.tsx';
  if (fs.existsSync(appFile)) {
    const appContent = fs.readFileSync(appFile, 'utf8');
    if (appContent.includes('FastAPIAuthProvider')) {
      log.success('App.tsx uses FastAPIAuthProvider');
    } else if (appContent.includes('SupabaseAuthContext')) {
      log.warning('App.tsx still uses SupabaseAuthContext - should use FastAPIAuthProvider');
    } else {
      log.error('App.tsx missing authentication provider');
    }
  }
  
  return results.issues === 0;
}

// Export for use in other scripts
module.exports = { runAudit };

// Run if called directly
if (require.main === module) {
  const success = runAudit();
  process.exit(success ? 0 : 1);
}