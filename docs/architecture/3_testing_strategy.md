# Automated Testing Strategy

To ensure code reliability and regression prevention, this project utilizes a strict automated testing architecture using **Jest** and **Supertest**. 

## The Testing Pyramid
The backend implements a risk-based testing strategy:
1. **Unit Tests (High Volume):** Lightning-fast tests for isolated logic (e.g., JWT extraction, password hashing, and middleware authorization checks). These tests do not require a database connection.
2. **Integration Tests (High Value):** Tests that ensure multiple system components (Controllers, Services, and Repositories) function together correctly. 
3. **E2E Tests (Excluded):** UI-driven Selenium/Cypress tests are omitted, as this repository serves purely as a headless API.

## The AAA Pattern
All tests are strictly structured using the industry-standard AAA pattern to ensure readability and maintainability:
*   **Arrange:** Set up the isolated test environment (e.g., generate a mock Express Request object or JWT).
*   **Act:** Execute the target function or trigger the endpoint via Supertest.
*   **Assert:** Verify the expected outcomes (e.g., verifying status codes, payload structures, or mock invocations).

## Dependency Mocking
One of the most critical rules in backend testing is isolating third-party services and stateful infrastructure. 

```javascript
// Example: Mocking the BullMQ message queue in a Jest Integration Test
jest.mock('../../src/queue', () => ({
  checkoutQueue: {
    add: jest.fn() // Replaces the real Redis connection with a Jest Spy
  }
}));
```

By intercepting dependencies like **BullMQ** or the **Stripe SDK** using `jest.mock()`, the test suite runs in milliseconds without requiring an active Redis connection or risking rate limits/spam on external APIs. The assertions focus entirely on verifying that the internal logic *attempted* to call the external service with the correct payload.
