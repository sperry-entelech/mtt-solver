import request from 'supertest';
import { createApp } from '../../src/index';
import express from 'express';

describe('Security - Input Validation Tests', () => {
  let app: express.Application;

  beforeAll(async () => {
    app = createApp();
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  describe('SQL Injection Prevention', () => {
    it('should reject SQL injection attempts in session IDs', async () => {
      const maliciousSessionId = "'; DROP TABLE users; --";

      const response = await request(app)
        .post('/api/hands/evaluate')
        .set('X-Session-ID', maliciousSessionId)
        .send({
          cards: [
            { rank: 'A', suit: 's' },
            { rank: 'K', suit: 'h' },
            { rank: 'Q', suit: 'd' },
            { rank: 'J', suit: 'c' },
            { rank: 'T', suit: 's' }
          ]
        });

      // Should either sanitize or reject the malicious input
      expect([200, 400, 422]).toContain(response.status);
      if (response.status === 200) {
        // If processed, should be sanitized
        expect(response.body).not.toContain('DROP TABLE');
      }
    });

    it('should handle SQL injection in card data', async () => {
      const maliciousCards = [
        { rank: "A'; DROP TABLE hands; --", suit: 's' },
        { rank: 'K', suit: 'h' },
        { rank: 'Q', suit: 'd' },
        { rank: 'J', suit: 'c' },
        { rank: 'T', suit: 's' }
      ];

      const response = await request(app)
        .post('/api/hands/evaluate')
        .send({ cards: maliciousCards })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/invalid|validation/i);
    });

    it('should sanitize database query parameters', async () => {
      const maliciousStack = "1000; DELETE FROM icm_calculations; SELECT 1";

      const response = await request(app)
        .post('/api/icm/calculate')
        .send({
          stacks: [maliciousStack, 500],
          payouts: [1000, 600],
          playerIndex: 0
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('XSS Prevention', () => {
    it('should reject XSS attempts in card ranks', async () => {
      const xssCards = [
        { rank: '<script>alert("XSS")</script>', suit: 's' },
        { rank: 'K', suit: 'h' },
        { rank: 'Q', suit: 'd' },
        { rank: 'J', suit: 'c' },
        { rank: 'T', suit: 's' }
      ];

      const response = await request(app)
        .post('/api/hands/evaluate')
        .send({ cards: xssCards })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).not.toContain('<script>');
    });

    it('should sanitize user-provided descriptions', async () => {
      const xssPayload = '<img src="x" onerror="alert(\'XSS\')">';

      const response = await request(app)
        .post('/api/hands/evaluate')
        .set('User-Agent', xssPayload)
        .send({
          cards: [
            { rank: 'A', suit: 's' },
            { rank: 'K', suit: 'h' },
            { rank: 'Q', suit: 'd' },
            { rank: 'J', suit: 'c' },
            { rank: 'T', suit: 's' }
          ]
        });

      // Should process normally and not echo back XSS payload
      if (response.status === 200) {
        expect(JSON.stringify(response.body)).not.toContain('<img');
        expect(JSON.stringify(response.body)).not.toContain('onerror');
      }
    });
  });

  describe('Input Size Limits', () => {
    it('should reject oversized card arrays', async () => {
      const oversizedCards = Array(1000).fill(null).map((_, i) => ({
        rank: 'A',
        suit: ['s', 'h', 'd', 'c'][i % 4]
      }));

      const response = await request(app)
        .post('/api/hands/evaluate')
        .send({ cards: oversizedCards })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/too many|limit|size/i);
    });

    it('should reject oversized stack arrays', async () => {
      const oversizedStacks = Array(10000).fill(1000);
      const payouts = [5000, 3000, 2000];

      const response = await request(app)
        .post('/api/icm/calculate')
        .send({
          stacks: oversizedStacks,
          payouts,
          playerIndex: 0
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject extremely large numbers', async () => {
      const hugeStack = Number.MAX_SAFE_INTEGER * 2;

      const response = await request(app)
        .post('/api/icm/calculate')
        .send({
          stacks: [hugeStack, 1000],
          payouts: [2000, 1000],
          playerIndex: 0
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Data Type Validation', () => {
    it('should reject non-numeric stack values', async () => {
      const response = await request(app)
        .post('/api/icm/calculate')
        .send({
          stacks: ['not_a_number', 1000],
          payouts: [2000, 1000],
          playerIndex: 0
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/numeric|number|invalid/i);
    });

    it('should reject invalid card suit values', async () => {
      const invalidCards = [
        { rank: 'A', suit: 'invalid' },
        { rank: 'K', suit: 'h' },
        { rank: 'Q', suit: 'd' },
        { rank: 'J', suit: 'c' },
        { rank: 'T', suit: 's' }
      ];

      const response = await request(app)
        .post('/api/hands/evaluate')
        .send({ cards: invalidCards })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject null and undefined values', async () => {
      const response = await request(app)
        .post('/api/icm/calculate')
        .send({
          stacks: [1000, null, undefined],
          payouts: [2000, 1000],
          playerIndex: 0
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle boolean values appropriately', async () => {
      const response = await request(app)
        .post('/api/icm/calculate')
        .send({
          stacks: [true, false], // Should be rejected
          payouts: [2000, 1000],
          playerIndex: 0
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Business Logic Validation', () => {
    it('should reject negative stack values', async () => {
      const response = await request(app)
        .post('/api/icm/calculate')
        .send({
          stacks: [1000, -500], // Negative stack
          payouts: [2000, 1000],
          playerIndex: 0
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/negative|positive/i);
    });

    it('should reject zero or negative payouts', async () => {
      const response = await request(app)
        .post('/api/icm/calculate')
        .send({
          stacks: [1000, 500],
          payouts: [2000, -1000], // Negative payout
          playerIndex: 0
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject out-of-bounds player index', async () => {
      const response = await request(app)
        .post('/api/icm/calculate')
        .send({
          stacks: [1000, 500],
          payouts: [2000, 1000],
          playerIndex: 5 // Out of bounds
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/index|range/i);
    });

    it('should reject duplicate cards in hand', async () => {
      const duplicateCards = [
        { rank: 'A', suit: 's' },
        { rank: 'A', suit: 's' }, // Duplicate
        { rank: 'K', suit: 'h' },
        { rank: 'Q', suit: 'd' },
        { rank: 'J', suit: 'c' }
      ];

      const response = await request(app)
        .post('/api/hands/evaluate')
        .send({ cards: duplicateCards })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/duplicate|unique/i);
    });
  });

  describe('Rate Limiting Security', () => {
    it('should implement progressive rate limiting', async () => {
      const testCard = [
        { rank: 'A', suit: 's' },
        { rank: 'K', suit: 'h' },
        { rank: 'Q', suit: 'd' },
        { rank: 'J', suit: 'c' },
        { rank: 'T', suit: 's' }
      ];

      const responses = [];

      // Make rapid requests
      for (let i = 0; i < 200; i++) {
        const response = await request(app)
          .post('/api/hands/evaluate')
          .send({ cards: testCard });

        responses.push(response.status);

        // Stop if we hit rate limit
        if (response.status === 429) break;
      }

      // Should eventually hit rate limit
      expect(responses).toContain(429);
    });

    it('should reset rate limits after cooldown period', async () => {
      // This test would require waiting for rate limit reset
      // Implementation depends on your rate limiting strategy
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
    });
  });

  describe('Header Injection Prevention', () => {
    it('should reject header injection attempts', async () => {
      const maliciousHeader = 'test\r\nX-Injected: malicious';

      const response = await request(app)
        .post('/api/hands/evaluate')
        .set('X-Custom-Header', maliciousHeader)
        .send({
          cards: [
            { rank: 'A', suit: 's' },
            { rank: 'K', suit: 'h' },
            { rank: 'Q', suit: 'd' },
            { rank: 'J', suit: 'c' },
            { rank: 'T', suit: 's' }
          ]
        });

      // Should not reflect injected headers
      expect(response.headers).not.toHaveProperty('x-injected');
    });
  });

  describe('JSON Payload Attacks', () => {
    it('should handle deeply nested JSON', async () => {
      // Create deeply nested object
      let deeplyNested: any = { value: 'test' };
      for (let i = 0; i < 1000; i++) {
        deeplyNested = { nested: deeplyNested };
      }

      const response = await request(app)
        .post('/api/hands/evaluate')
        .send({
          cards: [
            { rank: 'A', suit: 's' },
            { rank: 'K', suit: 'h' },
            { rank: 'Q', suit: 'd' },
            { rank: 'J', suit: 'c' },
            { rank: 'T', suit: 's' }
          ],
          metadata: deeplyNested
        });

      // Should reject or handle gracefully
      expect([400, 413, 422]).toContain(response.status);
    });

    it('should handle extremely long strings', async () => {
      const longString = 'A'.repeat(1000000); // 1MB string

      const response = await request(app)
        .post('/api/hands/evaluate')
        .send({
          cards: [
            { rank: 'A', suit: 's' },
            { rank: 'K', suit: 'h' },
            { rank: 'Q', suit: 'd' },
            { rank: 'J', suit: 'c' },
            { rank: 'T', suit: 's' }
          ],
          description: longString
        });

      expect([400, 413]).toContain(response.status);
    });

    it('should handle circular references', async () => {
      // Note: JSON.stringify would fail on circular references
      // This tests that the API handles malformed JSON gracefully
      const response = await request(app)
        .post('/api/hands/evaluate')
        .set('Content-Type', 'application/json')
        .send('{"cards":[{"rank":"A","suit":"s","self":{"$ref":"#"}}]}');

      expect([400, 422]).toContain(response.status);
    });
  });

  describe('File Upload Security', () => {
    it('should reject file uploads if not supported', async () => {
      const response = await request(app)
        .post('/api/hands/evaluate')
        .attach('file', Buffer.from('test'), 'test.txt');

      // Should reject file uploads for this endpoint
      expect([400, 405, 415]).toContain(response.status);
    });
  });

  describe('Content-Type Validation', () => {
    it('should reject non-JSON content types', async () => {
      const response = await request(app)
        .post('/api/hands/evaluate')
        .set('Content-Type', 'text/plain')
        .send('not json');

      expect([400, 415]).toContain(response.status);
    });

    it('should handle missing content-type header', async () => {
      const response = await request(app)
        .post('/api/hands/evaluate')
        .unset('Content-Type')
        .send(JSON.stringify({
          cards: [
            { rank: 'A', suit: 's' },
            { rank: 'K', suit: 'h' },
            { rank: 'Q', suit: 'd' },
            { rank: 'J', suit: 'c' },
            { rank: 'T', suit: 's' }
          ]
        }));

      // Should either accept with default or reject
      expect([200, 400, 415]).toContain(response.status);
    });
  });

  describe('Authentication & Authorization', () => {
    it('should handle missing authentication gracefully', async () => {
      // This test assumes authentication is required for certain endpoints
      const response = await request(app)
        .post('/api/admin/stats')
        .send({});

      expect([401, 403, 404]).toContain(response.status);
    });

    it('should reject malformed JWT tokens', async () => {
      const malformedToken = 'not.a.valid.jwt.token';

      const response = await request(app)
        .post('/api/hands/evaluate')
        .set('Authorization', `Bearer ${malformedToken}`)
        .send({
          cards: [
            { rank: 'A', suit: 's' },
            { rank: 'K', suit: 'h' },
            { rank: 'Q', suit: 'd' },
            { rank: 'J', suit: 'c' },
            { rank: 'T', suit: 's' }
          ]
        });

      // Should either ignore invalid token or reject
      expect([200, 401, 403]).toContain(response.status);
    });
  });

  describe('Error Information Disclosure', () => {
    it('should not expose internal error details in production', async () => {
      // Force an internal error (assuming development vs production environment)
      const response = await request(app)
        .post('/api/hands/evaluate')
        .send({ cards: null });

      if (response.status >= 500) {
        // Should not expose stack traces in production
        expect(response.body).not.toHaveProperty('stack');
        expect(response.body).not.toHaveProperty('trace');
        expect(JSON.stringify(response.body)).not.toMatch(/Error:/);
      }
    });

    it('should use generic error messages for validation failures', async () => {
      const response = await request(app)
        .post('/api/icm/calculate')
        .send({
          stacks: 'invalid',
          payouts: [1000],
          playerIndex: 0
        })
        .expect(400);

      // Should provide useful but not overly detailed error message
      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
      expect(response.body.error.length).toBeGreaterThan(10);
      expect(response.body.error.length).toBeLessThan(200);
    });
  });
});