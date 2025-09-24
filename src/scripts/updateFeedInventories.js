require('dotenv').config();
const mongoose = require('mongoose');

// Connect to database
async function connectDB() {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://codez:codez123@codez.7wxzojy.mongodb.net/Niruna';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function updateFeedInventories() {
  await connectDB();
  
  try {
    // Get the collection directly
    const db = mongoose.connection.db;
    const collection = db.collection('feedinventories');
    
    console.log('📋 Updating existing feedinventories records...');
    
    // Get all records
    const records = await collection.find({}).toArray();
    console.log(`📊 Found ${records.length} records to update`);
    
    let updatedCount = 0;
    
    for (const record of records) {
      try {
        const updateFields = {};
        
        // Calculate daysUntilExpiry if expiryDate exists
        if (record.expiryDate) {
          const expiryDate = new Date(record.expiryDate);
          const currentDate = new Date();
          const daysUntilExpiry = Math.floor((expiryDate - currentDate) / (1000 * 60 * 60 * 24));
          updateFields.daysUntilExpiry = daysUntilExpiry;
        }
        
        // Set status based on expiry and quantity
        if (record.quantity <= 0) {
          updateFields.status = 'Depleted';
        } else if (record.expiryDate && new Date(record.expiryDate) < new Date()) {
          updateFields.status = 'Expired';
        } else {
          updateFields.status = 'Active';
        }
        
        // Add missing fields with defaults if they don't exist
        if (!record.isLowStock) {
          updateFields.isLowStock = record.quantity <= (record.minimumThreshold || 100);
        }
        
        if (!record.totalCost) {
          updateFields.totalCost = (record.quantity || 0) * (record.costPerUnit || 0);
        }
        
        if (!record.lastUpdated) {
          updateFields.lastUpdated = new Date();
        }
        
        // Update the record
        await collection.updateOne(
          { _id: record._id },
          { $set: updateFields }
        );
        
        updatedCount++;
        
        console.log(`✅ Updated: ${record.type || record.feedType || 'Unknown'} - Days until expiry: ${updateFields.daysUntilExpiry || 'N/A'} - Status: ${updateFields.status}`);
        
      } catch (error) {
        console.error(`❌ Error updating record ${record._id}:`, error.message);
      }
    }
    
    console.log('');
    console.log(`🎯 Update Summary:`);
    console.log(`   Total records: ${records.length}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Failed: ${records.length - updatedCount}`);
    
    // Verify the updates
    console.log('');
    console.log('🔍 Verification:');
    const updatedRecords = await collection.find({}).toArray();
    updatedRecords.forEach((record, index) => {
      const feedType = record.type || record.feedType || 'Unknown';
      const daysUntilExpiry = record.daysUntilExpiry || 0;
      const status = record.status || 'Unknown';
      const quantity = record.quantity || 0;
      
      console.log(`${index + 1}. ${feedType}: ${quantity} KG, ${daysUntilExpiry} days until expiry, Status: ${status}`);
    });
    
  } catch (error) {
    console.error('❌ Error updating records:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

updateFeedInventories();
