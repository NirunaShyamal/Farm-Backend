const express = require('express');
const {
  getFinancialRecords,
  createFinancialRecord,
  getFinancialSummary
} = require('../controllers/financialRecordController');

const router = express.Router();

// @route   GET /api/financial-records
// @desc    Get all financial records
// @access  Public
router.get('/', getFinancialRecords);

// @route   POST /api/financial-records
// @desc    Create new financial record
// @access  Public
router.post('/', createFinancialRecord);

// @route   GET /api/financial-records/summary
// @desc    Get financial summary/statistics
// @access  Public
router.get('/summary', getFinancialSummary);

module.exports = router;

