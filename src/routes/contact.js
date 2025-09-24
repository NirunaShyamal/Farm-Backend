const express = require('express');
const {
  sendContactEmail,
  testEmailConfig
} = require('../controllers/contactController');

const router = express.Router();

// @route   POST /api/contact
// @desc    Send contact form email
// @access  Public
router.post('/', sendContactEmail);

// @route   GET /api/contact/test
// @desc    Test email configuration
// @access  Public
router.get('/test', testEmailConfig);

module.exports = router;








