#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');

// Import routes
const eggProductionRoutes = require('./src/routes/eggProduction');
const salesOrderRoutes = require('./src/routes/salesOrder');
const feedInventoryRoutes = require('./src/routes/feedInventory');
const taskSchedulingRoutes = require('./src/routes/taskScheduling');
const financialRecordRoutes = require('./src/routes/financialRecord');
const contactRoutes = require('./src/routes/contact');

/**
 * Robust Server Startup Script
 * This script handles database connection issues gracefully and provides better error handling
 */

const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAY = 3000; // 3 seconds

class FarmServer {
  constructor() {
    this.app = express();
    this.retryCount = 0;
    this.isShuttingDown = false;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // CORS configuration
    this.app.use(cors({
      origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Allow localhost on any port for development
        if (origin.match(/^http:\/\/localhost:\d+$/)) {
          return callback(null, true);
        }
        
        // Allow specific production domains
        const allowedOrigins = [
          process.env.FRONTEND_URL || 'http://localhost:5173',
          'http://localhost:5174',
          'http://localhost:5175',
          'http://localhost:5176',
          'http://localhost:5177',
          'http://localhost:5178',
          'http://localhost:5179',
          'http://localhost:5180'
        ];
        
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true
    }));

    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/api/health', (req, res) => {
      const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
      res.json({ 
        status: 'OK', 
        message: 'Farm Management API is running!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: dbStatus,
        uptime: process.uptime()
      });
    });

    // API Routes
    this.app.use('/api/egg-production', eggProductionRoutes);
    this.app.use('/api/sales-orders', salesOrderRoutes);
    this.app.use('/api/feed-inventory', feedInventoryRoutes);
    this.app.use('/api/task-scheduling', taskSchedulingRoutes);
    this.app.use('/api/financial-records', financialRecordRoutes);
    this.app.use('/api/contact', contactRoutes);
  }

  setupErrorHandling() {
    // Error handling middleware
    this.app.use((err, req, res, next) => {
      console.error('❌ Error:', err.stack);
      res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'API endpoint not found'
      });
    });
  }

  async connectToDatabase() {
    try {
      const mongoUri = process.env.MONGO_URI || 'mongodb+srv://codez:codez123@codez.7wxzojy.mongodb.net/farm_management?retryWrites=true&w=majority';
      const dbName = process.env.DB_NAME || 'farm_management';
      
      console.log('🔄 Connecting to MongoDB...');
      
      const options = {
        dbName: dbName,
        maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 10,
        minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE) || 5,
        serverSelectionTimeoutMS: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 30000,
        socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT) || 45000,
        retryWrites: true,
        w: 'majority'
      };

      const conn = await mongoose.connect(mongoUri, options);
      
      console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
      console.log(`📊 Connection State: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
      
      this.setupDatabaseEventHandlers();
      return conn;
      
    } catch (error) {
      console.error('❌ Error connecting to MongoDB:', error.message);
      
      if (this.retryCount < MAX_RETRY_ATTEMPTS) {
        this.retryCount++;
        console.log(`🔄 Retrying connection (${this.retryCount}/${MAX_RETRY_ATTEMPTS}) in ${RETRY_DELAY/1000} seconds...`);
        
        setTimeout(() => {
          this.connectToDatabase();
        }, RETRY_DELAY);
      } else {
        console.error('❌ Max retry attempts reached. Please check your database connection.');
        console.error('🔧 Troubleshooting tips:');
        console.error('   1. Check your internet connection');
        console.error('   2. Verify MongoDB Atlas cluster is running');
        console.error('   3. Check if IP address is whitelisted in MongoDB Atlas');
        console.error('   4. Verify username/password in connection string');
        console.error('   5. Run: npm run db:status');
        
        // Start server anyway for development (without database)
        console.log('⚠️ Starting server without database connection...');
        this.startServer();
      }
    }
  }

  setupDatabaseEventHandlers() {
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected - attempting to reconnect...');
      if (!this.isShuttingDown) {
        setTimeout(() => {
          this.connectToDatabase();
        }, RETRY_DELAY);
      }
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected successfully');
      this.retryCount = 0; // Reset retry count on successful reconnection
    });
    
    mongoose.connection.on('close', () => {
      console.log('🔒 MongoDB connection closed');
    });
  }

  startServer() {
    const PORT = process.env.PORT || 5000;
    
    this.server = this.app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      
      if (mongoose.connection.readyState === 1) {
        console.log('✅ Database connection is active');
      } else {
        console.log('⚠️ Database connection is not active - some features may not work');
      }
    });

    // Graceful shutdown handling
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
  }

  async gracefulShutdown(signal) {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
    this.isShuttingDown = true;

    try {
      // Close server
      if (this.server) {
        await new Promise((resolve) => {
          this.server.close(resolve);
        });
        console.log('🔒 HTTP server closed');
      }

      // Close database connection
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log('🔒 Database connection closed');
      }

      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }

  async start() {
    try {
      console.log('🚀 Starting Farm Management Server...');
      console.log('=' .repeat(50));
      
      // Try to connect to database first
      await this.connectToDatabase();
      
      // Start the server
      this.startServer();
      
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Start the server
const server = new FarmServer();
server.start();
