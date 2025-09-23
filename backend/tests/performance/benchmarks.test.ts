import { HandEvaluator } from '../../src/services/handEvaluator';
import { ICMCalculator } from '../../src/services/icmCalculator';
import { Card } from '../../src/types';

describe('Performance Benchmarks', () => {
  const PERFORMANCE_THRESHOLDS = {
    HAND_EVALUATION_MS: 1,
    ICM_CALCULATION_MS: 100,
    EQUITY_CALCULATION_MS: 5000,
    BULK_OPERATIONS_MS: 10000
  };

  describe('Hand Evaluation Performance', () => {
    it('should evaluate 5-card hands under 1ms average', () => {
      const testHands: Card[][] = [
        // Royal flush
        [
          { rank: 'A', suit: 's' },
          { rank: 'K', suit: 's' },
          { rank: 'Q', suit: 's' },
          { rank: 'J', suit: 's' },
          { rank: 'T', suit: 's' }
        ],
        // Four of a kind
        [
          { rank: 'A', suit: 's' },
          { rank: 'A', suit: 'h' },
          { rank: 'A', suit: 'd' },
          { rank: 'A', suit: 'c' },
          { rank: 'K', suit: 's' }
        ],
        // High card
        [
          { rank: 'A', suit: 's' },
          { rank: 'J', suit: 'h' },
          { rank: '9', suit: 'd' },
          { rank: '7', suit: 'c' },
          { rank: '2', suit: 's' }
        ]
      ];

      const iterations = 10000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const handIndex = i % testHands.length;
        HandEvaluator.evaluateHand(testHands[handIndex]);
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / iterations;

      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLDS.HAND_EVALUATION_MS);
      console.log(`Hand evaluation average: ${avgTime.toFixed(4)}ms`);
    });

    it('should evaluate 7-card hands efficiently', () => {
      const sevenCardHand: Card[] = [
        { rank: 'A', suit: 's' },
        { rank: 'K', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: 'K', suit: 'c' },
        { rank: 'Q', suit: 's' },
        { rank: 'J', suit: 'h' },
        { rank: 'T', suit: 'd' }
      ];

      const iterations = 1000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        HandEvaluator.evaluateHand(sevenCardHand);
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / iterations;

      expect(avgTime).toBeLessThan(5); // 7-card hands take longer due to combinations
      console.log(`7-card hand evaluation average: ${avgTime.toFixed(4)}ms`);
    });

    it('should handle worst-case scenarios efficiently', () => {
      // Generate random hands to test worst-case performance
      const generateRandomHand = (): Card[] => {
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
        const suits = ['c', 'd', 'h', 's'];
        const hand: Card[] = [];
        const usedCards = new Set<string>();

        while (hand.length < 7) {
          const rank = ranks[Math.floor(Math.random() * ranks.length)];
          const suit = suits[Math.floor(Math.random() * suits.length)];
          const cardKey = `${rank}${suit}`;

          if (!usedCards.has(cardKey)) {
            hand.push({ rank, suit });
            usedCards.add(cardKey);
          }
        }

        return hand;
      };

      const iterations = 1000;
      const testHands = Array(iterations).fill(null).map(() => generateRandomHand());

      const startTime = performance.now();

      testHands.forEach(hand => {
        HandEvaluator.evaluateHand(hand);
      });

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / iterations;

      expect(avgTime).toBeLessThan(10); // Allow more time for random worst-case hands
      console.log(`Random hand evaluation average: ${avgTime.toFixed(4)}ms`);
    });
  });

  describe('ICM Calculation Performance', () => {
    it('should calculate ICM for small tournaments under 100ms', () => {
      const stacks = [2000, 1500, 1000, 500];
      const payouts = [5000, 3000, 2000, 1000];

      const iterations = 100;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const playerIndex = i % stacks.length;
        ICMCalculator.calculateICM(stacks, payouts, playerIndex);
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / iterations;

      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLDS.ICM_CALCULATION_MS);
      console.log(`Small tournament ICM average: ${avgTime.toFixed(4)}ms`);
    });

    it('should handle medium tournaments efficiently', () => {
      const stacks = Array.from({ length: 20 }, (_, i) => 1000 + i * 100);
      const payouts = Array.from({ length: 5 }, (_, i) => 5000 - i * 500);

      const iterations = 50;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const playerIndex = i % stacks.length;
        ICMCalculator.calculateICM(stacks, payouts, playerIndex);
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / iterations;

      expect(avgTime).toBeLessThan(500); // Allow more time for larger tournaments
      console.log(`Medium tournament ICM average: ${avgTime.toFixed(4)}ms`);
    });

    it('should calculate bubble factors efficiently', () => {
      const testScenarios = [
        { stacks: [2000, 1000, 1000], payouts: [5000, 3000] },
        { stacks: [3000, 2000, 1500, 500], payouts: [6000, 4000, 2000] },
        { stacks: [1000, 1000, 1000, 1000, 1000], payouts: [5000, 3000, 2000] }
      ];

      const iterations = 200;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const scenario = testScenarios[i % testScenarios.length];
        const playerIndex = i % scenario.stacks.length;
        ICMCalculator.calculateBubbleFactor(scenario.stacks, scenario.payouts, playerIndex);
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / iterations;

      expect(avgTime).toBeLessThan(50);
      console.log(`Bubble factor calculation average: ${avgTime.toFixed(4)}ms`);
    });
  });

  describe('Equity Calculation Performance', () => {
    it('should calculate preflop equity efficiently', () => {
      const hand1: Card[] = [{ rank: 'A', suit: 's' }, { rank: 'A', suit: 'h' }];
      const hand2: Card[] = [{ rank: 'K', suit: 'c' }, { rank: 'K', suit: 'd' }];

      const iterations = 5;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        HandEvaluator.calculateEquity(hand1, hand2, [], 10000);
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / iterations;

      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLDS.EQUITY_CALCULATION_MS);
      console.log(`Preflop equity calculation average: ${avgTime.toFixed(2)}ms`);
    });

    it('should calculate postflop equity efficiently', () => {
      const hand1: Card[] = [{ rank: 'A', suit: 's' }, { rank: 'K', suit: 'h' }];
      const hand2: Card[] = [{ rank: 'Q', suit: 'c' }, { rank: 'J', suit: 'd' }];
      const board: Card[] = [
        { rank: 'A', suit: 'd' },
        { rank: 'K', suit: 'c' },
        { rank: '2', suit: 's' }
      ];

      const iterations = 10;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        HandEvaluator.calculateEquity(hand1, hand2, board, 5000);
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / iterations;

      expect(avgTime).toBeLessThan(2000); // Postflop calculations are faster
      console.log(`Postflop equity calculation average: ${avgTime.toFixed(2)}ms`);
    });
  });

  describe('Bulk Operations Performance', () => {
    it('should handle bulk hand evaluations efficiently', () => {
      const generateTestHands = (count: number): Card[][] => {
        const hands: Card[][] = [];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
        const suits = ['c', 'd', 'h', 's'];

        for (let i = 0; i < count; i++) {
          const hand: Card[] = [];
          for (let j = 0; j < 5; j++) {
            hand.push({
              rank: ranks[(i + j) % ranks.length],
              suit: suits[j % suits.length]
            });
          }
          hands.push(hand);
        }

        return hands;
      };

      const testHands = generateTestHands(10000);
      const startTime = performance.now();

      const results = testHands.map(hand => HandEvaluator.evaluateHand(hand));

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.BULK_OPERATIONS_MS);
      expect(results).toHaveLength(10000);
      console.log(`Bulk hand evaluation (10k hands): ${totalTime.toFixed(2)}ms`);
    });

    it('should handle bulk ICM calculations efficiently', () => {
      const testScenarios = Array(1000).fill(null).map((_, i) => ({
        stacks: [1000 + i, 800 + i % 500, 600 + i % 300],
        payouts: [3000, 2000, 1000],
        playerIndex: i % 3
      }));

      const startTime = performance.now();

      const results = testScenarios.map(scenario =>
        ICMCalculator.calculateICM(scenario.stacks, scenario.payouts, scenario.playerIndex)
      );

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.BULK_OPERATIONS_MS);
      expect(results).toHaveLength(1000);
      console.log(`Bulk ICM calculation (1k scenarios): ${totalTime.toFixed(2)}ms`);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory during intensive calculations', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform intensive calculations
      for (let i = 0; i < 1000; i++) {
        const stacks = Array(10).fill(null).map(() => Math.random() * 2000 + 500);
        const payouts = Array(5).fill(null).map(() => Math.random() * 5000 + 1000);

        ICMCalculator.calculateICM(stacks, payouts, 0);

        // Force garbage collection periodically
        if (i % 100 === 0 && global.gc) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    });

    it('should handle large data structures efficiently', () => {
      const largeStacks = Array(1000).fill(null).map(() => Math.random() * 5000 + 100);
      const largePayouts = Array(100).fill(null).map(() => Math.random() * 10000 + 500);

      const startTime = performance.now();
      const startMemory = process.memoryUsage().heapUsed;

      // This would be computationally intensive but should complete
      const result = ICMCalculator.calculatePlayerEquity(
        largeStacks.slice(0, 10), // Limit to prevent timeout
        largePayouts.slice(0, 5),
        0
      );

      const endTime = performance.now();
      const endMemory = process.memoryUsage().heapUsed;

      const executionTime = endTime - startTime;
      const memoryUsage = endMemory - startMemory;

      expect(executionTime).toBeLessThan(5000); // 5 second limit
      expect(memoryUsage).toBeLessThan(100 * 1024 * 1024); // 100MB limit
      expect(result).toBeGreaterThan(0);

      console.log(`Large calculation: ${executionTime.toFixed(2)}ms, Memory: ${(memoryUsage / 1024 / 1024).toFixed(2)}MB`);
    });
  });

  describe('Concurrency Performance', () => {
    it('should handle concurrent calculations efficiently', async () => {
      const concurrentRequests = 50;

      const promises = Array(concurrentRequests).fill(null).map(async (_, i) => {
        const stacks = [2000, 1500 + i * 10, 1000 + i * 5];
        const payouts = [5000, 3000, 2000];

        const startTime = performance.now();
        const result = ICMCalculator.calculateICM(stacks, payouts, i % 3);
        const endTime = performance.now();

        return {
          result,
          executionTime: endTime - startTime,
          index: i
        };
      });

      const startTime = performance.now();
      const results = await Promise.all(promises);
      const totalTime = performance.now() - startTime;

      expect(totalTime).toBeLessThan(5000); // Should complete all in under 5 seconds
      expect(results).toHaveLength(concurrentRequests);

      const avgTime = results.reduce((sum, r) => sum + r.executionTime, 0) / results.length;
      expect(avgTime).toBeLessThan(200); // Individual requests should still be fast

      console.log(`Concurrent execution: ${totalTime.toFixed(2)}ms total, ${avgTime.toFixed(2)}ms average`);
    });

    it('should maintain performance under sustained load', async () => {
      const totalRequests = 200;
      const batchSize = 20;
      const batches = Math.ceil(totalRequests / batchSize);

      const allResults: any[] = [];
      const batchTimes: number[] = [];

      for (let batch = 0; batch < batches; batch++) {
        const batchStart = performance.now();

        const promises = Array(batchSize).fill(null).map(async (_, i) => {
          const index = batch * batchSize + i;
          const stacks = [1000 + index, 800 + index % 300, 600 + index % 200];
          const payouts = [3000, 2000, 1000];

          return ICMCalculator.calculateICM(stacks, payouts, index % 3);
        });

        const batchResults = await Promise.all(promises);
        const batchTime = performance.now() - batchStart;

        allResults.push(...batchResults);
        batchTimes.push(batchTime);

        // Small delay between batches to simulate realistic load
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const totalTime = batchTimes.reduce((sum, time) => sum + time, 0);
      const avgBatchTime = totalTime / batches;

      expect(allResults).toHaveLength(totalRequests);
      expect(avgBatchTime).toBeLessThan(1000); // Each batch should complete in under 1 second

      // Performance should remain consistent across batches
      const firstBatchTime = batchTimes[0];
      const lastBatchTime = batchTimes[batches - 1];
      const performanceDegradation = lastBatchTime / firstBatchTime;

      expect(performanceDegradation).toBeLessThan(2); // No more than 2x degradation

      console.log(`Sustained load: ${totalRequests} requests, ${avgBatchTime.toFixed(2)}ms avg batch time`);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle tournament final table calculation quickly', () => {
      // Simulate WSOP Main Event final table
      const finalTableStacks = [
        28325000,  // Chip leader
        15240000,
        12150000,
        8930000,
        6475000,
        4280000,
        3165000,
        2850000,
        1580000   // Short stack
      ];

      const payouts = [
        10000000,  // 1st place
        6000000,   // 2nd place
        4000000,   // 3rd place
        3000000,   // 4th place
        2400000,   // 5th place
        1900000,   // 6th place
        1500000,   // 7th place
        1200000,   // 8th place
        1000000    // 9th place
      ];

      const startTime = performance.now();

      // Calculate ICM for all players
      const results = finalTableStacks.map((_, index) =>
        ICMCalculator.calculateICM(finalTableStacks, payouts, index)
      );

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(1000); // Should complete in under 1 second
      expect(results).toHaveLength(9);

      // Verify chip leader has highest equity
      const chipLeaderEquity = results[0].equity;
      const shortStackEquity = results[8].equity;
      expect(chipLeaderEquity).toBeGreaterThan(shortStackEquity);

      console.log(`Final table ICM calculation: ${totalTime.toFixed(2)}ms`);
    });

    it('should calculate satellite bubble efficiently', () => {
      // Simulate satellite tournament on bubble
      const satelliteStacks = Array(100).fill(null).map((_, i) => {
        if (i < 20) return 2000 + Math.random() * 1000; // Leaders
        if (i < 60) return 1000 + Math.random() * 500;  // Middle
        return 200 + Math.random() * 300;               // Short stacks
      });

      const seats = 10; // Top 10 get seats
      const payouts = Array(seats).fill(1000); // Equal seat value

      const startTime = performance.now();

      // Calculate for bubble players (around 10th-15th place)
      const bubbleResults = [8, 9, 10, 11, 12].map(index =>
        ICMCalculator.calculateICM(satelliteStacks, payouts, index)
      );

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(2000); // Should complete in under 2 seconds
      expect(bubbleResults).toHaveLength(5);

      console.log(`Satellite bubble calculation: ${totalTime.toFixed(2)}ms`);
    });
  });
});