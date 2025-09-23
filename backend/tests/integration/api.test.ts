import request from 'supertest';
import express from 'express';
import { createApp } from '../../src/index';

describe('API Integration Tests', () => {
  let app: express.Application;

  beforeAll(async () => {
    // Create test app instance
    app = createApp();

    // Wait for database connections, etc.
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    // Clean up resources
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('POST /api/hands/evaluate', () => {
    it('should evaluate a valid 5-card hand', async () => {
      const cards = [
        { rank: 'A', suit: 's' },
        { rank: 'K', suit: 's' },
        { rank: 'Q', suit: 's' },
        { rank: 'J', suit: 's' },
        { rank: 'T', suit: 's' }
      ];

      const response = await request(app)
        .post('/api/hands/evaluate')
        .send({ cards })
        .expect(200);

      expect(response.body).toHaveProperty('rank', 10);
      expect(response.body).toHaveProperty('description', 'Royal Flush');
      expect(response.body).toHaveProperty('category');
    });

    it('should evaluate a 7-card hand (Hold\'em)', async () => {
      const cards = [
        { rank: 'A', suit: 's' }, // Hole cards
        { rank: 'K', suit: 'h' },
        { rank: 'A', suit: 'd' }, // Board
        { rank: 'K', suit: 'c' },
        { rank: 'Q', suit: 's' },
        { rank: 'J', suit: 'h' },
        { rank: 'T', suit: 'd' }
      ];

      const response = await request(app)
        .post('/api/hands/evaluate')
        .send({ cards })
        .expect(200);

      expect(response.body).toHaveProperty('rank');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('category');
    });

    it('should return 400 for invalid card count', async () => {
      const cards = [
        { rank: 'A', suit: 's' },
        { rank: 'K', suit: 'h' }
      ];

      const response = await request(app)
        .post('/api/hands/evaluate')
        .send({ cards })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid card format', async () => {
      const cards = [
        { rank: 'X', suit: 's' }, // Invalid rank
        { rank: 'K', suit: 'h' },
        { rank: 'Q', suit: 'd' },
        { rank: 'J', suit: 'c' },
        { rank: 'T', suit: 's' }
      ];

      const response = await request(app)
        .post('/api/hands/evaluate')
        .send({ cards })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle missing request body', async () => {
      await request(app)
        .post('/api/hands/evaluate')
        .expect(400);
    });
  });

  describe('POST /api/hands/equity', () => {
    it('should calculate equity between two hands', async () => {
      const hand1 = [{ rank: 'A', suit: 's' }, { rank: 'A', suit: 'h' }];
      const hand2 = [{ rank: '2', suit: 'c' }, { rank: '7', suit: 'd' }];

      const response = await request(app)
        .post('/api/hands/equity')
        .send({
          hand1,
          hand2,
          board: [],
          iterations: 1000
        })
        .expect(200);

      expect(response.body).toHaveProperty('equity');
      expect(response.body.equity).toBeGreaterThan(0.8);
      expect(response.body.equity).toBeLessThanOrEqual(1);
    });

    it('should calculate equity with board cards', async () => {
      const hand1 = [{ rank: 'A', suit: 's' }, { rank: 'K', suit: 'h' }];
      const hand2 = [{ rank: 'Q', suit: 'c' }, { rank: 'J', suit: 'd' }];
      const board = [
        { rank: 'A', suit: 'd' },
        { rank: 'K', suit: 'c' },
        { rank: '2', suit: 's' }
      ];

      const response = await request(app)
        .post('/api/hands/equity')
        .send({
          hand1,
          hand2,
          board,
          iterations: 1000
        })
        .expect(200);

      expect(response.body).toHaveProperty('equity');
      expect(response.body.equity).toBeGreaterThan(0.8);
    });

    it('should return 400 for too many board cards', async () => {
      const hand1 = [{ rank: 'A', suit: 's' }, { rank: 'K', suit: 'h' }];
      const hand2 = [{ rank: 'Q', suit: 'c' }, { rank: 'J', suit: 'd' }];
      const board = [
        { rank: 'A', suit: 'd' },
        { rank: 'K', suit: 'c' },
        { rank: '2', suit: 's' },
        { rank: '3', suit: 'h' },
        { rank: '4', suit: 'c' },
        { rank: '5', suit: 'd' } // 6 cards - invalid
      ];

      await request(app)
        .post('/api/hands/equity')
        .send({ hand1, hand2, board })
        .expect(400);
    });
  });

  describe('POST /api/icm/calculate', () => {
    it('should calculate ICM for valid tournament scenario', async () => {
      const stacks = [2000, 1500, 1000, 500];
      const payouts = [5000, 3000, 2000, 1000];
      const playerIndex = 0;

      const response = await request(app)
        .post('/api/icm/calculate')
        .send({ stacks, payouts, playerIndex })
        .expect(200);

      expect(response.body).toHaveProperty('equity');
      expect(response.body).toHaveProperty('chipEV');
      expect(response.body).toHaveProperty('dollarEV');
      expect(response.body).toHaveProperty('riskPremium');
    });

    it('should handle heads-up scenario', async () => {
      const stacks = [1000, 500];
      const payouts = [1000, 600];
      const playerIndex = 0;

      const response = await request(app)
        .post('/api/icm/calculate')
        .send({ stacks, payouts, playerIndex })
        .expect(200);

      expect(response.body.equity).toBeGreaterThan(0.6);
    });

    it('should return 400 for empty inputs', async () => {
      await request(app)
        .post('/api/icm/calculate')
        .send({ stacks: [], payouts: [1000] })
        .expect(400);
    });

    it('should return 400 for invalid player index', async () => {
      const stacks = [1000, 500];
      const payouts = [1000, 600];

      await request(app)
        .post('/api/icm/calculate')
        .send({ stacks, payouts, playerIndex: 5 })
        .expect(400);
    });
  });

  describe('POST /api/icm/bubble-factor', () => {
    it('should calculate bubble factor', async () => {
      const stacks = [2000, 1000, 1000];
      const payouts = [5000, 3000];
      const playerIndex = 2; // Short stack on bubble

      const response = await request(app)
        .post('/api/icm/bubble-factor')
        .send({ stacks, payouts, playerIndex })
        .expect(200);

      expect(response.body).toHaveProperty('bubbleFactor');
      expect(response.body.bubbleFactor).toBeGreaterThan(1);
    });
  });

  describe('POST /api/solver/push-fold', () => {
    it('should calculate push/fold equity', async () => {
      const heroStack = 1000;
      const villainStack = 1500;
      const blinds = 100;
      const antes = 0;
      const callingRange = 0.15;
      const foldEquity = 0.85;

      const response = await request(app)
        .post('/api/solver/push-fold')
        .send({
          heroStack,
          villainStack,
          blinds,
          antes,
          callingRange,
          foldEquity
        })
        .expect(200);

      expect(response.body).toHaveProperty('pushEV');
      expect(response.body).toHaveProperty('foldEV');
      expect(response.body.foldEV).toBe(0);
    });
  });

  describe('GET /api/ranges/push/:stackSize', () => {
    it('should return optimal push range for stack size', async () => {
      const stackSize = 8; // 8BB

      const response = await request(app)
        .get(`/api/ranges/push/${stackSize}`)
        .expect(200);

      expect(response.body).toHaveProperty('range');
      expect(Array.isArray(response.body.range)).toBe(true);
      expect(response.body.range).toContain('AA');
    });

    it('should return 400 for invalid stack size', async () => {
      await request(app)
        .get('/api/ranges/push/0')
        .expect(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const cards = [
        { rank: 'A', suit: 's' },
        { rank: 'K', suit: 'h' },
        { rank: 'Q', suit: 'd' },
        { rank: 'J', suit: 'c' },
        { rank: 'T', suit: 's' }
      ];

      // Make many requests quickly
      const promises = Array(150).fill(null).map(() =>
        request(app)
          .post('/api/hands/evaluate')
          .send({ cards })
      );

      const responses = await Promise.all(promises);

      // Some should be rate limited (429)
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('CORS Headers', () => {
    it('should include proper CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    it('should handle preflight requests', async () => {
      const response = await request(app)
        .options('/api/hands/evaluate')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-methods');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });
  });

  describe('Performance', () => {
    it('should respond to hand evaluation within 50ms', async () => {
      const cards = [
        { rank: 'A', suit: 's' },
        { rank: 'K', suit: 'h' },
        { rank: 'Q', suit: 'd' },
        { rank: 'J', suit: 'c' },
        { rank: 'T', suit: 's' }
      ];

      const startTime = Date.now();

      await request(app)
        .post('/api/hands/evaluate')
        .send({ cards })
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(50);
    });

    it('should respond to ICM calculation within 200ms', async () => {
      const stacks = [2000, 1500, 1000, 500];
      const payouts = [5000, 3000, 2000, 1000];

      const startTime = Date.now();

      await request(app)
        .post('/api/icm/calculate')
        .send({ stacks, payouts, playerIndex: 0 })
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/hands/evaluate')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle server errors gracefully', async () => {
      // This would require mocking internal services to throw errors
      // Implementation depends on your error handling strategy
    });

    it('should return proper error format', async () => {
      const response = await request(app)
        .post('/api/hands/evaluate')
        .send({}) // Missing required fields
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path');
    });
  });
});