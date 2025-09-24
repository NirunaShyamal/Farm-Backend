const FeedInventory = require('../models/FeedInventory');

// @desc    Get all feed inventory items
// @route   GET /api/feed-inventory
// @access  Public
const getFeedInventory = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, lowStock, sortBy = 'type', sortOrder = 'asc' } = req.query;
    
    // Build filter
    const filter = {};
    if (type) filter.type = type;
    if (lowStock === 'true') filter.isLowStock = true;

    const items = await FeedInventory.find(filter)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await FeedInventory.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: items.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: items
    });
  } catch (error) {
    console.error('Error fetching feed inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feed inventory',
      error: error.message
    });
  }
};

// @desc    Create new feed inventory item
// @route   POST /api/feed-inventory
// @access  Public
const createFeedInventoryItem = async (req, res) => {
  try {
    const {
      type,
      quantity,
      unit,
      supplier,
      supplierContact,
      lastRestocked,
      expiryDate,
      costPerUnit,
      minimumThreshold,
      location,
      notes
    } = req.body;

    // Validate required fields
    if (!type || quantity === undefined || !supplier || !lastRestocked || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: type, quantity, supplier, lastRestocked, expiryDate'
      });
    }

    // Create new item
    const newItem = new FeedInventory({
      type,
      quantity,
      unit: unit || 'KG',
      supplier,
      supplierContact: supplierContact || '',
      lastRestocked,
      expiryDate,
      costPerUnit: costPerUnit || 0,
      minimumThreshold: minimumThreshold || 100,
      location: location || 'Main Storage',
      notes: notes || ''
    });

    const savedItem = await newItem.save();

    res.status(201).json({
      success: true,
      message: 'Feed inventory item created successfully',
      data: savedItem
    });
  } catch (error) {
    console.error('Error creating feed inventory item:', error);
    
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
      message: 'Failed to create feed inventory item',
      error: error.message
    });
  }
};

// @desc    Get feed inventory summary/statistics
// @route   GET /api/feed-inventory/summary
// @access  Public
const getFeedInventorySummary = async (req, res) => {
  try {
    const totalItems = await FeedInventory.countDocuments();
    const totalQuantity = await FeedInventory.aggregate([
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]);
    const totalValue = await FeedInventory.aggregate([
      { $group: { _id: null, total: { $sum: '$totalCost' } } }
    ]);
    const lowStockItems = await FeedInventory.countDocuments({ isLowStock: true });
    
    // Get inventory by type
    const inventoryByType = await FeedInventory.aggregate([
      { $group: { _id: '$type', totalQuantity: { $sum: '$quantity' }, totalValue: { $sum: '$totalCost' } } },
      { $sort: { totalQuantity: -1 } }
    ]);

    // Get low stock items
    const lowStockItemsList = await FeedInventory.find({ isLowStock: true })
      .select('type quantity minimumThreshold supplier')
      .sort({ quantity: 1 });

    // Calculate days feed will last (assuming 300kg daily consumption)
    const dailyConsumption = 300;
    const daysWillLast = Math.floor((totalQuantity[0]?.total || 0) / dailyConsumption);

    res.status(200).json({
      success: true,
      data: {
        totalItems,
        totalQuantity: totalQuantity[0]?.total || 0,
        totalValue: totalValue[0]?.total || 0,
        lowStockItems,
        daysWillLast,
        dailyConsumption,
        inventoryByType,
        lowStockItemsList
      }
    });
  } catch (error) {
    console.error('Error fetching feed inventory summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feed inventory summary',
      error: error.message
    });
  }
};

// @desc    Get single feed inventory item by ID
// @route   GET /api/feed-inventory/:id
// @access  Public
const getFeedInventoryItemById = async (req, res) => {
  try {
    const item = await FeedInventory.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Feed inventory item not found'
      });
    }

    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Error fetching feed inventory item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feed inventory item',
      error: error.message
    });
  }
};

// @desc    Update feed inventory item
// @route   PUT /api/feed-inventory/:id
// @access  Public
const updateFeedInventoryItem = async (req, res) => {
  try {
    const item = await FeedInventory.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Feed inventory item not found'
      });
    }

    // Update all fields from request body
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        item[key] = req.body[key];
      }
    });

    const updatedItem = await item.save();

    res.status(200).json({
      success: true,
      message: 'Feed inventory item updated successfully',
      data: updatedItem
    });
  } catch (error) {
    console.error('Error updating feed inventory item:', error);
    
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
      message: 'Failed to update feed inventory item',
      error: error.message
    });
  }
};

// @desc    Delete feed inventory item
// @route   DELETE /api/feed-inventory/:id
// @access  Public
const deleteFeedInventoryItem = async (req, res) => {
  try {
    const item = await FeedInventory.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Feed inventory item not found'
      });
    }

    await FeedInventory.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Feed inventory item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting feed inventory item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete feed inventory item',
      error: error.message
    });
  }
};

module.exports = {
  getFeedInventory,
  getFeedInventoryItemById,
  createFeedInventoryItem,
  updateFeedInventoryItem,
  deleteFeedInventoryItem,
  getFeedInventorySummary
};
