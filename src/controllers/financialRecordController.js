const FinancialRecord = require('../models/FinancialRecord');

// @desc    Get all financial records
// @route   GET /api/financial-records
// @access  Public
const getFinancialRecords = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, paymentMethod, sortBy = 'date', sortOrder = 'desc' } = req.query;
    
    // Build filter
    const filter = {};
    if (category) filter.category = category;
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    const records = await FinancialRecord.find(filter)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await FinancialRecord.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: records.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: records
    });
  } catch (error) {
    console.error('Error fetching financial records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch financial records',
      error: error.message
    });
  }
};

// @desc    Create new financial record
// @route   POST /api/financial-records
// @access  Public
const createFinancialRecord = async (req, res) => {
  try {
    const {
      date,
      description,
      category,
      subcategory,
      amount,
      paymentMethod,
      reference,
      customerSupplier,
      location,
      taxAmount,
      status,
      receiptUrl,
      notes
    } = req.body;

    // Validate required fields
    if (!date || !description || !category || !amount || !paymentMethod || !reference) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: date, description, category, amount, paymentMethod, reference'
      });
    }

    // Create new record
    const recordData = {
      date,
      description,
      category,
      amount,
      paymentMethod,
      reference,
      customerSupplier: customerSupplier || '',
      location: location || 'Farm',
      taxAmount: taxAmount || 0,
      status: status || 'Completed',
      receiptUrl: receiptUrl || '',
      notes: notes || ''
    };

    // Only add subcategory if it's provided and not empty
    if (subcategory && subcategory.trim() !== '') {
      recordData.subcategory = subcategory;
    }

    const newRecord = new FinancialRecord(recordData);
    const savedRecord = await newRecord.save();

    res.status(201).json({
      success: true,
      message: 'Financial record created successfully',
      data: savedRecord
    });
  } catch (error) {
    console.error('Error creating financial record:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Reference number already exists'
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
      message: 'Failed to create financial record',
      error: error.message
    });
  }
};

// @desc    Get financial summary/statistics
// @route   GET /api/financial-records/summary
// @access  Public
const getFinancialSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filter if provided
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.$gte = startDate;
      if (endDate) dateFilter.date.$lte = endDate;
    }

    // Total income
    const totalIncome = await FinancialRecord.aggregate([
      { $match: { category: 'Income', ...dateFilter } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Total expenses
    const totalExpenses = await FinancialRecord.aggregate([
      { $match: { category: 'Expense', ...dateFilter } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const incomeAmount = totalIncome[0]?.total || 0;
    const expenseAmount = totalExpenses[0]?.total || 0;
    const netProfit = incomeAmount - expenseAmount;

    // Income by subcategory
    const incomeBySubcategory = await FinancialRecord.aggregate([
      { $match: { category: 'Income', ...dateFilter } },
      { $group: { _id: '$subcategory', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } }
    ]);

    // Expenses by subcategory
    const expensesBySubcategory = await FinancialRecord.aggregate([
      { $match: { category: 'Expense', ...dateFilter } },
      { $group: { _id: '$subcategory', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } }
    ]);

    // Records by payment method
    const recordsByPaymentMethod = await FinancialRecord.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$amount' } } },
      { $sort: { total: -1 } }
    ]);

    // Monthly trends (last 6 months)
    const monthlyTrends = await FinancialRecord.aggregate([
      {
        $group: {
          _id: {
            month: { $substr: ['$date', 5, 2] },
            year: { $substr: ['$date', 0, 4] },
            category: '$category'
          },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    // This month's data
    const currentMonth = new Date().toISOString().substr(0, 7); // YYYY-MM
    const thisMonthIncome = await FinancialRecord.aggregate([
      { $match: { category: 'Income', date: { $regex: `^${currentMonth}` } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const thisMonthExpenses = await FinancialRecord.aggregate([
      { $match: { category: 'Expense', date: { $regex: `^${currentMonth}` } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalIncome: incomeAmount,
        totalExpenses: expenseAmount,
        netProfit,
        thisMonthIncome: thisMonthIncome[0]?.total || 0,
        thisMonthExpenses: thisMonthExpenses[0]?.total || 0,
        thisMonthProfit: (thisMonthIncome[0]?.total || 0) - (thisMonthExpenses[0]?.total || 0),
        incomeBySubcategory,
        expensesBySubcategory,
        recordsByPaymentMethod,
        monthlyTrends
      }
    });
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch financial summary',
      error: error.message
    });
  }
};

// @desc    Get single financial record by ID
// @route   GET /api/financial-records/:id
// @access  Public
const getFinancialRecordById = async (req, res) => {
  try {
    const record = await FinancialRecord.findById(req.params.id);
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Financial record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error('Error fetching financial record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch financial record',
      error: error.message
    });
  }
};

// @desc    Update financial record
// @route   PUT /api/financial-records/:id
// @access  Public
const updateFinancialRecord = async (req, res) => {
  try {
    const { date, description, category, subcategory, amount, paymentMethod, reference, customerSupplier, location, taxAmount, status, receiptUrl, notes } = req.body;

    const record = await FinancialRecord.findById(req.params.id);
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Financial record not found'
      });
    }

    // Update fields
    if (date !== undefined) record.date = date;
    if (description !== undefined) record.description = description;
    if (category !== undefined) record.category = category;
    if (subcategory !== undefined) record.subcategory = subcategory;
    if (amount !== undefined) record.amount = amount;
    if (paymentMethod !== undefined) record.paymentMethod = paymentMethod;
    if (reference !== undefined) record.reference = reference;
    if (customerSupplier !== undefined) record.customerSupplier = customerSupplier;
    if (location !== undefined) record.location = location;
    if (taxAmount !== undefined) record.taxAmount = taxAmount;
    if (status !== undefined) record.status = status;
    if (receiptUrl !== undefined) record.receiptUrl = receiptUrl;
    if (notes !== undefined) record.notes = notes;

    const updatedRecord = await record.save();

    res.status(200).json({
      success: true,
      message: 'Financial record updated successfully',
      data: updatedRecord
    });
  } catch (error) {
    console.error('Error updating financial record:', error);
    
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
      message: 'Failed to update financial record',
      error: error.message
    });
  }
};

// @desc    Delete financial record
// @route   DELETE /api/financial-records/:id
// @access  Public
const deleteFinancialRecord = async (req, res) => {
  try {
    const record = await FinancialRecord.findById(req.params.id);
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Financial record not found'
      });
    }

    await FinancialRecord.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Financial record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting financial record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete financial record',
      error: error.message
    });
  }
};

module.exports = {
  getFinancialRecords,
  getFinancialRecordById,
  createFinancialRecord,
  updateFinancialRecord,
  deleteFinancialRecord,
  getFinancialSummary
};
