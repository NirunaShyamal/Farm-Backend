const mongoose = require('mongoose');

const eggProductionSchema = new mongoose.Schema({
  date: {
    type: String,
    required: [true, 'Date is required'],
    trim: true
  },
  batchNumber: {
    type: String,
    required: [true, 'Batch number is required'],
    trim: true
  },
  birds: {
    type: Number,
    required: [true, 'Number of birds is required'],
    min: [1, 'Must have at least 1 bird']
  },
  eggsCollected: {
    type: Number,
    required: [true, 'Eggs collected is required'],
    min: [0, 'Eggs collected cannot be negative']
  },
  damagedEggs: {
    type: Number,
    default: 0,
    min: [0, 'Damaged eggs cannot be negative']
  },
  eggProductionRate: {
    type: Number,
    default: function() {
      return this.birds > 0 ? ((this.eggsCollected / this.birds) * 100).toFixed(2) : 0;
    }
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

// Calculate production rate before saving
eggProductionSchema.pre('save', function(next) {
  if (this.birds > 0) {
    this.eggProductionRate = ((this.eggsCollected / this.birds) * 100).toFixed(2);
  }
  next();
});

module.exports = mongoose.model('EggProduction', eggProductionSchema);
