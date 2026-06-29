// tests/api.test.js
const request = require('supertest');
const { mockDeep } = require('jest-mock-extended');

// 1. 🛑 INTERCEPT ALL NETWORK CONNECTIONS 🛑
// If we don't mock these, Jest will try to connect to the cloud and hang forever!
jest.mock('../src/db', () => mockDeep()); // Fakes Postgres
jest.mock('../src/redis', () => ({ // Fakes the Redis Cache
  get: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
  on: jest.fn()
}));
jest.mock('../src/queue', () => ({ // Fakes the BullMQ Queue
  emailQueue: { add: jest.fn() }
}));

// 2. Import the fakes so we can control them
const prismaMock = require('../src/db');
const redisClientMock = require('../src/redis');

// 3. Import the Decoupled Express App
const app = require('../src/app');

// 🔬 THE API TEST SUITE
describe('API Integration Tests', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /health should return 200 OK', async () => {
    // Act: Send a fake HTTP GET request to the /health route
    const response = await request(app).get('/health');
    
    // Assert: Prove it worked
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("Server is running perfectly!");
  });

  it('GET /products should return a list of products', async () => {
    // Arrange: Program the fake Redis to say "Cache Miss"
    redisClientMock.get.mockResolvedValue(null); 
    
    // Arrange: Program the fake Postgres to return a Fake MacBook
    const fakeData = [{ id: 1, name: 'MacBook Pro', price: 2000 }];
    prismaMock.product.findMany.mockResolvedValue(fakeData);

    // Act: Send a fake HTTP GET request to /products
    const response = await request(app).get('/products');

    // Assert: Check the HTTP Status Code and the JSON body
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data[0].name).toBe('MacBook Pro');
    
    // Mathematically prove that the API correctly tried to save it to the cache!
    expect(redisClientMock.setEx).toHaveBeenCalledTimes(1); 
  });
});