# Engineering Challenges & Solutions

Building a distributed, Top 1% e-commerce architecture introduced several complex engineering hurdles. This document catalogs the major issues encountered and the architectural solutions implemented to overcome them.

---

## 1. The Prisma Alpine Compatibility Crash

**The Problem:**
During the Dockerization phase, we initially used `node:24-alpine` as the base image for our API and Worker containers. When the containers booted, they immediately crashed with the following error:
`Error loading shared library libssl.so.1.1: No such file or directory`
Alpine Linux utilizes `musl` libc instead of standard `glibc` and explicitly drops support for OpenSSL 1.1 in newer versions. The Prisma Query Engine, which is written in Rust, requires specific C++ encryption libraries to communicate securely with PostgreSQL.

**The Solution:**
Instead of attempting complex manual installations of legacy OpenSSL packages on Alpine, we pivoted the foundational infrastructure to a Debian-based container. We modified the `Dockerfile` to pull `node:24-slim`. The `slim` Debian images are slightly larger but natively include the exact dynamic libraries Prisma requires. Upon rebuilding, the microservices orchestrated perfectly.

---

## 2. The Flash Sale Race Condition

**The Problem:**
During stress testing of the `POST /checkout` endpoint, we simulated a "Flash Sale" where hundreds of users attempted to purchase a limited-stock item simultaneously. Standard CRUD logic (`SELECT inventory`, subtract 1, `UPDATE inventory`) failed under concurrency, resulting in severe overselling (negative inventory) due to database race conditions.

**The Solution:**
We implemented **Optimistic Locking**. We added a `version` integer column to the `Product` schema. The checkout logic was modified to read the current version, calculate the new inventory, and then attempt an `UPDATE` where the `id` *and* the `version` must match the initially read values. If a concurrent transaction modifies the row first, the version increments, the second `UPDATE` affects 0 rows, and Prisma throws a known error, which the backend safely catches to deny the transaction.

---

## 3. Webhook Tunneling on Localhost

**The Problem:**
Stripe processes payments asynchronously. When a payment completes, Stripe's servers send a `POST` request (Webhook) to the backend API to confirm the transaction. However, Stripe cannot send an HTTP request to `http://localhost:3000` because localhost is not accessible from the public internet.

**The Solution:**
We leveraged the **Stripe CLI** to establish a secure WebSocket tunnel. By running `stripe listen --forward-to localhost:3000/api/stripe/webhook`, the CLI captured the events from Stripe's production servers and piped them directly into our local Express server. This allowed us to cryptographically verify the Webhook Signatures using the local `.env` secret key and test the full asynchronous payment flow without deploying to a public domain.

---

## 4. Cron Job Polling and Inventory Reclamation

**The Problem:**
The asynchronous checkout pipeline introduces an edge case: if a user creates an order (locking the inventory and setting status to `PENDING`) but closes the Stripe checkout window without paying, that inventory remains locked indefinitely. 

**The Solution:**
We decoupled inventory reclamation from the active request lifecycle by implementing a **Cron Job**. Using `node-cron`, a background script sweeps the PostgreSQL database every 60 seconds. It utilizes a massive Prisma Transaction to find any `PENDING` order older than 10 minutes, iterates through the `OrderItems`, increments the corresponding `Product` inventory back to its original state, and hard-deletes the abandoned cart. This guarantees total system eventual consistency.
