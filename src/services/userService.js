// src/services/userService.js
const prisma = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const registerUser = async (email, name, rawPassword) => {
  // 1. Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error("Email already in use");
  }

  // 2. Hash the password! (The Top 1% way)
  // '10' is the "Salt Rounds". The higher the number, the slower it is for hackers to crack.
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(rawPassword, salt);

  // 3. Save the HASHED password to the database, NEVER the raw password.
  const newUser = await prisma.user.create({
    data: {
      email: email,
      name: name,
      password: hashedPassword
    }
  });

  // 4. Don't send the password back in the JSON response!
  delete newUser.password;
  return newUser;
};
const loginUser = async (email, rawPassword) => {
  // 1. Find the user
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error("Invalid email or password");
  }
  // 2. Compare the hashes
  const isMatch = await bcrypt.compare(rawPassword, user.password);
  if (!isMatch) {
    throw new Error("Invalid email or password"); // Keep error vague for security!
  }
  // 3. Generate the VIP Wristband (JWT)
  // In production, "my_super_secret_key" goes in the .env file!
  const token = jwt.sign(
    { userId: user.id },       // The data we are storing inside the wristband
    process.env.JWT_SECRET,    // The server's secret signature pulled from .env
    { expiresIn: '1h' }        // The wristband expires in 1 hour
  );
  return token;
};
// Don't forg

module.exports = { registerUser, loginUser };