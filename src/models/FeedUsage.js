const mongoose = require('mongoose');

const feedUsageSchema = new mongoose.Schema({
  feedType: {
    type: String,
    required: [true, 'Feed type is required'],
    enum: ['Layer Feed', 'Chick Starter', 'Grower Feed', 'Medicated Feed', 'Organic Feed', 'Finisher Feed'],
    trim: true
  },
  date: {
    type: String,
    required: [true, 'Date is required'],
    trim: true // Format: "2025-01-15"
  },
  quantityUsed: {
    type: Number,
    required: [true, 'Quantity used is required'],
    min: [0, 'Quantity used cannot be negative']
  },
  unit: {
    type: String,
    default: 'KG',
    enum: ['KG', 'LBS', 'TONS']
  },
  batchesUsed: [{
    batchNumber: String,
    birds: Number,
    quantity: Number
  }],
  totalBirds: {
    type: Number,
    required: [true, 'Total number of birds is required'],
    min: [1, 'Must have at least 1 bird']
  },
  feedPerBird: {
    type: Number,
    default: function() {
      return this.totalBirds > 0 ? (this.quantityUsed / this.totalBirds).toFixed(3) : 0;
    }
  },
  feedingTime: {
    type: String,
    enum: ['Morning', 'Afternoon', 'Evening', 'Full Day'],
    default: 'Full Day'
  },
  weather: {
    type: String,
    enum: ['Sunny', 'Rainy', 'Cloudy', 'Hot', 'Cold'],
    trim: true
  },
  temperature: {
    type: Number // in Celsius
  },
  humidity: {
    type: Number // percentage
  },
  wastePercentage: {
    type: Number,
    default: 0,
    min: [0, 'Waste percentage cannot be negative'],
    max: [100, 'Waste percentage cannot exceed 100%']
  },
  actualConsumption: {
    type: Number,
    default: function() {
      return this.quantityUsed * (1 - this.wastePercentage / 100);
    }
  },
  feedEfficiency: {
    type: Number, // grams of feed per gram of egg production
    default: 0
  },
  location: {
    type: String,
    trim: true,
    default: 'Main Coop'
  },
  recordedBy: {
    type: String,
    required: [true, 'Recorded by is required'],
    trim: true
  },
  qualityObservations: {
    birdAppearance: {
      type: String,
      enum: ['Excellent', 'Good', 'Fair', 'Poor'],
      default: 'Good'
    },
    feedAcceptance: {
      type: String,
      enum: ['Excellent', 'Good', 'Fair', 'Poor'],
      default: 'Good'
    },
    waterConsumption: {
      type: String,
      enum: ['Normal', 'High', 'Low'],
      default: 'Normal'
    }
  },
  healthIndicators: {
    mortality: {
      type: Number,
      default: 0,
      min: [0, 'Mortality cannot be negative']
    },
    eggProduction: {
      type: Number,
      default: 0,
      min: [0, 'Egg production cannot be negative']
    },
    averageWeight: {
      type: Number,
      default: 0,
      min: [0, 'Average weight cannot be negative']
    }
  },
  costAnalysis: {
    costPerKg: {
      type: Number,
      default: 0
    },
    dailyCost: {
      type: Number,
      default: function() {
        return this.quantityUsed * this.costPerKg;
      }
    },
    costPerBird: {
      type: Number,
      default: function() {
        return this.totalBirds > 0 ? (this.dailyCost / this.totalBirds).toFixed(2) : 0;
      }
    }
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  verified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: String,
    trim: true
  },
  verifiedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Create compound index for feedType and date
feedUsageSchema.index({ feedType: 1, date: 1 });
feedUsageSchema.index({ date: 1 });

// Calculate derived fields before saving
feedUsageSchema.pre('save', function(next) {
  if (this.totalBirds > 0) {
    this.feedPerBird = (this.quantityUsed / this.totalBirds).toFixed(3);
  }
  
  this.actualConsumption = this.quantityUsed * (1 - this.wastePercentage / 100);
  
  if (this.costAnalysis.costPerKg > 0) {
    this.costAnalysis.dailyCost = this.quantityUsed * this.costAnalysis.costPerKg;
    if (this.totalBirds > 0) {
      this.costAnalysis.costPerBird = (this.costAnalysis.dailyCost / this.totalBirds).toFixed(2);
    }
  }
  
  next();
});

// Instance method to verify usage record
feedUsageSchema.methods.verify = function(verifierName) {
  this.verified = true;
  this.verifiedBy = verifierName;
  this.verifiedAt = new Date();
  return this.save();
};

// Static method to get usage for date range
feedUsageSchema.statics.getUsageForDateRange = function(feedType, startDate, endDate) {
  return this.find({
    feedType,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: 1 });
};

// Static method to get daily averages
feedUsageSchema.statics.getDailyAverages = function(feedType, month) {
  const monthPrefix = month; // e.g., "2025-01"
  
  return this.aggregate([
    {
      $match: {
        feedType,
        date: { $regex: `^${monthPrefix}` }
      }
    },
    {
      $group: {
        _id: null,
        averageDaily: { $avg: '$quantityUsed' },
        totalUsage: { $sum: '$quantityUsed' },
        averageBirds: { $avg: '$totalBirds' },
        averageWaste: { $avg: '$wastePercentage' },
        averageEfficiency: { $avg: '$feedPerBird' },
        recordCount: { $sum: 1 }
      }
    }
  ]);
};

// Static method to get consumption trends
feedUsageSchema.statics.getConsumptionTrends = function(feedType, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        feedType,
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$date',
        totalUsed: { $sum: '$quantityUsed' },
        totalBirds: { $sum: '$totalBirds' },
        averageEfficiency: { $avg: '$feedPerBird' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

module.exports = mongoose.model('FeedUsage', feedUsageSchema);
