const mongoose = require('mongoose');

const feedStockSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Feed type is required'],
    enum: ['Layer Feed', 'Chick Starter', 'Grower Feed', 'Medicated Feed', 'Organic Feed', 'Finisher Feed'],
    trim: true
  },
  // Keep both type and feedType for compatibility
  feedType: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative']
  },
  // Keep both quantity and currentQuantity for compatibility
  currentQuantity: {
    type: Number,
    min: [0, 'Current quantity cannot be negative']
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
    trim: true,
    default: ''
  },
  lastRestocked: {
    type: String,
    trim: true
  },
  costPerUnit: {
    type: Number,
    min: [0, 'Cost per unit cannot be negative'],
    default: 0
  },
  totalCost: {
    type: Number,
    default: 0
  },
  minimumThreshold: {
    type: Number,
    default: 100,
    min: [0, 'Minimum threshold cannot be negative']
  },
  isLowStock: {
    type: Boolean,
    default: false
  },
  expiryDate: {
    type: String,
    required: [true, 'Expiry date is required'],
    trim: true
  },
  location: {
    type: String,
    trim: true,
    default: 'Main Storage'
  },
  batchNumber: {
    type: String,
    trim: true
  },
  deliveryDate: {
    type: String,
    trim: true
  },
  qualityGrade: {
    type: String,
    enum: ['A', 'B', 'C'],
    default: 'A'
  },
  averageDailyConsumption: {
    type: Number,
    default: 0,
    min: [0, 'Average daily consumption cannot be negative']
  },
  projectedFinishDate: {
    type: Date
  },
  daysRemaining: {
    type: Number,
    default: function() {
      if (this.averageDailyConsumption > 0) {
        return Math.floor(this.currentQuantity / this.averageDailyConsumption);
      }
      return 0;
    }
  },
  daysUntilExpiry: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Active', 'Depleted', 'Expired', 'Reserved'],
    default: 'Active'
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create compound index for feedType and month
feedStockSchema.index({ feedType: 1, month: 1 }, { unique: true });

// Calculate derived fields before saving
feedStockSchema.pre('save', function(next) {
  // Sync type and feedType fields
  if (this.type && !this.feedType) {
    this.feedType = this.type;
  } else if (this.feedType && !this.type) {
    this.type = this.feedType;
  }
  
  // Sync quantity and currentQuantity fields
  if (this.quantity !== undefined && this.currentQuantity === undefined) {
    this.currentQuantity = this.quantity;
  } else if (this.currentQuantity !== undefined && this.quantity === undefined) {
    this.quantity = this.currentQuantity;
  }
  
  this.totalCost = this.quantity * this.costPerUnit;
  this.isLowStock = this.quantity <= this.minimumThreshold;
  
  // Calculate consumption-based days remaining (how long stock will last)
  if (this.averageDailyConsumption > 0) {
    this.daysRemaining = Math.floor(this.quantity / this.averageDailyConsumption);
    
    // Calculate projected finish date
    if (this.daysRemaining > 0) {
      this.projectedFinishDate = new Date(Date.now() + (this.daysRemaining * 24 * 60 * 60 * 1000));
    }
  }
  
  // Calculate expiry-based days remaining (days until expiration)
  const expiryDate = new Date(this.expiryDate);
  const currentDate = new Date();
  this.daysUntilExpiry = Math.floor((expiryDate - currentDate) / (1000 * 60 * 60 * 24));
  
  // Update status based on quantity
  if (this.quantity <= 0) {
    this.status = 'Depleted';
  } else if (new Date(this.expiryDate) < new Date()) {
    this.status = 'Expired';
  } else {
    this.status = 'Active';
  }
  
  this.lastUpdated = new Date();
  next();
});

// Instance method to update consumption average
feedStockSchema.methods.updateConsumptionAverage = function(totalUsage, daysCount) {
  if (daysCount > 0) {
    this.averageDailyConsumption = totalUsage / daysCount;
  }
  return this.save();
};

// Instance method to deduct usage
feedStockSchema.methods.deductUsage = function(amount) {
  if (amount > this.quantity) {
    throw new Error('Cannot deduct more than available quantity');
  }
  this.quantity -= amount;
  this.currentQuantity = this.quantity; // Sync both fields
  return this.save();
};

// Static method to get active stock by feed type
feedStockSchema.statics.getActiveStock = function(feedType, month) {
  return this.findOne({ 
    feedType, 
    month, 
    status: 'Active' 
  });
};

module.exports = mongoose.model('FeedStock', feedStockSchema, 'feedinventories');
