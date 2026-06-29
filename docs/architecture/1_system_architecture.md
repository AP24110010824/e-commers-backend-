# System Architecture: Core Concepts

This document outlines the advanced, production-level engineering concepts utilized in this backend to ensure scalability, data integrity, and high performance.

## 1. Optimistic Locking (Concurrency Control)
In an e-commerce platform, the most critical failure point is the "Flash Sale" scenario: 100 users try to buy the last remaining pair of shoes at the exact same millisecond. 

If a system uses simple read/write logic, multiple threads will read `inventory = 1`, and all 100 users will successfully purchase the item, resulting in an inventory of `-99`.

**The Solution:**
We implemented **Optimistic Locking** using a `@default(1)` version column in the PostgreSQL `Product` table. 
Whenever a checkout occurs, the database query requires the version number to match the version read during the initial request. If another transaction has modified the row in the milliseconds between the read and the write, the version number will have incremented, and PostgreSQL will instantly throw a `PrismaClientKnownRequestError (P2025)`. The application catches this error and safely denies the purchase.

## 2. In-Memory Caching (Redis)
Database I/O is the most significant bottleneck in a web application. For read-heavy operations (like fetching product catalogs), querying PostgreSQL on every request is highly inefficient.

**The Solution:**
We introduced **Redis** as a distributed, in-memory cache. 
When a user requests the product list, the API first checks Redis (O(1) time complexity). If it is a Cache Miss, the API queries PostgreSQL, formats the data, and stores it in Redis. Subsequent requests are served from RAM, allowing the API to handle tens of thousands of requests per second without touching the primary database.

## 3. Snapshotting Data Immutability
In e-commerce, a receipt must be mathematically immutable. If a user buys a laptop for $1,000, and the admin later changes the price of the laptop to $1,200 in the database, the historical order must still reflect $1,000.

**The Solution:**
Instead of relying on SQL `JOIN` or Foreign Key constraints to calculate order totals on the fly, we implemented **Data Snapshotting**. When an `Order` is created, the current price of the product is hardcopied into the `OrderItem` table. The `Product` table is entirely decoupled from historical financial records.

## 4. Message Queues (Asynchronous Processing)
Sending an email or talking to a third-party API (like Stripe) takes anywhere from 500ms to 2 seconds. If this is done synchronously in an Express controller, the Node.js Event Loop is blocked, and other users are forced to wait.

**The Solution:**
We implemented **BullMQ** on top of Redis. The API controller instantly drops a JSON payload (a "Job") into the `checkout-queue` and immediately returns a `202 Accepted` response to the user in less than 50ms. A completely decoupled Background Worker (running on a separate Docker node) continuously polls the queue, picks up the job, and handles the slow network requests to Stripe and Resend in the background.
