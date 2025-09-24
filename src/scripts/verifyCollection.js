require('dotenv').config();
const mongoose = require('mongoose');
const FeedStock = require('../models/FeedStock');

async function verifyCollection() {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://codez:codez123@codez.7wxzojy.mongodb.net/Niruna';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
    
    // Check what collection FeedStock model is actually using
    console.log('🔍 FeedStock model collection name:', FeedStock.collection.name);
    
    // Get records using the model
    const records = await FeedStock.find({});
    console.log(`📊 Records found using FeedStock model: ${records.length}`);
    
    records.forEach((record, index) => {
      console.log(`${index + 1}. ${record.type || record.feedType}: ${record.quantity || record.currentQuantity} KG`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

verifyCollection();
