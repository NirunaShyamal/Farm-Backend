require('dotenv').config();
const mongoose = require('mongoose');

async function checkCollections() {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://codez:codez123@codez.7wxzojy.mongodb.net/Niruna';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('📋 Available Collections:');
    collections.forEach((col, index) => {
      console.log(`${index + 1}. ${col.name}`);
    });
    
    console.log('');
    
    // Check feedinventories collection
    console.log('🔍 feedinventories collection:');
    const feedInventories = await db.collection('feedinventories').find({}).toArray();
    console.log(`   Count: ${feedInventories.length}`);
    feedInventories.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.type}: ${item.quantity} KG (${item.status || 'No Status'})`);
    });
    
    console.log('');
    
    // Check feedstocks collection
    console.log('🔍 feedstocks collection:');
    const feedStocks = await db.collection('feedstocks').find({}).toArray();
    console.log(`   Count: ${feedStocks.length}`);
    feedStocks.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.feedType}: ${item.currentQuantity} KG (${item.status || 'No Status'})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

checkCollections();
