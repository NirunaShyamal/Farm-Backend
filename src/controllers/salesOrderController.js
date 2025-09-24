const SalesOrder = require('../models/SalesOrder');

// @desc    Get all sales orders
// @route   GET /api/sales-orders
// @access  Public
const getSalesOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, sortBy = 'orderDate', sortOrder = 'desc' } = req.query;
    
    // Build filter
    const filter = {};
    if (status) filter.status = status;

    const orders = await SalesOrder.find(filter)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await SalesOrder.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: orders
    });
  } catch (error) {
    console.error('Error fetching sales orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales orders',
      error: error.message
    });
  }
};

// @desc    Create new sales order
// @route   POST /api/sales-orders
// @access  Public
const createSalesOrder = async (req, res) => {
  try {
    const {
      orderNumber,
      customerName,
      customerPhone,
      customerEmail,
      productType,
      quantity,
      unitPrice,
      orderDate,
      deliveryDate,
      status,
      paymentStatus,
      notes
    } = req.body;

    // Validate required fields
    if (!orderNumber || !customerName || !customerPhone || !productType || !quantity || !unitPrice || !orderDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: orderNumber, customerName, customerPhone, productType, quantity, unitPrice, orderDate'
      });
    }

    // Create new order
    const newOrder = new SalesOrder({
      orderNumber,
      customerName,
      customerPhone,
      customerEmail: customerEmail || '',
      productType,
      quantity,
      unitPrice,
      orderDate,
      deliveryDate: deliveryDate || '',
      status: status || 'Pending',
      paymentStatus: paymentStatus || 'Pending',
      notes: notes || ''
    });

    const savedOrder = await newOrder.save();

    res.status(201).json({
      success: true,
      message: 'Sales order created successfully',
      data: savedOrder
    });
  } catch (error) {
    console.error('Error creating sales order:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Order number already exists'
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create sales order',
      error: error.message
    });
  }
};

// @desc    Get sales summary/statistics
// @route   GET /api/sales-orders/summary
// @access  Public
const getSalesSummary = async (req, res) => {
  try {
    const totalOrders = await SalesOrder.countDocuments();
    const totalRevenue = await SalesOrder.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const pendingOrders = await SalesOrder.countDocuments({ status: 'Pending' });
    const completedOrders = await SalesOrder.countDocuments({ status: 'Delivered' });
    
    // Get orders by status
    const ordersByStatus = await SalesOrder.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get top products
    const topProducts = await SalesOrder.aggregate([
      { $group: { _id: '$productType', totalQuantity: { $sum: '$quantity' }, totalRevenue: { $sum: '$totalAmount' } } },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingOrders,
        completedOrders,
        ordersByStatus,
        topProducts
      }
    });
  } catch (error) {
    console.error('Error fetching sales summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales summary',
      error: error.message
    });
  }
};

// @desc    Get single sales order by ID
// @route   GET /api/sales-orders/:id
// @access  Public
const getSalesOrderById = async (req, res) => {
  try {
    const order = await SalesOrder.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Sales order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching sales order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales order',
      error: error.message
    });
  }
};

// @desc    Update sales order
// @route   PUT /api/sales-orders/:id
// @access  Public
const updateSalesOrder = async (req, res) => {
  try {
    const {
      orderNumber,
      customerName,
      customerPhone,
      customerEmail,
      productType,
      quantity,
      unitPrice,
      orderDate,
      deliveryDate,
      status,
      paymentStatus,
      notes
    } = req.body;

    const order = await SalesOrder.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Sales order not found'
      });
    }

    // Update fields
    if (orderNumber !== undefined) order.orderNumber = orderNumber;
    if (customerName !== undefined) order.customerName = customerName;
    if (customerPhone !== undefined) order.customerPhone = customerPhone;
    if (customerEmail !== undefined) order.customerEmail = customerEmail;
    if (productType !== undefined) order.productType = productType;
    if (quantity !== undefined) order.quantity = quantity;
    if (unitPrice !== undefined) order.unitPrice = unitPrice;
    if (orderDate !== undefined) order.orderDate = orderDate;
    if (deliveryDate !== undefined) order.deliveryDate = deliveryDate;
    if (status !== undefined) order.status = status;
    if (paymentStatus !== undefined) order.paymentStatus = paymentStatus;
    if (notes !== undefined) order.notes = notes;

    const updatedOrder = await order.save();

    res.status(200).json({
      success: true,
      message: 'Sales order updated successfully',
      data: updatedOrder
    });
  } catch (error) {
    console.error('Error updating sales order:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update sales order',
      error: error.message
    });
  }
};

// @desc    Delete sales order
// @route   DELETE /api/sales-orders/:id
// @access  Public
const deleteSalesOrder = async (req, res) => {
  try {
    const order = await SalesOrder.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Sales order not found'
      });
    }

    await SalesOrder.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Sales order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting sales order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete sales order',
      error: error.message
    });
  }
};

module.exports = {
  getSalesOrders,
  getSalesOrderById,
  createSalesOrder,
  updateSalesOrder,
  deleteSalesOrder,
  getSalesSummary
};
