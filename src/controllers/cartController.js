// src/controllers/cartController.js
const cartService = require('../services/cartService');

const getCart = async (req, res) => {
  try {
    // req.params.userId comes from the URL (e.g., /cart/1)
    const cart = await cartService.getCart(req.params.userId);
    
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }
    
    res.json({ success: true, data: cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Something broke!" });
  }
};
// Add below getCart...
const addToCart = async (req, res) => {
  try {
    const userId = req.user.userId; // Securely read from the VIP Wristband!
    const { productId, quantity } = req.body;

    const result = await cartService.addToCart(userId, productId, quantity);
    
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
// Add below addToCart...

const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.userId; // Guaranteed by the Bouncer!
    const cartItemId = req.params.cartItemId; // From the URL

    const result = await cartService.removeFromCart(userId, cartItemId);
    
    res.status(200).json(result);
  } catch (error) {
    // If it's the security error, return 403 Forbidden!
    if (error.message.includes("Forbidden")) {
       return res.status(403).json({ success: false, message: error.message });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getCart, addToCart, removeFromCart };


