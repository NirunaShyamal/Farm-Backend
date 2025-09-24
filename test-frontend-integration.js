#!/usr/bin/env node

const axios = require('axios');

/**
 * Frontend Integration Test Script
 * Tests API endpoints that the frontend will use
 */

const BASE_URL = 'http://localhost:5000/api';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
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

// Test frontend integration endpoints
async function testFrontendIntegration() {
  log('🎨 Testing Frontend Integration', 'bright');
  log('=' .repeat(40), 'cyan');
  
  const endpoints = [
    { name: 'Health Check', url: '/health', method: 'GET' },
    { name: 'Get Tasks', url: '/task-scheduling', method: 'GET' },
    { name: 'Get Egg Production', url: '/egg-production', method: 'GET' },
    { name: 'Get Sales Orders', url: '/sales-orders', method: 'GET' },
    { name: 'Get Feed Inventory', url: '/feed-inventory', method: 'GET' },
    { name: 'Get Financial Records', url: '/financial-records', method: 'GET' },
    { name: 'Task Summary', url: '/task-scheduling/summary', method: 'GET' },
    { name: 'Egg Production Summary', url: '/egg-production/summary', method: 'GET' },
    { name: 'Sales Summary', url: '/sales-orders/summary', method: 'GET' },
    { name: 'Feed Inventory Summary', url: '/feed-inventory/summary', method: 'GET' },
    { name: 'Financial Summary', url: '/financial-records/summary', method: 'GET' }
  ];
  
  let passed = 0;
  let total = endpoints.length;
  
  for (const endpoint of endpoints) {
    try {
      logInfo(`Testing ${endpoint.name}...`);
      
      const response = await axios({
        method: endpoint.method,
        url: `${BASE_URL}${endpoint.url}`,
        timeout: 5000
      });
      
      if (response.status === 200) {
        logSuccess(`${endpoint.name}: Working`);
        passed++;
      } else {
        logError(`${endpoint.name}: Unexpected status ${response.status}`);
      }
    } catch (error) {
      logError(`${endpoint.name}: ${error.response?.data?.message || error.message}`);
    }
  }
  
  log(`\n📊 Frontend Integration Results: ${passed}/${total} endpoints working`, 'bright');
  
  if (passed === total) {
    log('🎉 All frontend endpoints are ready!', 'green');
  } else {
    log(`⚠️  ${total - passed} endpoints need attention.`, 'yellow');
  }
  
  return passed === total;
}

// Test CORS configuration
async function testCORS() {
  log('\n🌐 Testing CORS Configuration', 'bright');
  log('=' .repeat(40), 'cyan');
  
  try {
    const response = await axios.get(`${BASE_URL}/health`, {
      headers: {
        'Origin': 'http://localhost:5173'
      }
    });
    
    const corsHeaders = response.headers;
    
    if (corsHeaders['access-control-allow-origin']) {
      logSuccess('CORS: Configured for frontend');
    } else {
      logWarning('CORS: No origin header found');
    }
    
    if (corsHeaders['access-control-allow-credentials']) {
      logSuccess('CORS: Credentials allowed');
    }
    
    return true;
  } catch (error) {
    logError(`CORS test failed: ${error.message}`);
    return false;
  }
}

// Main test function
async function runFrontendTests() {
  log('🚀 Frontend Integration Test Suite', 'bright');
  log('=' .repeat(50), 'cyan');
  
  const integrationTest = await testFrontendIntegration();
  const corsTest = await testCORS();
  
  log('\n📋 Frontend Readiness Summary:', 'bright');
  
  if (integrationTest && corsTest) {
    log('✅ Frontend Integration: Ready', 'green');
    log('✅ CORS Configuration: Working', 'green');
    log('✅ API Endpoints: All functional', 'green');
    log('\n🎯 Your frontend can now connect to the backend!', 'bright');
  } else {
    log('⚠️  Some frontend integration issues detected', 'yellow');
  }
  
  log('\n📱 Frontend URLs to test:', 'bright');
  log('   Health Check: http://localhost:5000/api/health', 'cyan');
  log('   Tasks: http://localhost:5000/api/task-scheduling', 'cyan');
  log('   Egg Production: http://localhost:5000/api/egg-production', 'cyan');
  log('   Sales Orders: http://localhost:5000/api/sales-orders', 'cyan');
  log('   Feed Inventory: http://localhost:5000/api/feed-inventory', 'cyan');
  log('   Financial Records: http://localhost:5000/api/financial-records', 'cyan');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runFrontendTests().catch(error => {
    logError(`Frontend test suite failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runFrontendTests };





