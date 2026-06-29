const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Only logged in users can see their own orders!
router.get('/', authenticateToken, orderController.getMyOrders);

module.exports = router;