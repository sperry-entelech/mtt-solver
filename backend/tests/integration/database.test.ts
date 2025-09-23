import { Pool } from 'pg';
import Redis from 'redis';

describe('Database Integration Tests', () => {
  let pgPool: Pool;
  let redisClient: any;

  beforeAll(async () => {
    // Initialize test database connections
    pgPool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/mtt_poker_test',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    redisClient = Redis.createClient({
      url: process.env.TEST_REDIS_URL || 'redis://localhost:6379/1'
    });

    await redisClient.connect();
    await redisClient.flushAll(); // Clear test Redis
  });

  afterAll(async () => {
    await pgPool.end();
    await redisClient.quit();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await redisClient.flushAll();
    await pgPool.query('TRUNCATE TABLE hand_histories, icm_calculations, user_sessions CASCADE');
  });

  describe('PostgreSQL Connection', () => {
    it('should connect to PostgreSQL database', async () => {
      const result = await pgPool.query('SELECT NOW()');
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toHaveProperty('now');
    });

    it('should handle database errors gracefully', async () => {
      await expect(pgPool.query('SELECT * FROM non_existent_table')).rejects.toThrow();
    });

    it('should support concurrent connections', async () => {
      const promises = Array(20).fill(null).map(() =>
        pgPool.query('SELECT $1 as value', [Math.random()])
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(20);
      results.forEach(result => {
        expect(result.rows).toHaveLength(1);
        expect(result.rows[0]).toHaveProperty('value');
      });
    });
  });

  describe('Redis Connection', () => {
    it('should connect to Redis', async () => {
      await redisClient.set('test_key', 'test_value');
      const value = await redisClient.get('test_key');
      expect(value).toBe('test_value');
    });

    it('should handle Redis operations with expiration', async () => {
      await redisClient.setEx('temp_key', 1, 'temp_value'); // 1 second expiration

      let value = await redisClient.get('temp_key');
      expect(value).toBe('temp_value');

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      value = await redisClient.get('temp_key');
      expect(value).toBeNull();
    });

    it('should support complex data structures', async () => {
      const testData = {
        hand: [{ rank: 'A', suit: 's' }, { rank: 'K', suit: 'h' }],
        equity: 0.87,
        timestamp: Date.now()
      };

      await redisClient.set('complex_key', JSON.stringify(testData));
      const retrieved = JSON.parse(await redisClient.get('complex_key'));

      expect(retrieved).toEqual(testData);
    });
  });

  describe('Hand History Storage', () => {
    it('should store hand evaluation results', async () => {
      const handData = {
        cards: JSON.stringify([
          { rank: 'A', suit: 's' },
          { rank: 'K', suit: 'h' },
          { rank: 'Q', suit: 'd' },
          { rank: 'J', suit: 'c' },
          { rank: 'T', suit: 's' }
        ]),
        evaluation: JSON.stringify({
          rank: 5,
          description: 'Straight, Ace high',
          category: 'STRAIGHT'
        }),
        session_id: 'test_session_123'
      };

      const result = await pgPool.query(
        'INSERT INTO hand_histories (cards, evaluation, session_id) VALUES ($1, $2, $3) RETURNING id',
        [handData.cards, handData.evaluation, handData.session_id]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toHaveProperty('id');
    });

    it('should retrieve hand history by session', async () => {
      const sessionId = 'test_session_456';

      // Insert test data
      await pgPool.query(
        'INSERT INTO hand_histories (cards, evaluation, session_id) VALUES ($1, $2, $3)',
        ['[{"rank":"A","suit":"s"}]', '{"rank":1}', sessionId]
      );

      // Retrieve data
      const result = await pgPool.query(
        'SELECT * FROM hand_histories WHERE session_id = $1',
        [sessionId]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].session_id).toBe(sessionId);
    });
  });

  describe('ICM Calculation Caching', () => {
    it('should cache ICM calculation results', async () => {
      const cacheKey = 'icm:2000,1500,1000:5000,3000,2000:0';
      const icmResult = {
        equity: 2500.75,
        chipEV: 2666.67,
        dollarEV: 2500.75,
        riskPremium: 165.92
      };

      await redisClient.setEx(cacheKey, 300, JSON.stringify(icmResult)); // 5 min cache

      const cached = JSON.parse(await redisClient.get(cacheKey));
      expect(cached).toEqual(icmResult);
    });

    it('should handle cache misses gracefully', async () => {
      const nonExistentKey = 'icm:nonexistent';
      const result = await redisClient.get(nonExistentKey);
      expect(result).toBeNull();
    });

    it('should store calculation in database for analytics', async () => {
      const calculationData = {
        stacks: JSON.stringify([2000, 1500, 1000]),
        payouts: JSON.stringify([5000, 3000, 2000]),
        player_index: 0,
        result: JSON.stringify({
          equity: 2500.75,
          chipEV: 2666.67,
          dollarEV: 2500.75,
          riskPremium: 165.92
        }),
        session_id: 'calc_session_789'
      };

      const result = await pgPool.query(`
        INSERT INTO icm_calculations (stacks, payouts, player_index, result, session_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, created_at
      `, [
        calculationData.stacks,
        calculationData.payouts,
        calculationData.player_index,
        calculationData.result,
        calculationData.session_id
      ]);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toHaveProperty('id');
      expect(result.rows[0]).toHaveProperty('created_at');
    });
  });

  describe('Session Management', () => {
    it('should create and manage user sessions', async () => {
      const sessionData = {
        session_id: 'user_session_abc123',
        user_agent: 'Test Browser',
        ip_address: '127.0.0.1',
        preferences: JSON.stringify({
          theme: 'dark',
          notifications: true,
          autoCalculate: false
        })
      };

      const result = await pgPool.query(`
        INSERT INTO user_sessions (session_id, user_agent, ip_address, preferences)
        VALUES ($1, $2, $3, $4)
        RETURNING id, created_at
      `, [
        sessionData.session_id,
        sessionData.user_agent,
        sessionData.ip_address,
        sessionData.preferences
      ]);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toHaveProperty('id');
    });

    it('should update session activity', async () => {
      const sessionId = 'active_session_xyz';

      // Create session
      await pgPool.query(
        'INSERT INTO user_sessions (session_id) VALUES ($1)',
        [sessionId]
      );

      // Update last activity
      const updateResult = await pgPool.query(
        'UPDATE user_sessions SET last_activity = NOW() WHERE session_id = $1 RETURNING last_activity',
        [sessionId]
      );

      expect(updateResult.rows).toHaveLength(1);
      expect(updateResult.rows[0]).toHaveProperty('last_activity');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle bulk inserts efficiently', async () => {
      const startTime = Date.now();

      const values = Array(1000).fill(null).map((_, i) => [
        `test_session_bulk_${i}`,
        `Test Browser ${i}`,
        '127.0.0.1'
      ]);

      // Use parameterized bulk insert
      const valueStrings = values.map((_, i) =>
        `($${i*3 + 1}, $${i*3 + 2}, $${i*3 + 3})`
      ).join(',');

      const flatValues = values.flat();

      await pgPool.query(
        `INSERT INTO user_sessions (session_id, user_agent, ip_address) VALUES ${valueStrings}`,
        flatValues
      );

      const endTime = Date.now();
      const insertTime = endTime - startTime;

      expect(insertTime).toBeLessThan(1000); // Should complete in under 1 second

      // Verify all records were inserted
      const countResult = await pgPool.query(
        'SELECT COUNT(*) FROM user_sessions WHERE session_id LIKE $1',
        ['test_session_bulk_%']
      );
      expect(parseInt(countResult.rows[0].count)).toBe(1000);
    });

    it('should handle concurrent database operations', async () => {
      const promises = Array(50).fill(null).map(async (_, i) => {
        // Simulate concurrent session creation and ICM calculations
        const sessionId = `concurrent_${i}`;

        await pgPool.query(
          'INSERT INTO user_sessions (session_id) VALUES ($1)',
          [sessionId]
        );

        await pgPool.query(
          'INSERT INTO icm_calculations (stacks, payouts, player_index, result, session_id) VALUES ($1, $2, $3, $4, $5)',
          [
            JSON.stringify([1000 + i, 800 + i]),
            JSON.stringify([1000, 600]),
            0,
            JSON.stringify({ equity: 600 + i }),
            sessionId
          ]
        );

        return sessionId;
      });

      const results = await Promise.all(promises);
      expect(results).toHaveLength(50);

      // Verify all data was inserted correctly
      const sessionCount = await pgPool.query(
        'SELECT COUNT(*) FROM user_sessions WHERE session_id LIKE $1',
        ['concurrent_%']
      );
      expect(parseInt(sessionCount.rows[0].count)).toBe(50);

      const calcCount = await pgPool.query(
        'SELECT COUNT(*) FROM icm_calculations WHERE session_id LIKE $1',
        ['concurrent_%']
      );
      expect(parseInt(calcCount.rows[0].count)).toBe(50);
    });

    it('should maintain Redis performance under load', async () => {
      const startTime = Date.now();

      const promises = Array(1000).fill(null).map(async (_, i) => {
        const key = `load_test_${i}`;
        const value = JSON.stringify({
          index: i,
          timestamp: Date.now(),
          data: `test_data_${i}`
        });

        await redisClient.set(key, value);
        return redisClient.get(key);
      });

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(2000); // Should complete in under 2 seconds
      expect(results).toHaveLength(1000);
      results.forEach((result, i) => {
        const parsed = JSON.parse(result);
        expect(parsed.index).toBe(i);
      });
    });
  });

  describe('Data Integrity', () => {
    it('should enforce foreign key constraints', async () => {
      // Try to insert hand history with non-existent session
      await expect(
        pgPool.query(
          'INSERT INTO hand_histories (cards, evaluation, session_id) VALUES ($1, $2, $3)',
          ['[]', '{}', 'non_existent_session']
        )
      ).rejects.toThrow(); // Should fail due to foreign key constraint
    });

    it('should handle JSON validation properly', async () => {
      // Insert valid JSON
      await expect(
        pgPool.query(
          'INSERT INTO user_sessions (session_id, preferences) VALUES ($1, $2)',
          ['json_test', '{"valid": "json"}']
        )
      ).resolves.not.toThrow();

      // The database should handle JSON validation based on your schema
    });

    it('should maintain transactional consistency', async () => {
      const client = await pgPool.connect();

      try {
        await client.query('BEGIN');

        // Insert session
        const sessionResult = await client.query(
          'INSERT INTO user_sessions (session_id) VALUES ($1) RETURNING id',
          ['transaction_test']
        );

        // Insert related data
        await client.query(
          'INSERT INTO hand_histories (cards, evaluation, session_id) VALUES ($1, $2, $3)',
          ['[]', '{}', 'transaction_test']
        );

        await client.query('COMMIT');

        // Verify both records exist
        const sessionCheck = await pgPool.query(
          'SELECT id FROM user_sessions WHERE session_id = $1',
          ['transaction_test']
        );
        expect(sessionCheck.rows).toHaveLength(1);

        const historyCheck = await pgPool.query(
          'SELECT id FROM hand_histories WHERE session_id = $1',
          ['transaction_test']
        );
        expect(historyCheck.rows).toHaveLength(1);

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    });
  });

  describe('Connection Pooling', () => {
    it('should handle connection pool exhaustion gracefully', async () => {
      // Create more connections than pool allows
      const promises = Array(15).fill(null).map(async (_, i) => {
        const result = await pgPool.query('SELECT $1 as connection_id', [i]);
        // Add small delay to hold connections
        await new Promise(resolve => setTimeout(resolve, 100));
        return result.rows[0].connection_id;
      });

      // Should not timeout or fail
      const results = await Promise.all(promises);
      expect(results).toHaveLength(15);
    });

    it('should reuse connections efficiently', async () => {
      const connectionIds = new Set();

      for (let i = 0; i < 20; i++) {
        const result = await pgPool.query('SELECT pg_backend_pid() as pid');
        connectionIds.add(result.rows[0].pid);
      }

      // Should reuse connections (fewer unique PIDs than queries)
      expect(connectionIds.size).toBeLessThan(20);
      expect(connectionIds.size).toBeGreaterThan(0);
    });
  });
});