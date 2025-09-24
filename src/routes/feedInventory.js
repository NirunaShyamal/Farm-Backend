const express = require('express');
const {
  getFeedInventory,
  getFeedInventoryItemById,
  createFeedInventoryItem,
  updateFeedInventoryItem,
  deleteFeedInventoryItem,
  getFeedInventorySummary
} = require('../controllers/feedInventoryController');

const router = express.Router();

// @route   GET /api/feed-inventory
// @desc    Get all feed inventory items
// @access  Public
router.get('/', getFeedInventory);

// @route   GET /api/feed-inventory/summary
// @desc    Get feed inventory summary/statistics
// @access  Public
router.get('/summary', getFeedInventorySummary);

// @route   GET /api/feed-inventory/:id
// @desc    Get single feed inventory item by ID
// @access  Public
router.get('/:id', getFeedInventoryItemById);

// @route   POST /api/feed-inventory
// @desc    Create new feed inventory item
// @access  Public
router.post('/', createFeedInventoryItem);

// @route   PUT /api/feed-inventory/:id
// @desc    Update feed inventory item
// @access  Public
router.put('/:id', updateFeedInventoryItem);

// @route   DELETE /api/feed-inventory/:id
// @desc    Delete feed inventory item
// @access  Public
router.delete('/:id', deleteFeedInventoryItem);

module.exports = router;
