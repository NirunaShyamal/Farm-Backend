require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use environment variables or fallback to hardcoded values
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://codez:codez123@codez.7wxzojy.mongodb.net/farm_management?retryWrites=true&w=majority';
    const dbName = process.env.DB_NAME || 'farm_management';
    
    // Enhanced connection options for better stability
    const options = {
      dbName: dbName,
      maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 10,
      minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE) || 5,
      serverSelectionTimeoutMS: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 30000,
      socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT) || 45000,
      retryWrites: true,
      w: 'majority'
    };
    
    console.log('🔄 Connecting to MongoDB...');
    const conn = await mongoose.connect(mongoUri, options);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    console.log(`📊 Connection State: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    
    // Enhanced connection event handling
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
      // Don't exit process on connection errors, let the app handle reconnection
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected - attempting to reconnect...');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected successfully');
    });
    
    mongoose.connection.on('close', () => {
      console.log('🔒 MongoDB connection closed');
    });
    
    // Graceful shutdown handling
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('🔒 MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('❌ Error during MongoDB disconnection:', err);
        process.exit(1);
      }
    });
    
    return conn;
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    console.error('🔧 Troubleshooting tips:');
    console.error('   1. Check your internet connection');
    console.error('   2. Verify MongoDB Atlas cluster is running');
    console.error('   3. Check if IP address is whitelisted in MongoDB Atlas');
    console.error('   4. Verify username/password in connection string');
    
    // Don't exit immediately, give time for potential network issues to resolve
    setTimeout(() => {
      console.log('🔄 Retrying connection in 5 seconds...');
      connectDB();
    }, 5000);
  }
};

module.exports = connectDB;
