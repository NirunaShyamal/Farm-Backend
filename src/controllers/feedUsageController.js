const FeedUsage = require('../models/FeedUsage');
const FeedStock = require('../models/FeedStock');

// @desc    Get all feed usage records
// @route   GET /api/feed-usage
// @access  Public
const getFeedUsage = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      feedType, 
      date,
      startDate,
      endDate,
      recordedBy,
      verified,
      sortBy = 'date', 
      sortOrder = 'desc' 
    } = req.query;
    
    // Build filter
    const filter = {};
    if (feedType) filter.feedType = feedType;
    if (date) filter.date = date;
    if (recordedBy) filter.recordedBy = recordedBy;
    if (verified !== undefined) filter.verified = verified === 'true';
    
    // Date range filter
    if (startDate && endDate) {
      filter.date = {
        $gte: startDate,
        $lte: endDate
      };
    }

    const records = await FeedUsage.find(filter)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await FeedUsage.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: records.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: records
    });
  } catch (error) {
    console.error('Error fetching feed usage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feed usage records',
      error: error.message
    });
  }
};

// @desc    Create new feed usage record
// @route   POST /api/feed-usage
// @access  Public
const createFeedUsage = async (req, res) => {
  try {
    const {
      feedType,
      date,
      quantityUsed,
      totalBirds,
      feedingTime,
      weather,
      temperature,
      humidity,
      wastePercentage,
      location,
      recordedBy,
      qualityObservations,
      healthIndicators,
      notes,
      batchesUsed
    } = req.body;

    // Validate required fields
    if (!feedType || !date || quantityUsed === undefined || !recordedBy) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: feedType, date, quantityUsed, recordedBy'
      });
    }

    // Check if record already exists for this feed type and date
    const existingRecord = await FeedUsage.findOne({ feedType, date });
    if (existingRecord) {
      return res.status(400).json({
        success: false,
        message: 'Feed usage record already exists for this feed type and date'
      });
    }

    // Get current month's stock to validate and deduct from
    const currentMonth = date.substring(0, 7); // Extract YYYY-MM from YYYY-MM-DD
    const stock = await FeedStock.findOne({ 
      feedType, 
      month: currentMonth, 
      status: 'Active' 
    });

    if (!stock) {
      return res.status(400).json({
        success: false,
        message: `No active stock found for ${feedType} in ${currentMonth}. Please add stock first.`
      });
    }

    if (quantityUsed > stock.currentQuantity) {
      return res.status(400).json({
        success: false,
        message: `Cannot use ${quantityUsed} KG. Only ${stock.currentQuantity} KG available in stock.`
      });
    }

    // Get cost per unit from stock
    const costPerKg = stock.costPerUnit;

    // Create new usage record with defaults for simplified daily entry
    const usageData = {
      feedType,
      date,
      quantityUsed,
      totalBirds: totalBirds || 200, // Default bird count for calculation purposes
      feedingTime: feedingTime || 'Full Day',
      temperature: temperature || 0,
      humidity: humidity || 0,
      wastePercentage: wastePercentage || 0,
      location: location || 'Main Coop',
      recordedBy,
      qualityObservations: {
        birdAppearance: (qualityObservations?.birdAppearance && ['Excellent', 'Good', 'Fair', 'Poor'].includes(qualityObservations.birdAppearance)) ? qualityObservations.birdAppearance : 'Good',
        feedAcceptance: (qualityObservations?.feedAcceptance && ['Excellent', 'Good', 'Fair', 'Poor'].includes(qualityObservations.feedAcceptance)) ? qualityObservations.feedAcceptance : 'Good',
        waterConsumption: (qualityObservations?.waterConsumption && ['Normal', 'High', 'Low'].includes(qualityObservations.waterConsumption)) ? qualityObservations.waterConsumption : 'Normal'
      },
      healthIndicators: healthIndicators || {
        mortality: 0,
        eggProduction: 0,
        averageWeight: 0
      },
      costAnalysis: {
        costPerKg,
        dailyCost: quantityUsed * costPerKg,
        costPerBird: (totalBirds || 200) > 0 ? ((quantityUsed * costPerKg) / (totalBirds || 200)).toFixed(2) : 0
      },
      notes: notes || '',
      batchesUsed: batchesUsed || []
    };

    // Only include weather if it's a valid enum value
    if (weather && ['Sunny', 'Rainy', 'Cloudy', 'Hot', 'Cold'].includes(weather)) {
      usageData.weather = weather;
    }

    const newUsage = new FeedUsage(usageData);

    const savedUsage = await newUsage.save();

    // Deduct from stock
    await stock.deductUsage(quantityUsed);

    // Update stock's average daily consumption
    const usageStats = await FeedUsage.getDailyAverages(feedType, currentMonth);
    if (usageStats.length > 0) {
      await stock.updateConsumptionAverage(
        usageStats[0].totalUsage, 
        usageStats[0].recordCount
      );
    }

    res.status(201).json({
      success: true,
      message: 'Feed usage recorded successfully',
      data: {
        usage: savedUsage,
        remainingStock: stock.currentQuantity
      }
    });
  } catch (error) {
    console.error('Error creating feed usage:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to record feed usage',
      error: error.message
    });
  }
};

