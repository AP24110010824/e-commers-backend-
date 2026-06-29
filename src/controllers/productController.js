// src/controllers/productController.js
const redisClient = require('../redis');
const productService = require('../services/productService');

const getProducts = async (req, res) => {
  try {
    // 1. Ask the RAM Bouncer: "Do you already know the product list?"
    const cachedProducts = await redisClient.get('all_products');
    
    if (cachedProducts) {
      console.log("🔥 CACHE HIT! Bypassing the PostgreSQL Database.");
      return res.json({ success: true, data: JSON.parse(cachedProducts) });
    }

    console.log("🐌 CACHE MISS! Hitting the Database.");
    
    // 2. The RAM Bouncer doesn't know it. We must hit Postgres.
    const products = await productService.getAllProducts();
    
    // 3. Save the result in RAM so the next 99,000 users get it instantly!
    await redisClient.setEx('all_products', 3600, JSON.stringify(products));
    
    res.json({ success: true, data: products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Something broke!" });
  }
};

const create = async (req, res) => {
  try {
    const { name, price, inventory } = req.body;
    const product = await productService.createProduct(name, price, inventory);
    
    // 💥 CACHE INVALIDATION 💥
    await redisClient.del('all_products');
    console.log("🗑️ CACHE INVALIDATED! The catalog changed.");
    
    res.status(201).json({ success: true, message: "Product created by Admin!", data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getOne = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

// Export them all!
module.exports = {
  getProducts,
  create,
  getOne
};