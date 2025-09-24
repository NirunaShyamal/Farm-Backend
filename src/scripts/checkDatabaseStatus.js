require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');

// Import all models
const EggProduction = require('../models/EggProduction');
const SalesOrder = require('../models/SalesOrder');
const FeedInventory = require('../models/FeedInventory');
const TaskScheduling = require('../models/TaskScheduling');
const FinancialRecord = require('../models/FinancialRecord');

/**
 * Database Status Check Script
 * This script checks the health and status of the database
 */

const checkDatabaseStatus = async () => {
  try {
    console.log('🔍 Checking database status...\n');
    
    // Connect to database
    await connectDB();
    
    // Get database information
    const dbInfo = await getDatabaseInfo();
    
    // Get collection statistics
    const collectionStats = await getCollectionStats();
    
    // Check for low stock items
    const lowStockItems = await checkLowStock();
    
    // Check for overdue tasks
    const overdueTasks = await checkOverdueTasks();
    
    // Check for pending orders
    const pendingOrders = await checkPendingOrders();
    
    // Display results
    displayStatusReport(dbInfo, collectionStats, lowStockItems, overdueTasks, pendingOrders);
    
    console.log('\n✅ Database status check completed!');
    
  } catch (error) {
    console.error('❌ Database status check failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

const getDatabaseInfo = async () => {
  try {
    const db = mongoose.connection.db;
    const admin = db.admin();
    
    // Get database stats
    const stats = await db.stats();
    
    // Get server info
    const serverInfo = await admin.serverStatus();
    
    return {
      name: db.databaseName,
      collections: stats.collections,
      dataSize: stats.dataSize,
      storageSize: stats.storageSize,
      indexes: stats.indexes,
      objects: stats.objects,
      serverVersion: serverInfo.version,
      uptime: serverInfo.uptime,
      connections: serverInfo.connections
    };
  } catch (error) {
    console.error('Error getting database info:', error);
    return null;
  }
};

const getCollectionStats = async () => {
  try {
    const collections = [
      { name: 'Egg Production', model: EggProduction },
      { name: 'Sales Orders', model: SalesOrder },
      { name: 'Feed Inventory', model: FeedInventory },
      { name: 'Task Scheduling', model: TaskScheduling },
      { name: 'Financial Records', model: FinancialRecord }
    ];
    
    const stats = [];
    
    for (const collection of collections) {
      const count = await collection.model.countDocuments();
      const latest = await collection.model.findOne().sort({ createdAt: -1 });
      
      stats.push({
        name: collection.name,
        count,
        latestRecord: latest ? latest.createdAt : null
      });
    }
    
    return stats;
  } catch (error) {
    console.error('Error getting collection stats:', error);
    return [];
  }
};

const checkLowStock = async () => {
  try {
    const lowStockItems = await FeedInventory.find({ isLowStock: true });
    return lowStockItems;
  } catch (error) {
    console.error('Error checking low stock:', error);
    return [];
  }
};

const checkOverdueTasks = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const overdueTasks = await TaskScheduling.find({
      date: { $lt: today },
      status: { $in: ['Pending', 'In Progress'] }
    });
    return overdueTasks;
  } catch (error) {
    console.error('Error checking overdue tasks:', error);
    return [];
  }
};

const checkPendingOrders = async () => {
  try {
    const pendingOrders = await SalesOrder.find({
      status: { $in: ['Pending', 'Processing'] }
    });
    return pendingOrders;
  } catch (error) {
    console.error('Error checking pending orders:', error);
    return [];
  }
};

const displayStatusReport = (dbInfo, collectionStats, lowStockItems, overdueTasks, pendingOrders) => {
  console.log('📊 DATABASE STATUS REPORT');
  console.log('=' .repeat(50));
  
  // Database Information
  if (dbInfo) {
    console.log('\n🗄️ DATABASE INFORMATION');
    console.log(`Database Name: ${dbInfo.name}`);
    console.log(`Server Version: ${dbInfo.serverVersion}`);
    console.log(`Collections: ${dbInfo.collections}`);
    console.log(`Total Documents: ${dbInfo.objects.toLocaleString()}`);
    console.log(`Data Size: ${formatBytes(dbInfo.dataSize)}`);
    console.log(`Storage Size: ${formatBytes(dbInfo.storageSize)}`);
    console.log(`Indexes: ${dbInfo.indexes}`);
    console.log(`Uptime: ${formatUptime(dbInfo.uptime)}`);
    console.log(`Active Connections: ${dbInfo.connections.current}`);
  }
  
  // Collection Statistics
  console.log('\n📋 COLLECTION STATISTICS');
  collectionStats.forEach(stat => {
    console.log(`${stat.name}: ${stat.count.toLocaleString()} records`);
    if (stat.latestRecord) {
      console.log(`  Latest: ${stat.latestRecord.toLocaleString()}`);
    }
  });
  
  // Alerts and Warnings
  console.log('\n⚠️ ALERTS & WARNINGS');
  
  if (lowStockItems.length > 0) {
    console.log(`🔴 Low Stock Items: ${lowStockItems.length}`);
    lowStockItems.forEach(item => {
      console.log(`  - ${item.type}: ${item.quantity} ${item.unit} (Threshold: ${item.minimumThreshold})`);
    });
  } else {
    console.log('✅ No low stock items');
  }
  
  if (overdueTasks.length > 0) {
    console.log(`🔴 Overdue Tasks: ${overdueTasks.length}`);
    overdueTasks.forEach(task => {
      console.log(`  - ${task.taskDescription} (Due: ${task.date})`);
    });
  } else {
    console.log('✅ No overdue tasks');
  }
  
  if (pendingOrders.length > 0) {
    console.log(`🟡 Pending Orders: ${pendingOrders.length}`);
    pendingOrders.forEach(order => {
      console.log(`  - ${order.orderNumber}: ${order.customerName} (${order.status})`);
    });
  } else {
    console.log('✅ No pending orders');
  }
  
  // Health Score
  const healthScore = calculateHealthScore(collectionStats, lowStockItems, overdueTasks, pendingOrders);
  console.log(`\n🏥 HEALTH SCORE: ${healthScore}/100`);
  
  if (healthScore >= 90) {
    console.log('🟢 Database is in excellent condition!');
  } else if (healthScore >= 70) {
    console.log('🟡 Database is in good condition with minor issues.');
  } else if (healthScore >= 50) {
    console.log('🟠 Database needs attention - some issues detected.');
  } else {
    console.log('🔴 Database requires immediate attention!');
  }
};

const calculateHealthScore = (collectionStats, lowStockItems, overdueTasks, pendingOrders) => {
  let score = 100;
  
  // Deduct points for issues
  score -= lowStockItems.length * 5; // 5 points per low stock item
  score -= overdueTasks.length * 10; // 10 points per overdue task
  score -= pendingOrders.length * 2; // 2 points per pending order
  
  // Check if collections have data
  const emptyCollections = collectionStats.filter(stat => stat.count === 0).length;
  score -= emptyCollections * 15; // 15 points per empty collection
  
  return Math.max(0, Math.min(100, score));
};

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatUptime = (seconds) => {
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
};

// CLI interface
const main = async () => {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔍 Farm Management Database Status Checker

Usage:
  node checkDatabaseStatus.js [options]

Options:
  --help, -h     Show this help message

This script provides a comprehensive health check of the database including:
- Database connection and basic info
- Collection statistics
- Low stock alerts
- Overdue tasks
- Pending orders
- Overall health score

Examples:
  node checkDatabaseStatus.js
  npm run db:status
    `);
    return;
  }
  
  await checkDatabaseStatus();
};

// Run if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = { checkDatabaseStatus };
