const mongoose = require('mongoose');

const feedInventorySchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Feed type is required'],
    enum: ['Layer Feed', 'Chick Starter', 'Grower Feed', 'Medicated Feed', 'Organic Feed'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative']
  },
  unit: {
    type: String,
    default: 'KG',
    enum: ['KG', 'LBS', 'TONS']
  },
  supplier: {
    type: String,
    required: [true, 'Supplier is required'],
    trim: true
  },
  supplierContact: {
    type: String,
    trim: true
  },
  lastRestocked: {
    type: String,
    required: [true, 'Last restocked date is required'],
    trim: true
  },
  expiryDate: {
    type: String,
    required: [true, 'Expiry date is required'],
    trim: true
  },
  costPerUnit: {
    type: Number,
    min: [0, 'Cost per unit cannot be negative'],
    default: 0
  },
  totalCost: {
    type: Number,
    default: function() {
      return this.quantity * this.costPerUnit;
    }
  },
  minimumThreshold: {
    type: Number,
    default: 100,
    min: [0, 'Minimum threshold cannot be negative']
  },
  isLowStock: {
    type: Boolean,
    default: function() {
      return this.quantity <= this.minimumThreshold;
    }
  },
  location: {
    type: String,
    trim: true,
    default: 'Main Storage'
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

// Calculate total cost and check low stock before saving
feedInventorySchema.pre('save', function(next) {
  this.totalCost = this.quantity * this.costPerUnit;
  this.isLowStock = this.quantity <= this.minimumThreshold;
  next();
});

module.exports = mongoose.model('FeedInventory', feedInventorySchema);
