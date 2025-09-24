const mongoose = require('mongoose');

const taskSchedulingSchema = new mongoose.Schema({
  date: {
    type: String,
    required: [true, 'Date is required'],
    trim: true
  },
  taskDescription: {
    type: String,
    required: [true, 'Task description is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Bird Care', 'Egg Collection', 'Cleaning & Maintenance', 'Feed Management', 'Inventory'],
    trim: true
  },
  assignedTo: {
    type: String,
    required: [true, 'Assigned person is required'],
    trim: true
  },
  assignedToContact: {
    type: String,
    trim: true
  },
  time: {
    type: String,
    required: [true, 'Time is required'],
    trim: true
  },
  estimatedDuration: {
    type: Number, // in minutes
    min: [1, 'Duration must be at least 1 minute'],
    default: 60
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Cancelled', 'Overdue'],
    default: 'Pending'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  location: {
    type: String,
    trim: true,
    default: 'Farm'
  },
  equipment: {
    type: [String],
    default: []
  },
  completedAt: {
    type: Date
  },
  completedBy: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    type: String,
    enum: ['Daily', 'Weekly', 'Monthly', 'Custom'],
    trim: true,
    required: false
  }
}, {
  timestamps: true
});

// Update completed timestamp when status changes to completed
taskSchedulingSchema.pre('save', function(next) {
  if (this.status === 'Completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('TaskScheduling', taskSchedulingSchema);
