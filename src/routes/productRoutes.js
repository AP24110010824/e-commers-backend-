const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// 1. Import BOTH bouncers!
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');

// The public route (No bouncers needed)
router.get('/', productController.getProducts);
// Add this PUBLIC route (no bouncers!) below router.get('/')
router.get('/:id', productController.getOne);

// The protected route (Chaining Bouncer 1 and Bouncer 2)
router.post(
  '/', 
  authenticateToken, 
  authorizeRole("ADMIN"), 
  productController.create
);

module.exports = router;