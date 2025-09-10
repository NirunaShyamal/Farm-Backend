const express = require('express');
const {
  getFeedInventory,
  createFeedInventoryItem,
  getFeedInventorySummary
} = require('../controllers/feedInventoryController');

const router = express.Router();

// @route   GET /api/feed-inventory
// @desc    Get all feed inventory items
// @access  Public
router.get('/', getFeedInventory);

// @route   POST /api/feed-inventory
// @desc    Create new feed inventory item
// @access  Public
router.post('/', createFeedInventoryItem);

// @route   GET /api/feed-inventory/summary
// @desc    Get feed inventory summary/statistics
// @access  Public
router.get('/summary', getFeedInventorySummary);

module.exports = router;

