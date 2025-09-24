const mongoose = require('mongoose');
const FeedStock = require('../models/FeedStock');
require('dotenv').config();

async function migrateFeedStockDays() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/farm_management';
    const dbName = process.env.DB_NAME || 'farm_management';
    
    await mongoose.connect(mongoUri, {
      dbName: dbName,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Get all feed stock records
    const allStocks = await FeedStock.find({});
    console.log(`📊 Found ${allStocks.length} feed stock records to migrate`);
    
    for (const stock of allStocks) {
      console.log(`🔄 Updating ${stock.feedType}...`);
      
      // Calculate daysUntilExpiry manually
      const expiryDate = new Date(stock.expiryDate);
      const currentDate = new Date();
      const daysUntilExpiry = Math.floor((expiryDate - currentDate) / (1000 * 60 * 60 * 24));
      
      // Update status based on expiry
      let newStatus = stock.status;
      if (stock.currentQuantity <= 0) {
        newStatus = 'Depleted';
      } else if (expiryDate < currentDate) {
        newStatus = 'Expired';
      } else {
        newStatus = 'Active';
      }
      
      // Update the record
      await FeedStock.findByIdAndUpdate(stock._id, {
        daysUntilExpiry: daysUntilExpiry,
        status: newStatus,
        lastUpdated: new Date()
      });
      
      console.log(`   ✅ Updated: ${daysUntilExpiry} days until expiry, status: ${newStatus}`);
    }
    
    console.log('🎉 Migration completed successfully!');
    
    // Verify the results
    console.log('\n📋 Verification:');
    const updatedStocks = await FeedStock.find({});
    
    for (const stock of updatedStocks) {
      const expiryDate = new Date(stock.expiryDate);
      const expectedDays = Math.floor((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
      
      console.log(`${stock.feedType}: Expected ${expectedDays}, Got ${stock.daysUntilExpiry}, Status: ${stock.status}`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
migrateFeedStockDays();
