// src/routes/checkoutRoutes.js
const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');

// Import the bouncer!
const { authenticateToken } = require('../middlewares/authMiddleware');

// Notice how we put the bouncer BEFORE the controller!
router.post('/', authenticateToken, checkoutController.checkout);
// Add this below the POST route
router.get('/status', authenticateToken, checkoutController.checkStatus);

module.exports = router;