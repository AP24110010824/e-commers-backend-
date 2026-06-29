// src/queue.js
const { Queue } = require('bullmq');
const Redis = require('ioredis');

// We connect to Upstash. maxRetriesPerRequest is required by BullMQ!
const connection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null 
});

const emailQueue = new Queue('email-queue', { connection });
const checkoutQueue=new Queue('checkout-queue',{connection});

module.exports = { emailQueue,checkoutQueue, connection };