const EggProduction = require('../models/EggProduction');

// @desc    Get all egg production records
// @route   GET /api/egg-production
// @access  Public
const getEggProductionRecords = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'date', sortOrder = 'desc' } = req.query;
    
    const records = await EggProduction.find()
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await EggProduction.countDocuments();

    res.status(200).json({
      success: true,
      count: records.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: records
    });
  } catch (error) {
    console.error('Error fetching egg production records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch egg production records',
      error: error.message
    });
  }
};

// @desc    Create new egg production record
// @route   POST /api/egg-production
// @access  Public
const createEggProductionRecord = async (req, res) => {
  try {
    const { date, batchNumber, birds, eggsCollected, damagedEggs, notes } = req.body;

    // Validate required fields
    if (!date || !batchNumber || !birds || eggsCollected === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: date, batchNumber, birds, eggsCollected'
      });
    }

    // Create new record
    const newRecord = new EggProduction({
      date,
      batchNumber,
      birds,
      eggsCollected,
      damagedEggs: damagedEggs || 0,
      notes: notes || ''
    });

    const savedRecord = await newRecord.save();

    res.status(201).json({
      success: true,
      message: 'Egg production record created successfully',
      data: savedRecord
    });
  } catch (error) {
    console.error('Error creating egg production record:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A record with this batch number already exists for this date'
      });
    }

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
      message: 'Failed to create egg production record',
      error: error.message
    });
  }
};

// @desc    Get egg production summary/statistics
// @route   GET /api/egg-production/summary
// @access  Public
const getEggProductionSummary = async (req, res) => {
  try {
    const totalRecords = await EggProduction.countDocuments();
    const totalEggs = await EggProduction.aggregate([
      { $group: { _id: null, total: { $sum: '$eggsCollected' } } }
    ]);
    const totalDamagedEggs = await EggProduction.aggregate([
      { $group: { _id: null, total: { $sum: '$damagedEggs' } } }
    ]);
    const averageProductionRate = await EggProduction.aggregate([
      { $group: { _id: null, average: { $avg: '$eggProductionRate' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalRecords,
        totalEggs: totalEggs[0]?.total || 0,
        totalDamagedEggs: totalDamagedEggs[0]?.total || 0,
        averageProductionRate: averageProductionRate[0]?.average?.toFixed(2) || 0,
        effectiveEggs: (totalEggs[0]?.total || 0) - (totalDamagedEggs[0]?.total || 0)
      }
    });
  } catch (error) {
    console.error('Error fetching egg production summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch summary',
      error: error.message
    });
  }
};

// @desc    Get single egg production record by ID
// @route   GET /api/egg-production/:id
// @access  Public
const getEggProductionRecordById = async (req, res) => {
  try {
    const record = await EggProduction.findById(req.params.id);
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Egg production record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error('Error fetching egg production record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch egg production record',
      error: error.message
    });
  }
};

// @desc    Update egg production record
// @route   PUT /api/egg-production/:id
// @access  Public
const updateEggProductionRecord = async (req, res) => {
  try {
    const { date, batchNumber, birds, eggsCollected, damagedEggs, notes } = req.body;

    const record = await EggProduction.findById(req.params.id);
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Egg production record not found'
      });
    }

    // Update fields
    if (date !== undefined) record.date = date;
    if (batchNumber !== undefined) record.batchNumber = batchNumber;
    if (birds !== undefined) record.birds = birds;
    if (eggsCollected !== undefined) record.eggsCollected = eggsCollected;
    if (damagedEggs !== undefined) record.damagedEggs = damagedEggs;
    if (notes !== undefined) record.notes = notes;

    const updatedRecord = await record.save();

    res.status(200).json({
      success: true,
      message: 'Egg production record updated successfully',
      data: updatedRecord
    });
  } catch (error) {
    console.error('Error updating egg production record:', error);
    
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
      message: 'Failed to update egg production record',
      error: error.message
    });
  }
};

// @desc    Delete egg production record
// @route   DELETE /api/egg-production/:id
// @access  Public
const deleteEggProductionRecord = async (req, res) => {
  try {
    const record = await EggProduction.findById(req.params.id);
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Egg production record not found'
      });
    }

    await EggProduction.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Egg production record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting egg production record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete egg production record',
      error: error.message
    });
  }
};

module.exports = {
  getEggProductionRecords,
  getEggProductionRecordById,
  createEggProductionRecord,
  updateEggProductionRecord,
  deleteEggProductionRecord,
  getEggProductionSummary
};
