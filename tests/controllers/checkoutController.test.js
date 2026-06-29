// __tests__/controllers/checkoutController.test.js
const { checkout } = require('../../src/controllers/checkoutController');
const { checkoutQueue } = require('../../src/queue');

// 1. THE MAGIC OF MOCKING:
// We intercept the real queue and replace its "add" function with a fake Spy!
jest.mock('../../src/queue', () => ({
  checkoutQueue: {
    add: jest.fn() // A fake function that just records if it was called
  }
}));

describe('Checkout Controller', () => {
  it('should successfully drop a sticky note in the queue and return 202 Accepted', async () => {
    
    // 2. ARRANGE
    const req = { 
      user: { userId: 1 } // Simulate a logged-in user!
    };
    
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // 3. ACT
    // We call the controller. It *thinks* it is talking to Redis, but it's actually talking to our Mock!
    await checkout(req, res);

    // 4. ASSERT
    // Did it actually drop the job in the queue?
    expect(checkoutQueue.add).toHaveBeenCalled();
    
    // Did it return a 202 Accepted to the user?
    expect(res.status).toHaveBeenCalledWith(202);
  });
});