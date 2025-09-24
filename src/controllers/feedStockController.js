const FeedStock = require('../models/FeedStock');
const FeedUsage = require('../models/FeedUsage');

// @desc    Get all feed stock items
// @route   GET /api/feed-stock
// @access  Public
const getFeedStock = async (req, res) => {
  try {
    console.log('📋 Getting feed stock with query:', req.query);
    const { 
      page = 1, 
      limit = 10, 
      feedType, 
      month, 
      year,
      status = 'Active',
      lowStock,
      sortBy = 'feedType', 
      sortOrder = 'asc' 
    } = req.query;
    
    // Build filter
    const filter = {};
    if (feedType) filter.feedType = feedType;
    if (month) filter.month = month;
    if (year) filter.year = parseInt(year);
    if (status !== 'all') filter.status = status;
    if (lowStock === 'true') filter.isLowStock = true;

    console.log('🔍 Filter applied:', filter);
    const items = await FeedStock.find(filter)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await FeedStock.countDocuments(filter);
    console.log('📊 Found items:', items.length, 'Total count:', total);

    // Calculate additional metrics for each item
    const enhancedItems = await Promise.all(items.map(async (item) => {
      const itemObj = item.toObject();
      
      // Get usage data for this month
      const usageData = await FeedUsage.getDailyAverages(item.feedType, item.month);
      if (usageData.length > 0) {
        itemObj.usageStats = usageData[0];
      }
      
      return itemObj;
    }));

    res.status(200).json({
      success: true,
      count: items.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: enhancedItems
    });
  } catch (error) {
    console.error('Error fetching feed stock:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feed stock',
      error: error.message
    });
  }
};

// @desc    Create or update monthly feed stock
// @route   POST /api/feed-stock
// @access  Public
const createOrUpdateFeedStock = async (req, res) => {
  try {
    console.log('📝 Feed Stock Request Body:', req.body);
    
    const {
      feedType,
      month,
      year,
      baselineQuantity,
      supplier,
      supplierContact,
      costPerUnit,
      minimumThreshold,
      expiryDate,
      location,
      batchNumber,
      deliveryDate,
      qualityGrade,
      notes
    } = req.body;

    // Validate required fields
    console.log('🔍 Validating fields:', { feedType, month, year, baselineQuantity, supplier, expiryDate });
    if (!feedType || !month || !year || baselineQuantity === undefined || !supplier || !expiryDate) {
      console.log('❌ Validation failed - missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: feedType, month, year, baselineQuantity, supplier, expiryDate'
      });
    }
    console.log('✅ Validation passed');

    // Check if stock already exists for this feed type and month
    console.log('🔍 Checking for existing stock:', { feedType, month });
    let existingStock = await FeedStock.findOne({ feedType, month });
    console.log('📊 Existing stock found:', existingStock ? 'Yes' : 'No');

    if (existingStock) {
      console.log('🔄 Updating existing stock...');
      // Update existing stock - map to feedinventories schema
      existingStock.type = feedType;  // Map feedType to type
      existingStock.feedType = feedType;  // Keep both for compatibility
      existingStock.quantity = baselineQuantity;  // Map baselineQuantity to quantity
      existingStock.currentQuantity = baselineQuantity; // Keep both for compatibility
      existingStock.year = year;
      existingStock.supplier = supplier;
      existingStock.supplierContact = supplierContact || '';
      existingStock.costPerUnit = costPerUnit || 0;
      existingStock.minimumThreshold = minimumThreshold || 100;
      existingStock.expiryDate = expiryDate;
      existingStock.location = location || 'Main Storage';
      existingStock.batchNumber = batchNumber || '';
      existingStock.deliveryDate = deliveryDate || '';
      existingStock.qualityGrade = qualityGrade || 'A';
      existingStock.notes = notes || '';
      existingStock.status = 'Active';

      console.log('💾 Saving updated stock...');
      const updatedStock = await existingStock.save();
      console.log('✅ Stock updated successfully:', updatedStock._id);

      res.status(200).json({
        success: true,
        message: 'Feed stock updated successfully',
        data: updatedStock
      });
    } else {
      // Create new stock entry - map to feedinventories schema
      const newStock = new FeedStock({
        type: feedType,  // Map feedType to type (required field)
        feedType: feedType,  // Keep both for compatibility
        quantity: baselineQuantity,  // Map baselineQuantity to quantity (required field)
        currentQuantity: baselineQuantity,  // Keep both for compatibility
        month,
        year,
        supplier,
        supplierContact: supplierContact || '',
        costPerUnit: costPerUnit || 0,
        minimumThreshold: minimumThreshold || 100,
        expiryDate,
        location: location || 'Main Storage',
        batchNumber: batchNumber || '',
        deliveryDate: deliveryDate || '',
        qualityGrade: qualityGrade || 'A',
        notes: notes || ''
      });

      const savedStock = await newStock.save();

      res.status(201).json({
        success: true,
        message: 'Feed stock created successfully',
        data: savedStock
      });
    }
  } catch (error) {
    console.error('Error creating/updating feed stock:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Feed stock for this type and month already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create/update feed stock',
      error: error.message
    });
  }
};

