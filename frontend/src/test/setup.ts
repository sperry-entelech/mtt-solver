import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, vi } from 'vitest'

// Cleanup after each test case
afterEach(() => {
  cleanup()
})

// Mock environment variables
beforeAll(() => {
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001/api')
  vi.stubEnv('VITE_WS_URL', 'ws://localhost:3001')
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16))
global.cancelAnimationFrame = vi.fn()

// Mock scrollTo
global.scrollTo = vi.fn()

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.sessionStorage = sessionStorageMock

// Mock fetch
global.fetch = vi.fn()

// Custom test utilities
export const createMockCard = (rank: string = 'A', suit: string = 's') => ({
  rank,
  suit
})

export const createMockHand = (cards?: Array<{rank: string, suit: string}>) =>
  cards || [
    { rank: 'A', suit: 's' },
    { rank: 'K', suit: 'h' }
  ]

export const createMockICMData = () => ({
  stacks: [2000, 1500, 1000],
  payouts: [5000, 3000, 2000],
  playerIndex: 0,
  result: {
    equity: 2500.75,
    chipEV: 2666.67,
    dollarEV: 2500.75,
    riskPremium: 165.92
  }
})

// Mock API responses
export const mockApiResponses = {
  handEvaluation: {
    rank: 10,
    description: 'Royal Flush',
    category: 'ROYAL_FLUSH'
  },
  icmCalculation: {
    equity: 2500.75,
    chipEV: 2666.67,
    dollarEV: 2500.75,
    riskPremium: 165.92
  },
  equityCalculation: {
    equity: 0.873
  }
}

// Test data generators
export const generateRandomStacks = (count: number, min: number = 500, max: number = 5000) =>
  Array.from({ length: count }, () => Math.floor(Math.random() * (max - min)) + min)

export const generateRandomPayouts = (count: number, min: number = 1000, max: number = 10000) =>
  Array.from({ length: count }, (_, i) => max - (i * (max - min) / count))

// Custom matchers for poker-specific assertions
expect.extend({
  toBeValidCard(received) {
    const validRanks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']
    const validSuits = ['c', 'd', 'h', 's']

    const pass = received &&
                 typeof received === 'object' &&
                 validRanks.includes(received.rank) &&
                 validSuits.includes(received.suit)

    return {
      message: () => `expected ${JSON.stringify(received)} to be a valid card`,
      pass
    }
  },

  toBeValidEquity(received) {
    const pass = typeof received === 'number' &&
                 received >= 0 &&
                 received <= 1

    return {
      message: () => `expected ${received} to be a valid equity between 0 and 1`,
      pass
    }
  },

  toBeValidStackSize(received) {
    const pass = typeof received === 'number' &&
                 received >= 0 &&
                 Number.isInteger(received)

    return {
      message: () => `expected ${received} to be a valid stack size (non-negative integer)`,
      pass
    }
  }
})

declare global {
  namespace Vi {
    interface JestAssertion {
      toBeValidCard(): void
      toBeValidEquity(): void
      toBeValidStackSize(): void
    }
  }
}