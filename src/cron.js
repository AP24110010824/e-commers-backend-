// src/cron.js
const cron = require('node-cron');
const prisma = require('./db');

// This schedule means: "Run every 1 minute" (* * * * *)
// In a real production app, it might be "0 2 * * *" (Run at 2:00 AM every day)
cron.schedule('* * * * *', async () => {
  console.log('⏰ CRON JOB WAKING UP: Checking for abandoned carts...');

  try {
    // 1. Calculate the cutoff time (10 minutes ago)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    // 2. Find all orders that are STILL PENDING and older than 10 minutes
    const abandonedOrders = await prisma.order.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: tenMinutesAgo }
      },
      include: {
        items: true // We must fetch the items so we know what inventory to restore!
      }
    });

    if (abandonedOrders.length === 0) {
      console.log('   ✅ No abandoned carts found. Going back to sleep.');
      return;
    }

    console.log(`   🗑️ Found ${abandonedOrders.length} abandoned cart(s). Restoring inventory...`);

    // 3. We use a massive Database Transaction to safely restore everything
    await prisma.$transaction(async (tx) => {
      for (const order of abandonedOrders) {
        
        // Step A: Put the inventory back on the shelf!
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              inventory: { increment: item.quantity } // Give it back!
            }
          });
        }

        // Step B: Delete the OrderItems tied to this order
        await tx.orderItem.deleteMany({
          where: { orderId: order.id }
        });

        // Step C: Delete the Order itself
        await tx.order.delete({
          where: { id: order.id }
        });

        console.log(`   ♻️ Successfully restored inventory and deleted Order #${order.id}`);
      }
    });

  } catch (error) {
    console.error('❌ CRON JOB FAILED to clean abandoned carts:', error);
  }
});

console.log('🕒 Cron Job registered: Abandoned Cart Sweeper is active.');