// src/index.js
require('dotenv').config();
require('./cron'); // Wakes up the background queue robot
const app = require('./app'); // Imports your new decoupled API
const redisClient = require('./redis'); 

const PORT = 3000;

app.listen(PORT, async () => {
  // Connect to the RAM Bouncer!
  await redisClient.connect();
  console.log("🚀 Connected to Redis!");
  console.log(`Server started on http://localhost:${PORT}`);
});