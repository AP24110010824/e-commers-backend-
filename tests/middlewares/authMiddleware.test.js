// __tests__/middlewares/authMiddleware.test.js
const { authenticateToken } = require('../../src/middlewares/authMiddleware');

describe('Authentication Middleware', () => {
  
  it('should return a 401 Unauthorized status if no token is provided', () => {
    
    // 1. ARRANGE: Set up the fake environment
    // We create a fake "req" (Request) object that returns 'null' when looking for an Authorization header
    const req = {
      headers: {}
    };
    
    // We create a fake "res" (Response) object that remembers what we called it with!
    const res = {
      status: jest.fn().mockReturnThis(), // Mocks res.status(401)
      json: jest.fn()                     // Mocks res.json({ error: ... })
    };
    

    // We create a fake "next" function
    const next = jest.fn();

    // 2. ACT: Call the actual function we are testing
    authenticateToken(req, res, next);

    // 3. ASSERT: Check if the function did what it was supposed to do!
    expect(res.json).toHaveBeenCalledWith({ 
  message: 'Access Denied: No token provided!', 
  success: false 
});
    
    
    // The most important part: If there is no token, the middleware MUST NOT call next()
    expect(next).not.toHaveBeenCalled(); 
  });

});