// src/app.js
require('dotenv').config();
const express = require('express');
const app = express();

// Stripe requires RAW parsing, so payment routes must come BEFORE express.json()
const paymentRoutes = require('./routes/paymentRoutes');
app.use('/payments', paymentRoutes);

// Now enable JSON parsing for everything else
app.use(express.json());

// Load all other routes
app.use('/checkout', require('./routes/checkoutRoutes'));
app.use('/users', require('./routes/userRoutes'));
app.use('/cart', require('./routes/cartRoutes'));
app.use('/products', require('./routes/productRoutes'));
app.use('/orders', require('./routes/orderRoutes'));

app.get('/health', (req, res) => {
  res.json({ status: "Server is running perfectly!" });
});

// IMPORTANT: We DO NOT run app.listen() here! We just export the app so Jest can use it.
module.exports = app;