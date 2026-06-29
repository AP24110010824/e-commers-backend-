// src/services/cartService.js
const prisma = require('../db');

const getCart = async (userId) => {
  // 1 single database trip!
  const cart = await prisma.cart.findUnique({
    where: { userId: parseInt(userId) }, // We parse to Int because URLs are strings
    include: {
      items: {               // Grab the CartItems
        include: {
          product: true      // For every CartItem, grab the Product details!
        }
      }
    }
  });
  
  return cart;
};
// src/services/cartService.js
// Add below getCart...

const addToCart = async (userId, productId, requestedQuantity) => {
  // 1. Verify the product exists and check its max inventory
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Product not found");
  if (product.inventory === 0) throw new Error("Out of stock");

  // 2. The UPSERT Pattern: Find the user's cart, or create it instantly!
  const cart = await prisma.cart.upsert({
    where: { userId: userId },
    update: {}, // Do nothing if it exists
    create: { userId: userId } // Create it if it doesn't
  });

  // 3. Check if the item is already inside the cart
  const existingItem = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId: productId }
  });

  let finalQuantity = requestedQuantity;
  let warningMessage = null;

  if (existingItem) {
    // If it's already in the cart, add the old quantity + the new quantity
    finalQuantity = existingItem.quantity + requestedQuantity;
  }

  // 4. Option B Logic: Cap the quantity if they ask for too much!
  if (finalQuantity > product.inventory) {
    finalQuantity = product.inventory;
    warningMessage = `We only had ${product.inventory} in stock, so we capped your cart!`;
  }

  // 5. Save the final quantity to the database
  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: finalQuantity }
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId: productId, quantity: finalQuantity }
    });
  }

  return { cartId: cart.id, message: warningMessage || "Added to cart successfully!" };
};
// Add below addToCart...

const removeFromCart = async (userId, cartItemId) => {
  // 1. Find the item they want to delete
  const cartItem = await prisma.cartItem.findUnique({
    where: { id: parseInt(cartItemId) },
    include: { cart: true } // We need the cart data to check ownership!
  });

  if (!cartItem) {
    throw new Error("Item not found in cart");
  }

  // 2. Security Check (Preventing IDOR)
  // Does the cart this item belongs to match the user making the request?
  if (cartItem.cart.userId !== userId) {
    throw new Error("Forbidden: You cannot delete someone else's cart item!");
  }

  // 3. It's theirs! Delete it safely.
  await prisma.cartItem.delete({
    where: { id: parseInt(cartItemId) }
  });

  return { success: true, message: "Item removed securely" };
};

module.exports = { getCart, addToCart, removeFromCart };
