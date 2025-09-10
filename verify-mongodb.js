require('dotenv').config();
const mongoose = require('mongoose');

async function verifyMongoDB() {
  try {
    console.log('🔍 Verifying MongoDB Connection...\n');
    
    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.DB_NAME || 'farm_management'
    });
    
    console.log('✅ MongoDB Connected Successfully!');
    console.log(`📍 Database: ${conn.connection.name}`);
    console.log(`🌐 Host: ${conn.connection.host}\n`);
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Available Collections:');
    collections.forEach(collection => {
      console.log(`   - ${collection.name}`);
    });
    
    console.log('\n🔢 Document Counts:');
    
    // Count documents in each collection
    for (const collection of collections) {
      try {
        const count = await mongoose.connection.db.collection(collection.name).countDocuments();
        console.log(`   ${collection.name}: ${count} documents`);
      } catch (error) {
        console.log(`   ${collection.name}: Error counting documents`);
      }
    }
    
    // Show sample data from each collection
    console.log('\n📋 Sample Data:');
    for (const collection of collections) {
      try {
        const sampleDocs = await mongoose.connection.db.collection(collection.name).find().limit(1).toArray();
        if (sampleDocs.length > 0) {
          console.log(`\n   📄 ${collection.name} sample:`);
          console.log(`   ${JSON.stringify(sampleDocs[0], null, 2)}`);
        }
      } catch (error) {
        console.log(`   ${collection.name}: Error getting sample data`);
      }
    }
    
    console.log('\n✅ MongoDB verification complete!');
    
  } catch (error) {
    console.error('❌ MongoDB verification failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
  }
}

verifyMongoDB();

