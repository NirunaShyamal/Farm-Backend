const express = require('express');
const {
  getFeedStock,
  createOrUpdateFeedStock,
  getFeedStockDashboard,
  deductUsageFromStock,
  getFeedStockById,
  updateFeedStock,
  deleteFeedStock
} = require('../controllers/feedStockController');

const router = express.Router();

// @route   GET /api/feed-stock
// @desc    Get all feed stock items
// @access  Public
router.get('/', getFeedStock);

// @route   GET /api/feed-stock/dashboard
// @desc    Get feed stock dashboard summary
// @access  Public
router.get('/dashboard', getFeedStockDashboard);

// @route   GET /api/feed-stock/:id
// @desc    Get single feed stock item by ID
// @access  Public
router.get('/:id', getFeedStockById);

// @route   POST /api/feed-stock
// @desc    Create or update monthly feed stock
// @access  Public
router.post('/', createOrUpdateFeedStock);

// @route   POST /api/feed-stock/:id/deduct
// @desc    Deduct usage from stock
// @access  Public
router.post('/:id/deduct', deductUsageFromStock);

// @route   PUT /api/feed-stock/:id
// @desc    Update feed stock
// @access  Public
router.put('/:id', updateFeedStock);

// @route   DELETE /api/feed-stock/:id
// @desc    Delete feed stock
// @access  Public
router.delete('/:id', deleteFeedStock);

module.exports = router;
