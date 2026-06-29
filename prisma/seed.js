// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs'); // NEW: Import the hasher!
const prisma = new PrismaClient();

async function main() {
  console.log("Starting the database seed...");

  // Securely hash the password before inserting it!
  const hashedPassword = await bcrypt.hash("supersecretpassword", 10);

  // 1. Create a User
  const rahul = await prisma.user.create({
    data: {
      name: "Rahul",
      email: "rahul@gmail.com",
      password: hashedPassword, // Store the hash, not the text!
      role: "ADMIN" // Let's make you an admin!
    }
  });
  console.log(`User created: ${rahul.name} (Password: supersecretpassword)`);

  // 2. Create a Product
  const laptop = await prisma.product.create({
    data: {
      name: "MacBook Pro",
      price: 2000.00,
      inventory: 50
    }
  });
  console.log(`Product created: ${laptop.name}`);

  // 3. Give Rahul a Shopping Cart
  const rahulsCart = await prisma.cart.create({
    data: { userId: rahul.id }
  });
  console.log("Cart created for Rahul");

  // 4. Put the Laptop into the Cart
  await prisma.cartItem.create({
    data: { quantity: 1, cartId: rahulsCart.id, productId: laptop.id }
  });
  console.log("Laptop added to Rahul's cart!");

  console.log("Seeding finished successfully.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });