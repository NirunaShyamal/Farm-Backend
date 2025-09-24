const mongoose = require('mongoose');
const connectDB = require('../config/database');

// Import all models to ensure they are registered
const EggProduction = require('../models/EggProduction');
const SalesOrder = require('../models/SalesOrder');
const FeedInventory = require('../models/FeedInventory');
const TaskScheduling = require('../models/TaskScheduling');
const FinancialRecord = require('../models/FinancialRecord');

/**
 * Database Initialization Script
 * This script initializes the database with proper indexes and sample data
 */

const initializeDatabase = async () => {
  try {
    console.log('🔄 Starting database initialization...');
    
    // Connect to database
    await connectDB();
    
    // Create indexes for better performance
    await createIndexes();
    
    // Create sample data if database is empty
    await createSampleData();
    
    console.log('✅ Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

const createIndexes = async () => {
  console.log('📊 Creating database indexes...');
  
  try {
    // Egg Production indexes
    await EggProduction.collection.createIndex({ date: 1, batchNumber: 1 });
    await EggProduction.collection.createIndex({ date: -1 });
    
    // Sales Order indexes
    await SalesOrder.collection.createIndex({ orderNumber: 1 }, { unique: true });
    await SalesOrder.collection.createIndex({ customerName: 1 });
    await SalesOrder.collection.createIndex({ orderDate: -1 });
    await SalesOrder.collection.createIndex({ status: 1 });
    
    // Feed Inventory indexes
    await FeedInventory.collection.createIndex({ type: 1 });
    await FeedInventory.collection.createIndex({ isLowStock: 1 });
    await FeedInventory.collection.createIndex({ expiryDate: 1 });
    
    // Task Scheduling indexes
    await TaskScheduling.collection.createIndex({ date: 1, time: 1 });
    await TaskScheduling.collection.createIndex({ assignedTo: 1 });
    await TaskScheduling.collection.createIndex({ status: 1 });
    await TaskScheduling.collection.createIndex({ category: 1 });
    
    // Financial Record indexes (already defined in model)
    // Additional indexes for better performance
    await FinancialRecord.collection.createIndex({ customerSupplier: 1 });
    await FinancialRecord.collection.createIndex({ subcategory: 1 });
    
    console.log('✅ All indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    throw error;
  }
};

const createSampleData = async () => {
  console.log('🌱 Checking for existing data...');
  
  try {
    // Check if we already have data
    const eggProductionCount = await EggProduction.countDocuments();
    const salesOrderCount = await SalesOrder.countDocuments();
    const feedInventoryCount = await FeedInventory.countDocuments();
    const taskCount = await TaskScheduling.countDocuments();
    const financialCount = await FinancialRecord.countDocuments();
    
    if (eggProductionCount > 0 || salesOrderCount > 0 || feedInventoryCount > 0 || 
        taskCount > 0 || financialCount > 0) {
      console.log('📊 Database already contains data, skipping sample data creation');
      return;
    }
    
    console.log('🌱 Creating sample data...');
    
    // Sample Egg Production data
    const sampleEggProduction = [
      {
        date: '2024-01-15',
        batchNumber: 'BATCH-001',
        birds: 1000,
        eggsCollected: 850,
        damagedEggs: 15,
        notes: 'Good production day, weather was favorable'
      },
      {
        date: '2024-01-16',
        batchNumber: 'BATCH-002',
        birds: 1000,
        eggsCollected: 920,
        damagedEggs: 8,
        notes: 'Excellent production, new feed seems to be working well'
      }
    ];
    
    // Sample Sales Orders
    const sampleSalesOrders = [
      {
        orderNumber: 'SO-2024-001',
        customerName: 'John Smith',
        customerPhone: '+1234567890',
        customerEmail: 'john.smith@email.com',
        productType: 'Large Eggs',
        quantity: 500,
        unitPrice: 0.25,
        orderDate: '2024-01-15',
        deliveryDate: '2024-01-16',
        status: 'Delivered',
        paymentStatus: 'Paid',
        notes: 'Regular customer, always pays on time'
      },
      {
        orderNumber: 'SO-2024-002',
        customerName: 'Mary Johnson',
        customerPhone: '+1987654321',
        productType: 'Medium Eggs',
        quantity: 300,
        unitPrice: 0.22,
        orderDate: '2024-01-16',
        deliveryDate: '2024-01-17',
        status: 'Processing',
        paymentStatus: 'Pending',
        notes: 'New customer, first order'
      }
    ];
    
    // Sample Feed Inventory
    const sampleFeedInventory = [
      {
        type: 'Layer Feed',
        quantity: 500,
        unit: 'KG',
        supplier: 'Premium Feed Co.',
        supplierContact: '+1555123456',
        lastRestocked: '2024-01-10',
        expiryDate: '2024-06-10',
        costPerUnit: 0.85,
        minimumThreshold: 100,
        location: 'Main Storage',
        notes: 'High quality layer feed for optimal egg production'
      },
      {
        type: 'Chick Starter',
        quantity: 50,
        unit: 'KG',
        supplier: 'Farm Supply Inc.',
        supplierContact: '+1555987654',
        lastRestocked: '2024-01-12',
        expiryDate: '2024-05-12',
        costPerUnit: 1.20,
        minimumThreshold: 25,
        location: 'Secondary Storage',
        notes: 'Low stock - need to reorder soon'
      }
    ];
    
    // Sample Tasks
    const sampleTasks = [
      {
        date: '2024-01-17',
        taskDescription: 'Collect eggs from all coops',
        category: 'Egg Collection',
        assignedTo: 'Farm Worker 1',
        assignedToContact: '+1555111111',
        time: '08:00',
        estimatedDuration: 120,
        status: 'Pending',
        priority: 'High',
        location: 'Coop A, B, C',
        equipment: ['Egg baskets', 'Gloves'],
        notes: 'Check for any damaged eggs and separate them'
      },
      {
        date: '2024-01-17',
        taskDescription: 'Clean and sanitize feeding equipment',
        category: 'Cleaning & Maintenance',
        assignedTo: 'Farm Worker 2',
        assignedToContact: '+1555222222',
        time: '10:00',
        estimatedDuration: 90,
        status: 'Pending',
        priority: 'Medium',
        location: 'Equipment Room',
        equipment: ['Cleaning supplies', 'Sanitizer'],
        notes: 'Weekly deep cleaning routine'
      }
    ];
    
    // Sample Financial Records
    const sampleFinancialRecords = [
      {
        date: '2024-01-15',
        description: 'Egg sales to John Smith',
        category: 'Income',
        subcategory: 'Egg Sales',
        amount: 125.00,
        paymentMethod: 'Bank Transfer',
        reference: 'INV-2024-001',
        customerSupplier: 'John Smith',
        status: 'Completed',
        notes: 'Payment received via bank transfer'
      },
      {
        date: '2024-01-10',
        description: 'Layer feed purchase',
        category: 'Expense',
        subcategory: 'Feed & Nutrition',
        amount: 425.00,
        paymentMethod: 'Cash',
        reference: 'EXP-2024-001',
        customerSupplier: 'Premium Feed Co.',
        status: 'Completed',
        notes: 'Bulk purchase for monthly supply'
      }
    ];
    
    // Insert sample data
    await EggProduction.insertMany(sampleEggProduction);
    await SalesOrder.insertMany(sampleSalesOrders);
    await FeedInventory.insertMany(sampleFeedInventory);
    await TaskScheduling.insertMany(sampleTasks);
    await FinancialRecord.insertMany(sampleFinancialRecords);
    
    console.log('✅ Sample data created successfully');
    console.log(`📊 Created: ${sampleEggProduction.length} egg production records`);
    console.log(`📊 Created: ${sampleSalesOrders.length} sales orders`);
    console.log(`📊 Created: ${sampleFeedInventory.length} feed inventory items`);
    console.log(`📊 Created: ${sampleTasks.length} tasks`);
    console.log(`📊 Created: ${sampleFinancialRecords.length} financial records`);
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
    throw error;
  }
};

// Run initialization if this script is executed directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase, createIndexes, createSampleData };

