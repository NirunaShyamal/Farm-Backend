const mongoose = require('mongoose');

const financialRecordSchema = new mongoose.Schema({
  date: {
    type: String,
    required: [true, 'Date is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Income', 'Expense'],
    trim: true
  },
  subcategory: {
    type: String,
    trim: true,
    required: false,
    enum: [
      // Income subcategories
      'Egg Sales', 'Chick Sales', 'Equipment Rental', 'Government Subsidies', 'Other Income',
      // Expense subcategories
      'Feed & Nutrition', 'Veterinary Services', 'Equipment & Maintenance', 'Labor Costs', 'Utilities & Overhead', 'Other Expenses'
    ]
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['Cash', 'Bank Transfer', 'Cheque', 'Digital Wallet', 'Credit Card', 'Debit Card'],
    trim: true
  },
  reference: {
    type: String,
    required: [true, 'Reference number is required'],
    trim: true,
    unique: true
  },
  customerSupplier: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true,
    default: 'Farm'
  },
  taxAmount: {
    type: Number,
    min: [0, 'Tax amount cannot be negative'],
    default: 0
  },
  netAmount: {
    type: Number,
    default: function() {
      return this.amount - this.taxAmount;
    }
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Cancelled'],
    default: 'Completed'
  },
  receiptUrl: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

// Calculate net amount before saving
financialRecordSchema.pre('save', function(next) {
  this.netAmount = this.amount - this.taxAmount;
  next();
});

// Index for efficient queries
financialRecordSchema.index({ date: 1, category: 1 });
// Note: reference field already has unique: true which creates an index automatically

module.exports = mongoose.model('FinancialRecord', financialRecordSchema);
