import { jest } from '@jest/globals';

// Global test setup
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/mtt_poker_test';
  process.env.REDIS_URL = 'redis://localhost:6379/1';
});

afterAll(async () => {
  // Clean up after all tests
  jest.clearAllMocks();
});

beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks();
});

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: console.error, // Keep error for debugging
};

// Mock performance.now for consistent timing tests
Object.defineProperty(global, 'performance', {
  writable: true,
  value: {
    now: jest.fn(() => Date.now()),
  },
});

// Increase timeout for integration tests
jest.setTimeout(30000);