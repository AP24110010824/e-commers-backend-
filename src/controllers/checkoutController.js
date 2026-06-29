// src/controllers/checkoutController.js
// src/controllers/checkoutController.js
const { checkoutQueue } = require('../queue');
const prisma = require('../db');

// 1. The Async Checkout Route
const checkout = async (req, res) => {
  try {
    const userId = req.user.userId; 
    
    // Instead of doing database work, just drop the sticky note in the queue!
    await checkoutQueue.add('process-checkout', { userId: userId });
    
    // Return a 202 Accepted. "We received your request, we are working on it!"
    res.status(202).json({ 
      success: true, 
      message: "Order received! You are in line. Please wait while we generate your payment link..." 
    });
    
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 2. The New Polling Route
// The frontend will ping this every 2 seconds to see if the URL is ready!
const checkStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Find the user's most recent order
    const latestOrder = await prisma.order.findFirst({
      where: { userId: parseInt(userId) },
      orderBy: { createdAt: 'desc' } // Gets the newest one
    });

    if (latestOrder && latestOrder.stripeUrl) {
      // The worker finished generating the URL!
      return res.json({ ready: true, url: latestOrder.stripeUrl });
    }

    // The worker is still thinking...
    res.json({ ready: false, message: "Still processing..." });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { checkout, checkStatus };