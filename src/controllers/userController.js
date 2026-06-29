// src/controllers/userController.js
const userService = require('../services/userService');

const register = async (req, res) => {
  try {
    const { email, name, password } = req.body;
    
    const user = await userService.registerUser(email, name, password);
    
    res.status(201).json({ success: true, message: "User registered safely!", data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Call the service to get the VIP wristband
    const token = await userService.loginUser(email, password);
    
    // Send it back to the user!
    res.json({ success: true, message: "Login successful!", token: token });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

module.exports = { register, login };