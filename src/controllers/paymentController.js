// src/controllers/paymentController.js
const { emailQueue } = require('../queue');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // We aren't making requests to Stripe yet, but we need the library
const prisma = require('../db');

const handleWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // THIS IS THE MAGIC LINE:
    // It takes the raw text, the signature, and our secret key, and does the math!
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (err) {
    console.error("⚠️ Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // If the math succeeds, we check what happened!
    if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log(`💰 Payment successful for Order ID: ${session.client_reference_id}`);
        // 1. Extract the Postgres Order ID that Stripe sent back to us
    const orderId = session.client_reference_id;

    if (orderId) {
      // 2. Update the Database! Change PENDING to PAID!
      await prisma.order.update({
        where: { id: parseInt(orderId) },
        data: { status: 'PAID' }
      });
      console.log(`✅ Database updated: Order #${orderId} is now officially PAID!`);
    }
    // THE PRODUCER: Drop the sticky note into the queue!
    await emailQueue.add('send-receipt', {
    userEmail: "rahulrevanth_sabbi@srmap.edu.in", 
    orderId: session.client_reference_id
}, {
    attempts: 5, // Try up to 5 times
    backoff: {
        type: 'exponential',
        delay: 60000 // Start by waiting 60 seconds before the first retry
    }
});
    
    console.log("📝 Sticky note dropped in the Queue! The worker will handle the email.");
  }

  // Always return a 200 OK so Stripe knows we received it
  res.status(200).json({ received: true });
};

module.exports = { handleWebhook };