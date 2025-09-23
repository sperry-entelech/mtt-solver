import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Global test setup
beforeAll(async () => {
  // Setup test database, Redis connections, etc.
  console.log('Setting up test environment...');
});

afterAll(async () => {
  // Cleanup test environment
  console.log('Cleaning up test environment...');
});

// Mock external dependencies for unit tests
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    flushall: jest.fn()
  }))
}));

jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    connect: jest.fn(),
    end: jest.fn(),
    query: jest.fn()
  }))
}));

// Custom matchers for poker-specific assertions
expect.extend({
  toBeValidCard(received: any) {
    const validRanks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    const validSuits = ['c', 'd', 'h', 's'];

    const pass = received &&
                 typeof received === 'object' &&
                 validRanks.includes(received.rank) &&
                 validSuits.includes(received.suit);

    return {
      message: () => `expected ${JSON.stringify(received)} to be a valid card`,
      pass
    };
  },

  toHaveHandRank(received: any, expected: number) {
    const pass = received &&
                 typeof received === 'object' &&
                 received.rank === expected;

    return {
      message: () => `expected hand evaluation to have rank ${expected}, got ${received?.rank}`,
      pass
    };
  },

  toBeValidEquity(received: number) {
    const pass = typeof received === 'number' &&
                 received >= 0 &&
                 received <= 1;

    return {
      message: () => `expected ${received} to be a valid equity between 0 and 1`,
      pass
    };
  }
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidCard(): R;
      toHaveHandRank(rank: number): R;
      toBeValidEquity(): R;
    }
  }
}