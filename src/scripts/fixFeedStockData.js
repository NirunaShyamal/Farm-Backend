const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB directly
async function fixFeedStockData() {
  try {
    console.log('🔧 Starting Feed Stock Data Fix...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/farm_management';
    const dbName = process.env.DB_NAME || 'farm_management';
    
    await mongoose.connect(mongoUri, {
      dbName: dbName
    });
    
    console.log('✅ Connected to MongoDB');
    console.log(`📊 Database: ${dbName}`);
    
    // Get the collection directly
    const db = mongoose.connection.db;
    const feedStockCollection = db.collection('feedstocks');
    
    // Get all documents
    const allDocs = await feedStockCollection.find({}).toArray();
    console.log(`📋 Found ${allDocs.length} feed stock records`);
    
    const currentDate = new Date();
    console.log(`📅 Current Date: ${currentDate.toISOString().split('T')[0]}`);
    console.log('');
    
    // Update each document
    for (const doc of allDocs) {
      const expiryDate = new Date(doc.expiryDate);
      const daysUntilExpiry = Math.floor((expiryDate - currentDate) / (1000 * 60 * 60 * 24));
      
      // Determine correct status
      let newStatus = 'Active';
      if (doc.currentQuantity <= 0) {
        newStatus = 'Depleted';
      } else if (expiryDate < currentDate) {
        newStatus = 'Expired';
      }
      
      console.log(`🔄 Updating ${doc.feedType}:`);
      console.log(`   Expiry: ${doc.expiryDate}`);
      console.log(`   Days until expiry: ${daysUntilExpiry}`);
      console.log(`   Status: ${doc.status} → ${newStatus}`);
      
      // Update the document directly
      const updateResult = await feedStockCollection.updateOne(
        { _id: doc._id },
        {
          $set: {
            daysUntilExpiry: daysUntilExpiry,
            status: newStatus,
            lastUpdated: currentDate
          }
        }
      );
      
      if (updateResult.modifiedCount > 0) {
        console.log('   ✅ Updated successfully');
      } else {
        console.log('   ⚠️ No changes made');
      }
      console.log('');
    }
    
    console.log('🎉 Migration completed!');
    
    // Verify the results
    console.log('🔍 Verification:');
    const updatedDocs = await feedStockCollection.find({}).toArray();
    
    for (const doc of updatedDocs) {
      const expiryDate = new Date(doc.expiryDate);
      const expectedDays = Math.floor((expiryDate - currentDate) / (1000 * 60 * 60 * 24));
      
      console.log(`${doc.feedType}:`);
      console.log(`  Expected: ${expectedDays} days`);
      console.log(`  Actual: ${doc.daysUntilExpiry} days`);
      console.log(`  Status: ${doc.status}`);
      console.log(`  Match: ${doc.daysUntilExpiry === expectedDays ? '✅' : '❌'}`);
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
  }
}

// Run the fix
fixFeedStockData();