// @desc    Get feed usage analytics
// @route   GET /api/feed-usage/analytics
// @access  Public
const getFeedUsageAnalytics = async (req, res) => {
  try {
    const { 
      feedType, 
      startDate, 
      endDate, 
      period = 'daily' // daily, weekly, monthly
    } = req.query;

    const currentDate = new Date();
    const defaultStartDate = startDate || new Date(currentDate.getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    const defaultEndDate = endDate || currentDate.toISOString().split('T')[0];

    // Build match filter
    const matchFilter = {
      date: {
        $gte: defaultStartDate,
        $lte: defaultEndDate
      }
    };
    
    if (feedType && feedType !== 'all') {
      matchFilter.feedType = feedType;
    }

    // Get consumption trends
    const consumptionTrends = await FeedUsage.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: period === 'weekly' ? {
            year: { $year: { $dateFromString: { dateString: '$date' } } },
            week: { $week: { $dateFromString: { dateString: '$date' } } }
          } : period === 'monthly' ? {
            year: { $year: { $dateFromString: { dateString: '$date' } } },
            month: { $month: { $dateFromString: { dateString: '$date' } } }
          } : '$date',
          totalUsage: { $sum: '$quantityUsed' },
          averageWaste: { $avg: '$wastePercentage' },
          totalBirds: { $avg: '$totalBirds' },
          averageEfficiency: { $avg: { $toDouble: '$feedPerBird' } },
          totalCost: { $sum: '$costAnalysis.dailyCost' },
          recordCount: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Get efficiency metrics
    const efficiencyMetrics = await FeedUsage.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$feedType',
          averageEfficiency: { $avg: { $toDouble: '$feedPerBird' } },
          totalUsage: { $sum: '$quantityUsed' },
          averageWaste: { $avg: '$wastePercentage' },
          totalCost: { $sum: '$costAnalysis.dailyCost' },
          recordCount: { $sum: 1 }
        }
      },
      { $sort: { averageEfficiency: 1 } }
    ]);

    // Get weather impact analysis
    const weatherImpact = await FeedUsage.aggregate([
      { 
        $match: { 
          ...matchFilter,
          weather: { $ne: '' }
        }
      },
      {
        $group: {
          _id: '$weather',
          averageConsumption: { $avg: '$quantityUsed' },
          averageEfficiency: { $avg: { $toDouble: '$feedPerBird' } },
          averageWaste: { $avg: '$wastePercentage' },
          recordCount: { $sum: 1 }
        }
      },
      { $sort: { averageConsumption: -1 } }
    ]);

    // Get quality observations summary
    const qualitySummary = await FeedUsage.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          avgBirdAppearance: { $avg: { $switch: {
            branches: [
              { case: { $eq: ['$qualityObservations.birdAppearance', 'Excellent'] }, then: 4 },
              { case: { $eq: ['$qualityObservations.birdAppearance', 'Good'] }, then: 3 },
              { case: { $eq: ['$qualityObservations.birdAppearance', 'Fair'] }, then: 2 },
              { case: { $eq: ['$qualityObservations.birdAppearance', 'Poor'] }, then: 1 }
            ],
            default: 3
          }}},
          avgFeedAcceptance: { $avg: { $switch: {
            branches: [
              { case: { $eq: ['$qualityObservations.feedAcceptance', 'Excellent'] }, then: 4 },
              { case: { $eq: ['$qualityObservations.feedAcceptance', 'Good'] }, then: 3 },
              { case: { $eq: ['$qualityObservations.feedAcceptance', 'Fair'] }, then: 2 },
              { case: { $eq: ['$qualityObservations.feedAcceptance', 'Poor'] }, then: 1 }
            ],
            default: 3
          }}},
          totalMortality: { $sum: '$healthIndicators.mortality' },
          totalEggProduction: { $sum: '$healthIndicators.eggProduction' },
          avgWeight: { $avg: '$healthIndicators.averageWeight' }
        }
      }
    ]);

    // Get cost analysis
    const costAnalysis = await FeedUsage.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$feedType',
          totalCost: { $sum: '$costAnalysis.dailyCost' },
          averageCostPerBird: { $avg: { $toDouble: '$costAnalysis.costPerBird' } },
          totalQuantity: { $sum: '$quantityUsed' },
          averageCostPerKg: { $avg: '$costAnalysis.costPerKg' }
        }
      },
      { $sort: { totalCost: -1 } }
    ]);

    // Calculate summary statistics
    const totalRecords = await FeedUsage.countDocuments(matchFilter);
    const totalUsage = await FeedUsage.aggregate([
      { $match: matchFilter },
      { $group: { _id: null, total: { $sum: '$quantityUsed' } } }
    ]);
    const totalCost = await FeedUsage.aggregate([
      { $match: matchFilter },
      { $group: { _id: null, total: { $sum: '$costAnalysis.dailyCost' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRecords,
          totalUsage: totalUsage[0]?.total || 0,
          totalCost: totalCost[0]?.total || 0,
          averageDailyUsage: totalRecords > 0 ? (totalUsage[0]?.total || 0) / totalRecords : 0,
          period: `${defaultStartDate} to ${defaultEndDate}`
        },
        consumptionTrends,
        efficiencyMetrics,
        weatherImpact,
        qualitySummary: qualitySummary[0] || {},
        costAnalysis
      }
    });
  } catch (error) {
    console.error('Error fetching feed usage analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feed usage analytics',
      error: error.message
    });
  }
};

