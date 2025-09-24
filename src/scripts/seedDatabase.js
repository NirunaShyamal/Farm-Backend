const mongoose = require('mongoose');
const connectDB = require('../config/database');

// Import all models
const EggProduction = require('../models/EggProduction');
const SalesOrder = require('../models/SalesOrder');
const FeedInventory = require('../models/FeedInventory');
const TaskScheduling = require('../models/TaskScheduling');
const FinancialRecord = require('../models/FinancialRecord');

/**
 * Database Seeding Script
 * This script populates the database with comprehensive sample data for development and testing
 */

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDB();
    
    // Clear existing data (optional - uncomment if you want to reset)
    // await clearDatabase();
    
    // Seed all collections
    await seedEggProduction();
    await seedSalesOrders();
    await seedFeedInventory();
    await seedTasks();
    await seedFinancialRecords();
    
    console.log('✅ Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

const clearDatabase = async () => {
  console.log('🗑️ Clearing existing data...');
  
  try {
    await EggProduction.deleteMany({});
    await SalesOrder.deleteMany({});
    await FeedInventory.deleteMany({});
    await TaskScheduling.deleteMany({});
    await FinancialRecord.deleteMany({});
    
    console.log('✅ Database cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
};

const seedEggProduction = async () => {
  console.log('🥚 Seeding egg production data...');
  
  const eggProductionData = [
    // Current month data
    {
      date: '2024-01-01',
      batchNumber: 'BATCH-2024-001',
      birds: 1000,
      eggsCollected: 850,
      damagedEggs: 12,
      notes: 'New Year production - good start'
    },
    {
      date: '2024-01-02',
      batchNumber: 'BATCH-2024-002',
      birds: 1000,
      eggsCollected: 920,
      damagedEggs: 8,
      notes: 'Excellent production day'
    },
    {
      date: '2024-01-03',
      batchNumber: 'BATCH-2024-003',
      birds: 1000,
      eggsCollected: 880,
      damagedEggs: 15,
      notes: 'Slight decrease due to weather'
    },
    {
      date: '2024-01-04',
      batchNumber: 'BATCH-2024-004',
      birds: 1000,
      eggsCollected: 950,
      damagedEggs: 5,
      notes: 'Best production this week'
    },
    {
      date: '2024-01-05',
      batchNumber: 'BATCH-2024-005',
      birds: 1000,
      eggsCollected: 900,
      damagedEggs: 10,
      notes: 'Consistent production'
    },
    // Previous month data for comparison
    {
      date: '2023-12-28',
      batchNumber: 'BATCH-2023-365',
      birds: 950,
      eggsCollected: 820,
      damagedEggs: 18,
      notes: 'End of year production'
    },
    {
      date: '2023-12-29',
      batchNumber: 'BATCH-2023-366',
      birds: 950,
      eggsCollected: 850,
      damagedEggs: 12,
      notes: 'Holiday period production'
    },
    {
      date: '2023-12-30',
      batchNumber: 'BATCH-2023-367',
      birds: 950,
      eggsCollected: 880,
      damagedEggs: 8,
      notes: 'New feed trial showing results'
    }
  ];
  
  try {
    await EggProduction.insertMany(eggProductionData);
    console.log(`✅ Created ${eggProductionData.length} egg production records`);
  } catch (error) {
    console.error('❌ Error seeding egg production:', error);
    throw error;
  }
};

const seedSalesOrders = async () => {
  console.log('📦 Seeding sales orders data...');
  
  const salesOrderData = [
    {
      orderNumber: 'SO-2024-001',
      customerName: 'John Smith',
      customerPhone: '+1234567890',
      customerEmail: 'john.smith@email.com',
      productType: 'Large Eggs',
      quantity: 500,
      unitPrice: 0.25,
      orderDate: '2024-01-01',
      deliveryDate: '2024-01-02',
      status: 'Delivered',
      paymentStatus: 'Paid',
      notes: 'Regular customer, weekly order'
    },
    {
      orderNumber: 'SO-2024-002',
      customerName: 'Mary Johnson',
      customerPhone: '+1987654321',
      customerEmail: 'mary.johnson@email.com',
      productType: 'Medium Eggs',
      quantity: 300,
      unitPrice: 0.22,
      orderDate: '2024-01-02',
      deliveryDate: '2024-01-03',
      status: 'Delivered',
      paymentStatus: 'Paid',
      notes: 'Restaurant customer'
    },
    {
      orderNumber: 'SO-2024-003',
      customerName: 'Robert Brown',
      customerPhone: '+1122334455',
      productType: 'Extra Large Eggs',
      quantity: 200,
      unitPrice: 0.30,
      orderDate: '2024-01-03',
      deliveryDate: '2024-01-04',
      status: 'Processing',
      paymentStatus: 'Pending',
      notes: 'New customer, first order'
    },
    {
      orderNumber: 'SO-2024-004',
      customerName: 'Sarah Wilson',
      customerPhone: '+1555666777',
      customerEmail: 'sarah.wilson@email.com',
      productType: 'Mixed Size',
      quantity: 1000,
      unitPrice: 0.24,
      orderDate: '2024-01-04',
      deliveryDate: '2024-01-05',
      status: 'Ready',
      paymentStatus: 'Partial',
      notes: 'Bulk order for grocery store'
    },
    {
      orderNumber: 'SO-2024-005',
      customerName: 'David Lee',
      customerPhone: '+1999888777',
      productType: 'Small Eggs',
      quantity: 150,
      unitPrice: 0.20,
      orderDate: '2024-01-05',
      deliveryDate: '2024-01-06',
      status: 'Pending',
      paymentStatus: 'Pending',
      notes: 'Local bakery customer'
    }
  ];
  
  try {
    await SalesOrder.insertMany(salesOrderData);
    console.log(`✅ Created ${salesOrderData.length} sales orders`);
  } catch (error) {
    console.error('❌ Error seeding sales orders:', error);
    throw error;
  }
};

const seedFeedInventory = async () => {
  console.log('🌾 Seeding feed inventory data...');
  
  const feedInventoryData = [
    {
      type: 'Layer Feed',
      quantity: 500,
      unit: 'KG',
      supplier: 'Premium Feed Co.',
      supplierContact: '+1555123456',
      lastRestocked: '2024-01-01',
      expiryDate: '2024-06-01',
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
      lastRestocked: '2024-01-02',
      expiryDate: '2024-05-02',
      costPerUnit: 1.20,
      minimumThreshold: 25,
      location: 'Secondary Storage',
      notes: 'Low stock - need to reorder soon'
    },
    {
      type: 'Grower Feed',
      quantity: 200,
      unit: 'KG',
      supplier: 'AgriFeed Solutions',
      supplierContact: '+1555444333',
      lastRestocked: '2023-12-28',
      expiryDate: '2024-05-28',
      costPerUnit: 0.95,
      minimumThreshold: 50,
      location: 'Main Storage',
      notes: 'Good quality grower feed'
    },
    {
      type: 'Medicated Feed',
      quantity: 75,
      unit: 'KG',
      supplier: 'VetFeed Specialists',
      supplierContact: '+1555777888',
      lastRestocked: '2023-12-30',
      expiryDate: '2024-04-30',
      costPerUnit: 1.50,
      minimumThreshold: 20,
      location: 'Medication Storage',
      notes: 'For sick birds - use as needed'
    },
    {
      type: 'Organic Feed',
      quantity: 300,
      unit: 'KG',
      supplier: 'Organic Farm Co.',
      supplierContact: '+1555999000',
      lastRestocked: '2024-01-03',
      expiryDate: '2024-07-03',
      costPerUnit: 1.35,
      minimumThreshold: 75,
      location: 'Organic Storage',
      notes: 'Premium organic feed for special orders'
    }
  ];
  
  try {
    await FeedInventory.insertMany(feedInventoryData);
    console.log(`✅ Created ${feedInventoryData.length} feed inventory items`);
  } catch (error) {
    console.error('❌ Error seeding feed inventory:', error);
    throw error;
  }
};

const seedTasks = async () => {
  console.log('📋 Seeding task scheduling data...');
  
  const taskData = [
    {
      date: '2024-01-06',
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
      date: '2024-01-06',
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
    },
    {
      date: '2024-01-06',
      taskDescription: 'Check bird health and behavior',
      category: 'Bird Care',
      assignedTo: 'Veterinarian',
      assignedToContact: '+1555333333',
      time: '14:00',
      estimatedDuration: 60,
      status: 'Pending',
      priority: 'High',
      location: 'All Coops',
      equipment: ['Health check kit', 'Notebook'],
      notes: 'Weekly health inspection'
    },
    {
      date: '2024-01-07',
      taskDescription: 'Restock feed inventory',
      category: 'Feed Management',
      assignedTo: 'Farm Manager',
      assignedToContact: '+1555444444',
      time: '09:00',
      estimatedDuration: 180,
      status: 'Pending',
      priority: 'Critical',
      location: 'Storage Area',
      equipment: ['Forklift', 'Inventory sheets'],
      notes: 'Order new feed supplies - running low'
    },
    {
      date: '2024-01-07',
      taskDescription: 'Update financial records',
      category: 'Inventory',
      assignedTo: 'Accountant',
      assignedToContact: '+1555555555',
      time: '15:00',
      estimatedDuration: 120,
      status: 'Pending',
      priority: 'Medium',
      location: 'Office',
      equipment: ['Computer', 'Receipts'],
      notes: 'Monthly financial reconciliation'
    },
    {
      date: '2024-01-05',
      taskDescription: 'Egg collection and sorting',
      category: 'Egg Collection',
      assignedTo: 'Farm Worker 1',
      assignedToContact: '+1555111111',
      time: '08:00',
      estimatedDuration: 120,
      status: 'Completed',
      priority: 'High',
      location: 'Coop A, B, C',
      equipment: ['Egg baskets', 'Gloves'],
      notes: 'Completed successfully - 950 eggs collected',
      completedAt: new Date('2024-01-05T10:30:00Z'),
      completedBy: 'Farm Worker 1'
    }
  ];
  
  try {
    await TaskScheduling.insertMany(taskData);
    console.log(`✅ Created ${taskData.length} tasks`);
  } catch (error) {
    console.error('❌ Error seeding tasks:', error);
    throw error;
  }
};

const seedFinancialRecords = async () => {
  console.log('💰 Seeding financial records data...');
  
  const financialData = [
    // Income records
    {
      date: '2024-01-01',
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
      date: '2024-01-02',
      description: 'Egg sales to Mary Johnson',
      category: 'Income',
      subcategory: 'Egg Sales',
      amount: 66.00,
      paymentMethod: 'Cash',
      reference: 'INV-2024-002',
      customerSupplier: 'Mary Johnson',
      status: 'Completed',
      notes: 'Cash payment received'
    },
    {
      date: '2024-01-03',
      description: 'Equipment rental income',
      category: 'Income',
      subcategory: 'Equipment Rental',
      amount: 200.00,
      paymentMethod: 'Bank Transfer',
      reference: 'INV-2024-003',
      customerSupplier: 'Neighbor Farm',
      status: 'Completed',
      notes: 'Tractor rental for one day'
    },
    // Expense records
    {
      date: '2024-01-01',
      description: 'Layer feed purchase',
      category: 'Expense',
      subcategory: 'Feed & Nutrition',
      amount: 425.00,
      paymentMethod: 'Cash',
      reference: 'EXP-2024-001',
      customerSupplier: 'Premium Feed Co.',
      status: 'Completed',
      notes: 'Bulk purchase for monthly supply'
    },
    {
      date: '2024-01-02',
      description: 'Veterinary consultation',
      category: 'Expense',
      subcategory: 'Veterinary Services',
      amount: 150.00,
      paymentMethod: 'Bank Transfer',
      reference: 'EXP-2024-002',
      customerSupplier: 'Dr. Smith Veterinary Clinic',
      status: 'Completed',
      notes: 'Routine health check for flock'
    },
    {
      date: '2024-01-03',
      description: 'Equipment maintenance',
      category: 'Expense',
      subcategory: 'Equipment & Maintenance',
      amount: 75.00,
      paymentMethod: 'Cash',
      reference: 'EXP-2024-003',
      customerSupplier: 'Farm Equipment Repair',
      status: 'Completed',
      notes: 'Repair of egg collection equipment'
    },
    {
      date: '2024-01-04',
      description: 'Labor costs - weekly wages',
      category: 'Expense',
      subcategory: 'Labor Costs',
      amount: 800.00,
      paymentMethod: 'Bank Transfer',
      reference: 'EXP-2024-004',
      customerSupplier: 'Farm Workers',
      status: 'Completed',
      notes: 'Weekly wages for 2 farm workers'
    },
    {
      date: '2024-01-05',
      description: 'Electricity bill',
      category: 'Expense',
      subcategory: 'Utilities & Overhead',
      amount: 120.00,
      paymentMethod: 'Bank Transfer',
      reference: 'EXP-2024-005',
      customerSupplier: 'Electric Company',
      status: 'Completed',
      notes: 'Monthly electricity bill for farm operations'
    }
  ];
  
  try {
    await FinancialRecord.insertMany(financialData);
    console.log(`✅ Created ${financialData.length} financial records`);
  } catch (error) {
    console.error('❌ Error seeding financial records:', error);
    throw error;
  }
};

// Run seeding if this script is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { 
  seedDatabase, 
  clearDatabase, 
  seedEggProduction, 
  seedSalesOrders, 
  seedFeedInventory, 
  seedTasks, 
  seedFinancialRecords 
};

