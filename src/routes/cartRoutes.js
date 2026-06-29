const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.get('/:userId', cartController.getCart);
router.post('/add', authenticateToken, cartController.addToCart);

// NEW: The secure DELETE route
router.delete('/remove/:cartItemId', authenticateToken, cartController.removeFromCart);

module.exports = router;