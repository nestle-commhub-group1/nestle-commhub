const express = require('express');
const router = express.Router();
const { resetDatabase } = require('../controllers/devController');

// Secure route to reset data
// Requires header: x-dev-password
router.post('/reset-data', resetDatabase);

module.exports = router;
