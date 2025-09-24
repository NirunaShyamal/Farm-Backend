const express = require('express');
const {
  getFeedUsage,
  createFeedUsage,
  getFeedUsageAnalytics,
  verifyFeedUsage,
  getFeedUsageById,
  updateFeedUsage,
  deleteFeedUsage
} = require('../controllers/feedUsageController');

const router = express.Router();

// @route   GET /api/feed-usage
// @desc    Get all feed usage records
// @access  Public
router.get('/', getFeedUsage);

// @route   GET /api/feed-usage/analytics
// @desc    Get feed usage analytics
// @access  Public
router.get('/analytics', getFeedUsageAnalytics);

// @route   GET /api/feed-usage/:id
// @desc    Get single feed usage record by ID
// @access  Public
router.get('/:id', getFeedUsageById);

// @route   POST /api/feed-usage
// @desc    Create new feed usage record
// @access  Public
router.post('/', createFeedUsage);

// @route   PUT /api/feed-usage/:id
// @desc    Update feed usage record
// @access  Public
router.put('/:id', updateFeedUsage);

// @route   PUT /api/feed-usage/:id/verify
// @desc    Verify feed usage record
// @access  Public
router.put('/:id/verify', verifyFeedUsage);

// @route   DELETE /api/feed-usage/:id
// @desc    Delete feed usage record
// @access  Public
router.delete('/:id', deleteFeedUsage);

module.exports = router;