// @desc    Get feed stock dashboard summary
// @route   GET /api/feed-stock/dashboard
// @access  Public
const getFeedStockDashboard = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Get current month's active stock
    const activeStock = await FeedStock.find({ 
      month: currentMonth, 
      status: 'Active' 
    });

    // Calculate totals
    const totalStock = activeStock.reduce((sum, item) => sum + item.currentQuantity, 0);
    const totalValue = activeStock.reduce((sum, item) => sum + (item.currentQuantity * item.costPerUnit), 0);
    const lowStockItems = activeStock.filter(item => item.isLowStock).length;
    const criticalItems = activeStock.filter(item => item.currentQuantity <= (item.minimumThreshold * 0.5)).length;

    // Get usage data for current month
    const usagePromises = activeStock.map(async (stock) => {
      const usage = await FeedUsage.getDailyAverages(stock.feedType, currentMonth);
      return {
        feedType: stock.feedType,
        currentQuantity: stock.currentQuantity,
        averageDaily: usage.length > 0 ? usage[0].averageDaily : 0,
        daysRemaining: usage.length > 0 && usage[0].averageDaily > 0 
          ? Math.floor(stock.currentQuantity / usage[0].averageDaily) 
          : 0
      };
    });

    const stockWithUsage = await Promise.all(usagePromises);

    // Calculate overall average daily consumption
    const totalDailyConsumption = stockWithUsage.reduce((sum, item) => sum + item.averageDaily, 0);
    const overallDaysRemaining = totalDailyConsumption > 0 ? Math.floor(totalStock / totalDailyConsumption) : 0;

    // Get upcoming expirations (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringItems = activeStock.filter(item => 
      new Date(item.expiryDate) <= thirtyDaysFromNow
    ).length;

    // Get top consuming feed types
    const topConsumers = stockWithUsage
      .sort((a, b) => b.averageDaily - a.averageDaily)
      .slice(0, 5);

    // Get inventory by type
    const inventoryByType = activeStock.map(item => ({
      feedType: item.feedType,
      quantity: item.currentQuantity,
      percentage: totalStock > 0 ? ((item.currentQuantity / totalStock) * 100).toFixed(1) : 0,
      value: item.currentQuantity * item.costPerUnit,
      daysRemaining: stockWithUsage.find(s => s.feedType === item.feedType)?.daysRemaining || 0
    }));

    // Get monthly trends (last 6 months)
    const monthlyTrends = await getMonthlyTrends();

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalStock,
          totalValue,
          lowStockItems,
          criticalItems,
          expiringItems,
          totalDailyConsumption,
          overallDaysRemaining,
          activeStockTypes: activeStock.length
        },
        stockWithUsage,
        topConsumers,
        inventoryByType,
        monthlyTrends,
        alerts: {
          lowStock: activeStock.filter(item => item.isLowStock),
          critical: activeStock.filter(item => item.currentQuantity <= (item.minimumThreshold * 0.5)),
          expiring: activeStock.filter(item => new Date(item.expiryDate) <= thirtyDaysFromNow)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching feed stock dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feed stock dashboard',
      error: error.message
    });
  }
};

