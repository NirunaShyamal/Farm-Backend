const express = require('express');
const {
  getSalesOrders,
  createSalesOrder,
  getSalesSummary
} = require('../controllers/salesOrderController');

const router = express.Router();

// @route   GET /api/sales-orders
// @desc    Get all sales orders
// @access  Public
router.get('/', getSalesOrders);

// @route   POST /api/sales-orders
// @desc    Create new sales order
// @access  Public
router.post('/', createSalesOrder);

// @route   GET /api/sales-orders/summary
// @desc    Get sales summary/statistics
// @access  Public
router.get('/summary', getSalesSummary);

module.exports = router;

