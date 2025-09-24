const express = require('express');
const {
  getTasks,
  createTask,
  getTaskSummary,
  updateTask,
  deleteTask
} = require('../controllers/taskSchedulingController');

const router = express.Router();

// @route   GET /api/task-scheduling
// @desc    Get all tasks
// @access  Public
router.get('/', getTasks);

// @route   POST /api/task-scheduling
// @desc    Create new task
// @access  Public
router.post('/', createTask);

// @route   GET /api/task-scheduling/summary
// @desc    Get task summary/statistics
// @access  Public
router.get('/summary', getTaskSummary);

// @route   PUT /api/task-scheduling/:id
// @desc    Update task
// @access  Public
router.put('/:id', updateTask);

// @route   DELETE /api/task-scheduling/:id
// @desc    Delete task
// @access  Public
router.delete('/:id', deleteTask);

module.exports = router;
