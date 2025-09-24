#!/usr/bin/env node

const mongoose = require('mongoose');
const connectDB = require('./src/config/database');

// Import all models
const EggProduction = require('./src/models/EggProduction');
const SalesOrder = require('./src/models/SalesOrder');
const FeedInventory = require('./src/models/FeedInventory');
const TaskScheduling = require('./src/models/TaskScheduling');
const FinancialRecord = require('./src/models/FinancialRecord');

/**
 * Database Testing Script
 * Tests database connectivity and operations
 */

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

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Test database connection
async function testDatabaseConnection() {
  try {
    logInfo('Testing database connection...');
    await connectDB();
    
    const db = mongoose.connection.db;
    const admin = db.admin();
    
    // Get database stats
    const stats = await db.stats();
    const serverInfo = await admin.serverStatus();
    
    logSuccess('Database connection: Working');
    logInfo(`Database: ${db.databaseName}`);
    logInfo(`Collections: ${stats.collections}`);
    logInfo(`Documents: ${stats.objects.toLocaleString()}`);
    logInfo(`Data Size: ${formatBytes(stats.dataSize)}`);
    logInfo(`Server Version: ${serverInfo.version}`);
    logInfo(`Uptime: ${formatUptime(serverInfo.uptime)}`);
    
    return true;
  } catch (error) {
    logError(`Database connection failed: ${error.message}`);
    return false;
  }
}

// Test model operations
async function testModelOperations() {
  try {
    logInfo('Testing model operations...');
    
    const models = [
      { name: 'EggProduction', model: EggProduction },
      { name: 'SalesOrder', model: SalesOrder },
      { name: 'FeedInventory', model: FeedInventory },
      { name: 'TaskScheduling', model: TaskScheduling },
      { name: 'FinancialRecord', model: FinancialRecord }
    ];
    
    for (const { name, model } of models) {
      try {
        // Test count operation
        const count = await model.countDocuments();
        logSuccess(`${name}: ${count} documents`);
        
        // Test find operation
        const sample = await model.findOne();
        if (sample) {
          logInfo(`${name}: Sample document found`);
        } else {
          logWarning(`${name}: No documents found`);
        }
      } catch (error) {
        logError(`${name}: ${error.message}`);
      }
    }
    
    return true;
  } catch (error) {
    logError(`Model operations failed: ${error.message}`);
    return false;
  }
}

// Test database indexes
async function testDatabaseIndexes() {
  try {
    logInfo('Testing database indexes...');
    
    const collections = [
      { name: 'EggProduction', model: EggProduction },
      { name: 'SalesOrder', model: SalesOrder },
      { name: 'FeedInventory', model: FeedInventory },
      { name: 'TaskScheduling', model: TaskScheduling },
      { name: 'FinancialRecord', model: FinancialRecord }
    ];
    
    for (const { name, model } of collections) {
      try {
        const indexes = await model.collection.getIndexes();
        logSuccess(`${name}: ${Object.keys(indexes).length} indexes`);
      } catch (error) {
        logError(`${name} indexes: ${error.message}`);
      }
    }
    
    return true;
  } catch (error) {
    logError(`Index testing failed: ${error.message}`);
    return false;
  }
}

// Test sample data creation
async function testSampleDataCreation() {
  try {
    logInfo('Testing sample data creation...');
    
    // Test task creation
    const testTask = new TaskScheduling({
      date: '2024-01-17',
      taskDescription: 'Database Test Task',
      category: 'Cleaning & Maintenance',
      assignedTo: 'Test Worker',
      assignedToContact: '+1234567890',
      time: '10:00',
      estimatedDuration: 60,
      status: 'Pending',
      priority: 'Medium',
      location: 'Test Location',
      equipment: ['Test Equipment'],
      notes: 'This is a test task created by the database test script.'
    });
    
    const savedTask = await testTask.save();
    logSuccess(`Test task created: ${savedTask._id}`);
    
    // Clean up test data
    await TaskScheduling.findByIdAndDelete(savedTask._id);
    logInfo('Test task cleaned up');
    
    return true;
  } catch (error) {
    logError(`Sample data creation failed: ${error.message}`);
    return false;
  }
}

// Test database performance
async function testDatabasePerformance() {
  try {
    logInfo('Testing database performance...');
    
    const startTime = Date.now();
    
    // Test multiple queries
    await Promise.all([
      TaskScheduling.countDocuments(),
      EggProduction.countDocuments(),
      SalesOrder.countDocuments(),
      FeedInventory.countDocuments(),
      FinancialRecord.countDocuments()
    ]);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (duration < 1000) {
      logSuccess(`Database performance: Good (${duration}ms)`);
    } else if (duration < 3000) {
      logWarning(`Database performance: Acceptable (${duration}ms)`);
    } else {
      logError(`Database performance: Slow (${duration}ms)`);
    }
    
    return true;
  } catch (error) {
    logError(`Performance test failed: ${error.message}`);
    return false;
  }
}

// Utility functions
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

// Main test function
async function runDatabaseTests() {
  log('🗄️ Database Testing Suite', 'bright');
  log('=' .repeat(50), 'cyan');
  
  const results = {
    connection: false,
    modelOperations: false,
    indexes: false,
    sampleData: false,
    performance: false
  };
  
  // Run all tests
  results.connection = await testDatabaseConnection();
  results.modelOperations = await testModelOperations();
  results.indexes = await testDatabaseIndexes();
  results.sampleData = await testSampleDataCreation();
  results.performance = await testDatabasePerformance();
  
  // Summary
  log('\n📊 Database Test Results', 'bright');
  log('=' .repeat(50), 'cyan');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const color = passed ? 'green' : 'red';
    log(`${test}: ${status}`, color);
  });
  
  log(`\n🎯 Database Health Score: ${passed}/${total} tests passed`, 'bright');
  
  if (passed === total) {
    log('🎉 Database is fully operational!', 'green');
  } else {
    log(`⚠️  ${total - passed} database issues detected.`, 'yellow');
  }
  
  // Close database connection
  await mongoose.connection.close();
  logInfo('Database connection closed');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runDatabaseTests().catch(error => {
    logError(`Database test suite failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runDatabaseTests };