// Helper function to get monthly trends
const getMonthlyTrends = async () => {
  try {
    const months = [];
    const currentDate = new Date();
    
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.push(monthStr);
    }

    const trends = await Promise.all(months.map(async (month) => {
      const stocks = await FeedStock.find({ month });
      const totalStock = stocks.reduce((sum, item) => sum + item.baselineQuantity, 0);
      const totalValue = stocks.reduce((sum, item) => sum + (item.baselineQuantity * item.costPerUnit), 0);
      
      // Get total usage for the month
      const usageData = await FeedUsage.aggregate([
        {
          $match: {
            date: { $regex: `^${month}` }
          }
        },
        {
          $group: {
            _id: null,
            totalUsage: { $sum: '$quantityUsed' },
            averageDaily: { $avg: '$quantityUsed' }
          }
        }
      ]);

      return {
        month,
        totalStock,
        totalValue,
        totalUsage: usageData.length > 0 ? usageData[0].totalUsage : 0,
        averageDaily: usageData.length > 0 ? usageData[0].averageDaily : 0
      };
    }));

    return trends;
  } catch (error) {
    console.error('Error getting monthly trends:', error);
    return [];
  }
};

// @desc    Deduct usage from stock
// @route   POST /api/feed-stock/:id/deduct
// @access  Public
const deductUsageFromStock = async (req, res) => {
  try {
    const { quantityUsed } = req.body;
    
    if (!quantityUsed || quantityUsed <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity used must be a positive number'
      });
    }

    const stock = await FeedStock.findById(req.params.id);
    
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Feed stock not found'
      });
    }

    if (quantityUsed > stock.currentQuantity) {
      return res.status(400).json({
        success: false,
        message: `Cannot deduct ${quantityUsed} KG. Only ${stock.currentQuantity} KG available.`
      });
    }

    // Deduct the usage
    await stock.deductUsage(quantityUsed);

    res.status(200).json({
      success: true,
      message: 'Usage deducted successfully',
      data: stock
    });
  } catch (error) {
    console.error('Error deducting usage from stock:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deduct usage from stock',
      error: error.message
    });
  }
};

// @desc    Get single feed stock item by ID
// @route   GET /api/feed-stock/:id
// @access  Public
const getFeedStockById = async (req, res) => {
  try {
    const stock = await FeedStock.findById(req.params.id);
    
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Feed stock not found'
      });
    }

    // Get usage history for this stock
    const usageHistory = await FeedUsage.getUsageForDateRange(
      stock.feedType, 
      `${stock.month}-01`, 
      `${stock.month}-31`
    );

    res.status(200).json({
      success: true,
      data: {
        stock,
        usageHistory
      }
    });
  } catch (error) {
    console.error('Error fetching feed stock:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feed stock',
      error: error.message
    });
  }
};

// @desc    Update feed stock
// @route   PUT /api/feed-stock/:id
// @access  Public
const updateFeedStock = async (req, res) => {
  try {
    const stock = await FeedStock.findById(req.params.id);
    
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Feed stock not found'
      });
    }

    // Update fields
    const allowedUpdates = [
      'supplier', 'supplierContact', 'costPerUnit', 'minimumThreshold',
      'expiryDate', 'location', 'batchNumber', 'deliveryDate', 
      'qualityGrade', 'notes', 'currentQuantity'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        stock[field] = req.body[field];
      }
    });

    const updatedStock = await stock.save();

    res.status(200).json({
      success: true,
      message: 'Feed stock updated successfully',
      data: updatedStock
    });
  } catch (error) {
    console.error('Error updating feed stock:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update feed stock',
      error: error.message
    });
  }
};

// @desc    Delete feed stock
// @route   DELETE /api/feed-stock/:id
// @access  Public
const deleteFeedStock = async (req, res) => {
  try {
    const stock = await FeedStock.findById(req.params.id);
    
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Feed stock not found'
      });
    }

    await FeedStock.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Feed stock deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting feed stock:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete feed stock',
      error: error.message
    });
  }
};

module.exports = {
  getFeedStock,
  createOrUpdateFeedStock,
  getFeedStockDashboard,
  deductUsageFromStock,
  getFeedStockById,
  updateFeedStock,
  deleteFeedStock
};
