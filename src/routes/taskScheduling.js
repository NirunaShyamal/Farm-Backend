const express = require('express');
const {
  getTasks,
  createTask,
  getTaskSummary
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

module.exports = router;

