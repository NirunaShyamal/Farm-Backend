const express = require('express');
const {
  getSalesOrders,
  getSalesOrderById,
  createSalesOrder,
  updateSalesOrder,
  deleteSalesOrder,
  getSalesSummary
} = require('../controllers/salesOrderController');

const router = express.Router();

// @route   GET /api/sales-orders
// @desc    Get all sales orders
// @access  Public
router.get('/', getSalesOrders);

// @route   GET /api/sales-orders/summary
// @desc    Get sales summary/statistics
// @access  Public
router.get('/summary', getSalesSummary);

// @route   GET /api/sales-orders/:id
// @desc    Get single sales order by ID
// @access  Public
router.get('/:id', getSalesOrderById);

// @route   POST /api/sales-orders
// @desc    Create new sales order
// @access  Public
router.post('/', createSalesOrder);

// @route   PUT /api/sales-orders/:id
// @desc    Update sales order
// @access  Public
router.put('/:id', updateSalesOrder);

// @route   DELETE /api/sales-orders/:id
// @desc    Delete sales order
// @access  Public
router.delete('/:id', deleteSalesOrder);

module.exports = router;
