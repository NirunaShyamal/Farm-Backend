require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/database');
const feedAutomationService = require('./src/services/feedAutomationService');

// Import routes
const eggProductionRoutes = require('./src/routes/eggProduction');
const salesOrderRoutes = require('./src/routes/salesOrder');
const feedInventoryRoutes = require('./src/routes/feedInventory');
const feedStockRoutes = require('./src/routes/feedStock');
const feedUsageRoutes = require('./src/routes/feedUsage');
const taskSchedulingRoutes = require('./src/routes/taskScheduling');
const financialRecordRoutes = require('./src/routes/financialRecord');
const contactRoutes = require('./src/routes/contact');

const app = express();

// Middleware
app.use(cors({
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Farm Management API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Automation status endpoint
app.get('/api/automation/status', (req, res) => {
  try {
    const status = feedAutomationService.getAutomationStatus();
    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get automation status',
      error: error.message
    });
  }
});

// Manual automation trigger endpoint
app.post('/api/automation/trigger', async (req, res) => {
  try {
    const { type = 'daily' } = req.body;
    await feedAutomationService.runManualAutomation(type);
    res.status(200).json({
      success: true,
      message: `${type} automation completed successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to run automation',
      error: error.message
    });
  }
});

// API Routes
app.use('/api/egg-production', eggProductionRoutes);
app.use('/api/sales-orders', salesOrderRoutes);
app.use('/api/feed-inventory', feedInventoryRoutes);
app.use('/api/feed-stock', feedStockRoutes);
app.use('/api/feed-usage', feedUsageRoutes);
app.use('/api/task-scheduling', taskSchedulingRoutes);
app.use('/api/financial-records', financialRecordRoutes);
app.use('/api/contact', contactRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

const PORT = process.env.PORT || 5000;

// Connect to database and start server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    });
  })
  .catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });
