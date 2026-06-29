// src/worker.js
const { Worker } = require('bullmq');
const { connection } = require('./queue');
const { Resend } = require('resend');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const checkoutService = require('./services/checkoutService');
const prisma = require('./db');

const resend = new Resend(process.env.RESEND_API_KEY);

console.log("👷‍♂️ Background Worker started! Staring at the Inbox...");

const worker = new Worker('email-queue', async (job) => {
  console.log(`\n📨 [WORKER] Picked up Job #${job.id}: Sending receipt to ${job.data.userEmail}`);
  
  // Actually send the physical email!
  // IMPORTANT: The 'from' address MUST be onboarding@resend.dev for free accounts!
  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: job.data.userEmail,
    subject: `Receipt for Order #${job.data.orderId}`,
    html: `<h1>Thank you for your purchase!</h1><p>Your order (ID: ${job.data.orderId}) has been successfully processed.</p>`
  });
  
  console.log(`✅ [WORKER] Physical Email successfully sent to ${job.data.userEmail}!\n`);
}, { connection });

worker.on('failed', (job, err) => {
  console.error(`❌ [WORKER] Job ${job.id} failed:`, err);
});
// THE CHECKOUT WORKER
// This robot sits in the background, grabs the sticky note, and does the heavy lifting!
const checkoutWorker = new Worker('checkout-queue', async (job) => {
  const { userId } = job.data;
  console.log(`\n🛒 Worker picked up Checkout Job for User ${userId}...`);

  try {
    // 1. Database Transaction (Optimistic Locking) happens in the background!
    const order = await checkoutService.processCheckout(userId);
    console.log(`   ✅ Database Transaction locked! Order #${order.id} created.`);

    // 2. Network Call to Stripe happens in the background!
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      client_reference_id: order.id.toString(), // For the Webhook!
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `Order #${order.id}` },
          unit_amount: order.totalAmount * 100,
        },
        quantity: 1,
      }],
      success_url: 'http://localhost:3000/success',
      cancel_url: 'http://localhost:3000/cancel',
    });
    console.log(`   ✅ Stripe URL Generated!`);

    // 3. Save the URL to the Database so the frontend can poll for it!
    await prisma.order.update({
      where: { id: order.id },
      data: { stripeUrl: session.url }
    });
    console.log(`   🏁 Worker finished! Saved URL to database for frontend to find.\n`);

  } catch (error) {
    console.error(`   ❌ Worker Failed Checkout: ${error.message}`);
    // If the cart is empty or the Optimistic Lock fails, the worker fails the job!
  }

}, { connection: connection });