const prisma = require('../db');

const getUserOrders = async (userId) => {
  const orders = await prisma.order.findMany({
    where: { userId: userId },
    include: {
      items: { include: { product: true } }, // Get the items AND the product names!
      payment: true // Get the stripe payment status
    },
    orderBy: { createdAt: 'desc' } // Newest orders first!
  });
  return orders;
};

module.exports = { getUserOrders };