// @desc    Verify feed usage record
// @route   PUT /api/feed-usage/:id/verify
// @access  Public
const verifyFeedUsage = async (req, res) => {
  try {
    const { verifierName } = req.body;
    
    if (!verifierName) {
      return res.status(400).json({
        success: false,
        message: 'Verifier name is required'
      });
    }

    const usage = await FeedUsage.findById(req.params.id);
    
    if (!usage) {
      return res.status(404).json({
        success: false,
        message: 'Feed usage record not found'
      });
    }

    await usage.verify(verifierName);

    res.status(200).json({
      success: true,
      message: 'Feed usage record verified successfully',
      data: usage
    });
  } catch (error) {
    console.error('Error verifying feed usage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify feed usage record',
      error: error.message
    });
  }
};

// @desc    Get single feed usage record by ID
// @route   GET /api/feed-usage/:id
// @access  Public
const getFeedUsageById = async (req, res) => {
  try {
    const usage = await FeedUsage.findById(req.params.id);
    
    if (!usage) {
      return res.status(404).json({
        success: false,
        message: 'Feed usage record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: usage
    });
  } catch (error) {
    console.error('Error fetching feed usage record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feed usage record',
      error: error.message
    });
  }
};

// @desc    Update feed usage record
// @route   PUT /api/feed-usage/:id
// @access  Public
const updateFeedUsage = async (req, res) => {
  try {
    const usage = await FeedUsage.findById(req.params.id);
    
    if (!usage) {
      return res.status(404).json({
        success: false,
        message: 'Feed usage record not found'
      });
    }

    // If quantity is being updated, adjust stock accordingly
    const oldQuantity = usage.quantityUsed;
    const newQuantity = req.body.quantityUsed;
    
    if (newQuantity !== undefined && newQuantity !== oldQuantity) {
      const currentMonth = usage.date.substring(0, 7);
      const stock = await FeedStock.findOne({ 
        feedType: usage.feedType, 
        month: currentMonth, 
        status: 'Active' 
      });

      if (stock) {
        const quantityDifference = newQuantity - oldQuantity;
        if (quantityDifference > stock.currentQuantity) {
          return res.status(400).json({
            success: false,
            message: `Cannot increase quantity by ${quantityDifference} KG. Only ${stock.currentQuantity} KG available in stock.`
          });
        }
        
        // Adjust stock quantity
        stock.currentQuantity -= quantityDifference;
        await stock.save();
      }
    }

    // Update allowed fields
    const allowedUpdates = [
      'quantityUsed', 'totalBirds', 'feedingTime', 'weather', 'temperature',
      'humidity', 'wastePercentage', 'location', 'qualityObservations',
      'healthIndicators', 'notes', 'batchesUsed'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        usage[field] = req.body[field];
      }
    });

    const updatedUsage = await usage.save();

    res.status(200).json({
      success: true,
      message: 'Feed usage record updated successfully',
      data: updatedUsage
    });
  } catch (error) {
    console.error('Error updating feed usage record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update feed usage record',
      error: error.message
    });
  }
};

// @desc    Delete feed usage record
// @route   DELETE /api/feed-usage/:id
// @access  Public
const deleteFeedUsage = async (req, res) => {
  try {
    const usage = await FeedUsage.findById(req.params.id);
    
    if (!usage) {
      return res.status(404).json({
        success: false,
        message: 'Feed usage record not found'
      });
    }

    // Restore quantity to stock
    const currentMonth = usage.date.substring(0, 7);
    const stock = await FeedStock.findOne({ 
      feedType: usage.feedType, 
      month: currentMonth 
    });

    if (stock) {
      stock.currentQuantity += usage.quantityUsed;
      await stock.save();
    }

    await FeedUsage.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Feed usage record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting feed usage record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete feed usage record',
      error: error.message
    });
  }
};

module.exports = {
  getFeedUsage,
  createFeedUsage,
  getFeedUsageAnalytics,
  verifyFeedUsage,
  getFeedUsageById,
  updateFeedUsage,
  deleteFeedUsage
};
