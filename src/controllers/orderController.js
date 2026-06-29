const orderService = require('../services/orderService');

const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.userId; // Secure!
    const orders = await orderService.getUserOrders(userId);
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

module.exports = { getMyOrders };