const TaskScheduling = require('../models/TaskScheduling');

// @desc    Get all tasks
// @route   GET /api/task-scheduling
// @access  Public
const getTasks = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category, assignedTo, sortBy = 'date', sortOrder = 'asc' } = req.query;
    
    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (assignedTo) filter.assignedTo = new RegExp(assignedTo, 'i');

    const tasks = await TaskScheduling.find(filter)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await TaskScheduling.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: tasks.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: tasks
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks',
      error: error.message
    });
  }
};

// @desc    Create new task
// @route   POST /api/task-scheduling
// @access  Public
const createTask = async (req, res) => {
  try {
    const {
      date,
      taskDescription,
      category,
      assignedTo,
      assignedToContact,
      time,
      estimatedDuration,
      status,
      priority,
      location,
      equipment,
      notes,
      isRecurring,
      recurringPattern
    } = req.body;

    // Validate required fields
    if (!date || !taskDescription || !category || !assignedTo || !time) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: date, taskDescription, category, assignedTo, time'
      });
    }

    // Create new task
    const taskData = {
      date,
      taskDescription,
      category,
      assignedTo,
      assignedToContact: assignedToContact || '',
      time,
      estimatedDuration: estimatedDuration || 60,
      status: status || 'Pending',
      priority: priority || 'Medium',
      location: location || 'Farm',
      equipment: equipment || [],
      notes: notes || '',
      isRecurring: isRecurring || false
    };
    
    // Only add recurringPattern if it's provided and not empty
    if (recurringPattern && recurringPattern.trim() !== '') {
      taskData.recurringPattern = recurringPattern;
    }
    
    const newTask = new TaskScheduling(taskData);

    const savedTask = await newTask.save();

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: savedTask
    });
  } catch (error) {
    console.error('Error creating task:', error);
    
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
      message: 'Failed to create task',
      error: error.message
    });
  }
};

// @desc    Get task summary/statistics
// @route   GET /api/task-scheduling/summary
// @access  Public
const getTaskSummary = async (req, res) => {
  try {
    const totalTasks = await TaskScheduling.countDocuments();
    const pendingTasks = await TaskScheduling.countDocuments({ status: 'Pending' });
    const inProgressTasks = await TaskScheduling.countDocuments({ status: 'In Progress' });
    const completedTasks = await TaskScheduling.countDocuments({ status: 'Completed' });
    const overdueTasks = await TaskScheduling.countDocuments({ status: 'Overdue' });
    
    // Get tasks by category
    const tasksByCategory = await TaskScheduling.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get tasks by priority
    const tasksByPriority = await TaskScheduling.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // Get tasks by assigned person
    const tasksByAssignee = await TaskScheduling.aggregate([
      { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Get today's tasks
    const today = new Date().toISOString().split('T')[0];
    const todaysTasks = await TaskScheduling.countDocuments({
      date: { $regex: today.replace(/-/g, '/') }
    });

    res.status(200).json({
      success: true,
      data: {
        totalTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
        overdueTasks,
        todaysTasks,
        tasksByCategory,
        tasksByPriority,
        tasksByAssignee
      }
    });
  } catch (error) {
    console.error('Error fetching task summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch task summary',
      error: error.message
    });
  }
};

// @desc    Update task
// @route   PUT /api/task-scheduling/:id
// @access  Public
const updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const updateData = req.body;

    const task = await TaskScheduling.findById(taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const updatedTask = await TaskScheduling.findByIdAndUpdate(
      taskId,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask
    });
  } catch (error) {
    console.error('Error updating task:', error);
    
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
      message: 'Failed to update task',
      error: error.message
    });
  }
};

// @desc    Delete task
// @route   DELETE /api/task-scheduling/:id
// @access  Public
const deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;

    const task = await TaskScheduling.findById(taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await TaskScheduling.findByIdAndDelete(taskId);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete task',
      error: error.message
    });
  }
};

module.exports = {
  getTasks,
  createTask,
  getTaskSummary,
  updateTask,
  deleteTask
};
