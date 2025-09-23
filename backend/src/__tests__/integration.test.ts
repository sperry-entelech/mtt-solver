import request from 'supertest';
import { app } from '../app';

describe('API Integration Tests', () => {
  describe('Hand Evaluation Endpoints', () => {
    it('POST /api/evaluate-hand should evaluate a poker hand', async () => {
      const cards = [
        { rank: 'A', suit: 'h' },
        { rank: 'K', suit: 'h' },
        { rank: 'Q', suit: 'h' },
        { rank: 'J', suit: 'h' },
        { rank: 'T', suit: 'h' },
        { rank: '2', suit: 's' },
        { rank: '3', suit: 's' }
      ];

      const response = await request(app)
        .post('/api/evaluate-hand')
        .send({ cards })
        .expect(200);

      expect(response.body).toHaveProperty('handType');
      expect(response.body).toHaveProperty('strength');
      expect(response.body.handType).toBe('ROYAL_FLUSH');
    });

    it('POST /api/compare-hands should compare multiple hands', async () => {
      const hands = [
        [
          { rank: 'A', suit: 'h' },
          { rank: 'A', suit: 's' },
          { rank: 'K', suit: 'c' },
          { rank: 'K', suit: 'd' },
          { rank: 'Q', suit: 'h' },
          { rank: '2', suit: 's' },
          { rank: '3', suit: 's' }
        ],
        [
          { rank: 'K', suit: 'h' },
          { rank: 'K', suit: 's' },
          { rank: 'Q', suit: 'c' },
          { rank: 'Q', suit: 'd' },
          { rank: 'J', suit: 'h' },
          { rank: '2', suit: 's' },
          { rank: '3', suit: 's' }
        ]
      ];

      const response = await request(app)
        .post('/api/compare-hands')
        .send({ hands })
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(response.body.results).toHaveLength(2);
      expect(response.body.results[0].strength).toBeGreaterThan(response.body.results[1].strength);
    });

    it('should handle invalid cards gracefully', async () => {
      const invalidCards = [
        { rank: 'X', suit: 'h' }, // Invalid rank
        { rank: 'A', suit: 'z' }  // Invalid suit
      ];

      const response = await request(app)
        .post('/api/evaluate-hand')
        .send({ cards: invalidCards })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('ICM Calculation Endpoints', () => {
    it('POST /api/calculate-icm should calculate ICM values', async () => {
      const stacks = [2000, 1500, 1000, 500];
      const payouts = [1000, 600, 400, 200];

      const response = await request(app)
        .post('/api/calculate-icm')
        .send({ stacks, payouts })
        .expect(200);

      expect(response.body).toHaveProperty('icmValues');
      expect(response.body.icmValues).toHaveLength(4);
      expect(response.body.icmValues[0]).toBeGreaterThan(response.body.icmValues[3]);
    });

    it('POST /api/push-fold-equity should calculate push/fold equity', async () => {
      const requestBody = {
        heroStack: 800,
        villainStack: 1200,
        otherStacks: [2000, 1500],
        payouts: [1000, 600, 400, 200],
        heroWinRate: 0.6
      };

      const response = await request(app)
        .post('/api/push-fold-equity')
        .send(requestBody)
        .expect(200);

      expect(response.body).toHaveProperty('pushEquity');
      expect(response.body).toHaveProperty('foldEquity');
      expect(response.body.pushEquity).toBeGreaterThan(0);
      expect(response.body.foldEquity).toBeGreaterThan(0);
    });

    it('should validate ICM input parameters', async () => {
      const invalidRequest = {
        stacks: [1000, -500], // Negative stack
        payouts: [600, 400]
      };

      const response = await request(app)
        .post('/api/calculate-icm')
        .send(invalidRequest)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Nash Solver Endpoints', () => {
    it('POST /api/generate-charts should generate push/fold charts', async () => {
      const requestBody = {
        blindLevels: [{ sb: 25, bb: 50, ante: 5 }],
        stackSizes: [10, 15, 20]
      };

      const response = await request(app)
        .post('/api/generate-charts')
        .send(requestBody)
        .expect(200);

      expect(response.body).toHaveProperty('charts');
      expect(response.body.charts).toHaveLength(1);
      expect(response.body.charts[0]).toHaveProperty('pushRanges');
      expect(response.body.charts[0]).toHaveProperty('callRanges');
    });

    it('POST /api/solve-scenario should solve heads-up scenario', async () => {
      const scenario = {
        heroStack: 600,
        villainStack: 800,
        bigBlind: 50,
        smallBlind: 25,
        ante: 5,
        position: 'SB'
      };

      const response = await request(app)
        .post('/api/solve-scenario')
        .send(scenario)
        .expect(200);

      expect(response.body).toHaveProperty('equilibriumPushRange');
      expect(response.body).toHaveProperty('equilibriumCallRange');
      expect(response.body.equilibriumPushRange).toHaveProperty('combinations');
    });

    it('should handle invalid Nash solver parameters', async () => {
      const invalidScenario = {
        heroStack: 0, // Invalid stack size
        villainStack: 800,
        bigBlind: 50,
        smallBlind: 25,
        ante: 5,
        position: 'SB'
      };

      const response = await request(app)
        .post('/api/solve-scenario')
        .send(invalidScenario)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Range Analysis Endpoints', () => {
    it('POST /api/analyze-range should analyze hand range', async () => {
      const requestBody = {
        range: 'AA-TT,AK-AJ,KQ-KJ',
        board: [
          { rank: 'A', suit: 'h' },
          { rank: 'K', suit: 's' },
          { rank: 'Q', suit: 'c' }
        ]
      };

      const response = await request(app)
        .post('/api/analyze-range')
        .send(requestBody)
        .expect(200);

      expect(response.body).toHaveProperty('combinations');
      expect(response.body).toHaveProperty('equity');
      expect(response.body.combinations).toBeGreaterThan(0);
    });

    it('POST /api/range-vs-range should calculate range equity', async () => {
      const requestBody = {
        range1: 'AA-QQ,AK',
        range2: '22-99,AQ-A9',
        board: []
      };

      const response = await request(app)
        .post('/api/range-vs-range')
        .send(requestBody)
        .expect(200);

      expect(response.body).toHaveProperty('range1Equity');
      expect(response.body).toHaveProperty('range2Equity');
      expect(response.body.range1Equity + response.body.range2Equity).toBeCloseTo(1, 2);
    });

    it('should validate range notation', async () => {
      const invalidRequest = {
        range: 'ZZ-YY', // Invalid range notation
        board: []
      };

      const response = await request(app)
        .post('/api/analyze-range')
        .send(invalidRequest)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent requests efficiently', async () => {
      const cards = [
        { rank: 'A', suit: 'h' },
        { rank: 'K', suit: 's' },
        { rank: 'Q', suit: 'c' },
        { rank: 'J', suit: 'd' },
        { rank: 'T', suit: 'h' },
        { rank: '2', suit: 's' },
        { rank: '3', suit: 's' }
      ];

      const requests = Array.from({ length: 10 }, () =>
        request(app)
          .post('/api/evaluate-hand')
          .send({ cards })
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should handle 10 concurrent requests in reasonable time
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(5000); // 5 seconds
    });

    it('should respond to health check quickly', async () => {
      const startTime = Date.now();
      const response = await request(app)
        .get('/health')
        .expect(200);
      const endTime = Date.now();

      expect(response.body).toHaveProperty('status', 'ok');
      expect(endTime - startTime).toBeLessThan(100); // Should respond in under 100ms
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown endpoints', async () => {
      const response = await request(app)
        .get('/api/unknown-endpoint')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/evaluate-hand')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/evaluate-hand')
        .send({}) // Missing cards field
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Security Tests', () => {
    it('should prevent SQL injection attempts', async () => {
      const maliciousInput = {
        range: "'; DROP TABLE users; --",
        board: []
      };

      const response = await request(app)
        .post('/api/analyze-range')
        .send(maliciousInput)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should limit request size', async () => {
      const largePayload = {
        cards: Array.from({ length: 10000 }, (_, i) => ({
          rank: 'A',
          suit: 'h'
        }))
      };

      const response = await request(app)
        .post('/api/evaluate-hand')
        .send(largePayload)
        .expect(413); // Payload too large
    });

    it('should set security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options', 'DENY');
      expect(response.headers).toHaveProperty('x-xss-protection', '1; mode=block');
    });
  });
});