// src/services/checkoutService.js
const prisma = require('../db');

const processCheckout = async (userId) => {
  // 1. Fetch the user's cart (Eager loading again!)
  const cart = await prisma.cart.findUnique({
    where: { userId: parseInt(userId) },
    include: { items: { include: { product: true } } }
  });

  if (!cart || cart.items.length === 0) {
    throw new Error("Cart is empty");
  }

  // 2. Start the DATABASE TRANSACTION
  // Everything inside here succeeds together, or fails together.
  const result = await prisma.$transaction(async (tx) => {
    
    let totalAmount = 0;

    // A. Verify Inventory and Calculate Total
    for (const item of cart.items) {
      if (item.product.inventory < item.quantity) {
        throw new Error(`Not enough inventory for ${item.product.name}`);
      }
      totalAmount += (item.product.price * item.quantity);
    }

    // B. Create the Order
    const order = await tx.order.create({
      data: {
        userId: parseInt(userId),
        totalAmount: totalAmount,
        status: "PENDING" 
      }
    });

    // C. Create OrderItems (THE SNAPSHOT!) and Reduce Inventory (THE LOCK!)
    for (const item of cart.items) {
      // Create the snapshot receipt
      await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          priceAtPurchase: item.product.price // Snapshotting the live price right now!
        }
      });

      // OPTIMISTIC LOCKING: Reduce inventory ONLY IF the version hasn't changed!
      const updatedProduct = await tx.product.updateMany({
        where: { 
          id: item.productId,
          version: item.product.version // The lock! If someone else bought it, the version is different and this fails!
        },
        data: {
          inventory: { decrement: item.quantity },
          version: { increment: 1 } // Increment the version for the next buyer
        }
      });

      if (updatedProduct.count === 0) {
        throw new Error("Someone else just bought this item! Please try again.");
      }
    }

    // D. Empty the Cart now that the order is placed
    await tx.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    return order;
  });

  return result; // If we reach here, the transaction was committed successfully!
};

module.exports = { processCheckout };