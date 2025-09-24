const express = require('express');
const {
  getFinancialRecords,
  getFinancialRecordById,
  createFinancialRecord,
  updateFinancialRecord,
  deleteFinancialRecord,
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

// @route   GET /api/financial-records/:id
// @desc    Get single financial record by ID
// @access  Public
router.get('/:id', getFinancialRecordById);

// @route   PUT /api/financial-records/:id
// @desc    Update financial record
// @access  Public
router.put('/:id', updateFinancialRecord);

// @route   DELETE /api/financial-records/:id
// @desc    Delete financial record
// @access  Public
router.delete('/:id', deleteFinancialRecord);

module.exports = router;
