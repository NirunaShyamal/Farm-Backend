const express = require('express');
const {
  getEggProductionRecords,
  getEggProductionRecordById,
  createEggProductionRecord,
  updateEggProductionRecord,
  deleteEggProductionRecord,
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

// @route   GET /api/egg-production/:id
// @desc    Get single egg production record by ID
// @access  Public
router.get('/:id', getEggProductionRecordById);

// @route   PUT /api/egg-production/:id
// @desc    Update egg production record
// @access  Public
router.put('/:id', updateEggProductionRecord);

// @route   DELETE /api/egg-production/:id
// @desc    Delete egg production record
// @access  Public
router.delete('/:id', deleteEggProductionRecord);

module.exports = router;
