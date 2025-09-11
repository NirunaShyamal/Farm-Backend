const express = require('express');
const {
  getEggProductionRecords,
  createEggProductionRecord,
  getEggProductionSummary
} = require('../controllers/eggProductionController');

const router = express.Router();

// @route   GET /api/egg-production
// @desc    Get all egg production records
// @access  Public
router.get('/', getEggProductionRecords);

// @route   POST /api/egg-production
// @desc    Create new egg production record
// @access  Public
router.post('/', createEggProductionRecord);

// @route   GET /api/egg-production/summary
// @desc    Get egg production summary/statistics
// @access  Public
router.get('/summary', getEggProductionSummary);

module.exports = router;

