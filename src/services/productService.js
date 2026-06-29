// src/services/productService.js

const prisma = require('../db'); // Import our single database connection

const getAllProducts = async () => {
  // Prisma goes to the database and fetches all rows from the Product table
  const products = await prisma.product.findMany();
  return products;
};
const createProduct = async (name, price, inventory) => {
  const newProduct = await prisma.product.create({
    data: {
      name: name,
      price: price,
      inventory: inventory,
      version: 1 // Default version for optimistic locking!
    }
  });
  return newProduct;
};
// Add this below getAllProducts
const getProductById = async (id) => {
  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) }
  });
  if (!product) throw new Error("Product not found");
  return product;
};
// Add getProductById to your module.exports at the bottom!

module.exports = {
  getAllProducts,
  createProduct,
  getProductById
};