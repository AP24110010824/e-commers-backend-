// src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const prisma = require('../db'); 

const authenticateToken = (req, res, next) => {
  // 1. Get the token from the "Authorization" header
  const authHeader = req.headers['authorization'];
  
  // The header usually looks like: "Bearer eYJhbGc..."
  // We split it by space and take the second part to just get the token
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Access Denied: No token provided!" });
  }

  // 2. Verify the token using our secret key
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: "Access Denied: Invalid or expired token!" });
    }

    // 3. The token is real! 
    // We attach the user's ID to the request so the Controller knows who they are!
    req.user = user; 
    
    // 4. Let them pass to the controller!
    next();
  });
};
// This is a "Middleware Factory"
const authorizeRole = (requiredRole) => {
  return async (req, res, next) => {
    try {
      // 1. Get the userId that the first Bouncer put on the box
      const userId = req.user.userId;
      // 2. Do a live check in the database
      const user = await prisma.user.findUnique({ where: { id: userId } });
      // 3. Compare their live role to the required role
      if (!user || user.role !== requiredRole) {
        return res.status(403).json({ success: false, message: "Forbidden: You are not an Admin!" });
      }
      // 4. They are an Admin! Pass them down the conveyor belt.
      next();
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  };
};

module.exports = { authenticateToken, authorizeRole  };