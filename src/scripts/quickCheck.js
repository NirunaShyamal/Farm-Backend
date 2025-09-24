const mongoose = require('mongoose');
const FeedStock = require('../models/FeedStock');
require('dotenv').config();

async function quickCheck() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/farm_management';
    const dbName = process.env.DB_NAME || 'farm_management';
    
    await mongoose.connect(mongoUri, { dbName });
    console.log('✅ Connected');
    
    const stocks = await FeedStock.find({});
    console.log('\n📊 Current Data:');
    
    for (const stock of stocks) {
      const expiryDate = new Date(stock.expiryDate);
      const currentDate = new Date();
      const actualDays = Math.floor((expiryDate - currentDate) / (1000 * 60 * 60 * 24));
      
      console.log(`${stock.feedType}:`);
      console.log(`  Expiry: ${stock.expiryDate}`);
      console.log(`  Actual days: ${actualDays}`);
      console.log(`  System daysUntilExpiry: ${stock.daysUntilExpiry || 'undefined'}`);
      console.log(`  Status: ${stock.status}`);
      console.log('');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

quickCheck();
