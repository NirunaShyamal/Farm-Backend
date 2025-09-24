const mongoose = require('mongoose');

const salesOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: [true, 'Order number is required'],
    unique: true,
    trim: true
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  customerPhone: {
    type: String,
    required: [true, 'Customer phone is required'],
    trim: true
  },
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  productType: {
    type: String,
    required: [true, 'Product type is required'],
    enum: ['Small Eggs', 'Medium Eggs', 'Large Eggs', 'Extra Large Eggs', 'Mixed Size'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative']
  },
  totalAmount: {
    type: Number,
    default: function() {
      return this.quantity * this.unitPrice;
    }
  },
  orderDate: {
    type: String,
    required: [true, 'Order date is required'],
    trim: true
  },
  deliveryDate: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Ready', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Partial', 'Paid'],
    default: 'Pending'
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

// Calculate total amount before saving
salesOrderSchema.pre('save', function(next) {
  this.totalAmount = this.quantity * this.unitPrice;
  next();
});

module.exports = mongoose.model('SalesOrder', salesOrderSchema);
