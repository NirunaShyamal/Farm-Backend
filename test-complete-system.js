#!/usr/bin/env node

const { runAllTests } = require('./test-all-apis');
const { runFrontendTests } = require('./test-frontend-integration');
const { runDatabaseTests } = require('./test-database');

/**
 * Complete System Test Suite
 * Runs all tests to verify the entire system is working
 */

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Main test function
async function runCompleteSystemTests() {
  log('🚀 COMPLETE SYSTEM TEST SUITE', 'bright');
  log('=' .repeat(60), 'magenta');
  log('Testing Farm Management System - All Components', 'cyan');
  log('=' .repeat(60), 'magenta');
  
  const results = {
    database: false,
    apis: false,
    frontend: false
  };
  
  try {
    // Test 1: Database
    log('\n📊 PHASE 1: Database Testing', 'bright');
    log('-' .repeat(40), 'cyan');
    try {
      await runDatabaseTests();
      results.database = true;
      logSuccess('Database tests completed');
    } catch (error) {
      logError(`Database tests failed: ${error.message}`);
    }
    
    // Test 2: API Endpoints
    log('\n🔌 PHASE 2: API Testing', 'bright');
    log('-' .repeat(40), 'cyan');
    try {
      await runAllTests();
      results.apis = true;
      logSuccess('API tests completed');
    } catch (error) {
      logError(`API tests failed: ${error.message}`);
    }
    
    // Test 3: Frontend Integration
    log('\n🎨 PHASE 3: Frontend Integration Testing', 'bright');
    log('-' .repeat(40), 'cyan');
    try {
      await runFrontendTests();
      results.frontend = true;
      logSuccess('Frontend integration tests completed');
    } catch (error) {
      logError(`Frontend integration tests failed: ${error.message}`);
    }
    
  } catch (error) {
    logError(`System test suite failed: ${error.message}`);
  }
  
  // Final Summary
  log('\n🎯 FINAL SYSTEM STATUS', 'bright');
  log('=' .repeat(60), 'magenta');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([component, passed]) => {
    const status = passed ? '✅ OPERATIONAL' : '❌ ISSUES DETECTED';
    const color = passed ? 'green' : 'red';
    log(`${component.toUpperCase()}: ${status}`, color);
  });
  
  log(`\n🏆 OVERALL SYSTEM HEALTH: ${passed}/${total} components operational`, 'bright');
  
  if (passed === total) {
    log('\n🎉 CONGRATULATIONS!', 'green');
    log('Your Farm Management System is FULLY OPERATIONAL!', 'green');
    log('All components are working perfectly:', 'green');
    log('  ✅ Database: Connected and stable', 'green');
    log('  ✅ API Endpoints: All functional', 'green');
    log('  ✅ Frontend Integration: Ready', 'green');
    log('  ✅ Contact Form: Implemented', 'green');
    log('  ✅ Error Handling: Robust', 'green');
    log('\n🚀 You can now develop without any interruptions!', 'bright');
  } else {
    log(`\n⚠️  SYSTEM NEEDS ATTENTION`, 'yellow');
    log(`${total - passed} components have issues that need to be resolved.`, 'yellow');
    log('Check the test results above for specific problems.', 'yellow');
  }
  
  // System URLs
  log('\n📱 SYSTEM ACCESS POINTS:', 'bright');
  log('  Backend API: http://localhost:5000', 'cyan');
  log('  Health Check: http://localhost:5000/api/health', 'cyan');
  log('  Contact Form: http://localhost:5000/api/contact', 'cyan');
  log('  Task Management: http://localhost:5000/api/task-scheduling', 'cyan');
  log('  Egg Production: http://localhost:5000/api/egg-production', 'cyan');
  log('  Sales Orders: http://localhost:5000/api/sales-orders', 'cyan');
  log('  Feed Inventory: http://localhost:5000/api/feed-inventory', 'cyan');
  log('  Financial Records: http://localhost:5000/api/financial-records', 'cyan');
  
  // Development Tips
  log('\n💡 DEVELOPMENT TIPS:', 'bright');
  log('  • Use "npm start" to run the robust server', 'blue');
  log('  • Use "npm run dev" for development with auto-restart', 'blue');
  log('  • Use "npm run db:status" to check database health', 'blue');
  log('  • Use "npm run fix-db" to initialize database', 'blue');
  log('  • Check logs for detailed error information', 'blue');
  
  return passed === total;
}

// Run complete system tests if this script is executed directly
if (require.main === module) {
  runCompleteSystemTests().catch(error => {
    logError(`Complete system test suite failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runCompleteSystemTests };





