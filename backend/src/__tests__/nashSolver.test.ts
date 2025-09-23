import { NashSolver } from '../services/nashSolver';

describe('NashSolver', () => {
  let nashSolver: NashSolver;

  beforeEach(() => {
    nashSolver = new NashSolver();
  });

  describe('generatePushFoldCharts', () => {
    it('should generate valid push/fold ranges for heads-up scenario', async () => {
      const blindLevels = [{ sb: 25, bb: 50, ante: 0 }];
      const stackSizes = [10, 15, 20]; // In big blinds

      const charts = await nashSolver.generatePushFoldCharts(blindLevels, stackSizes);

      expect(charts).toHaveLength(1);
      expect(charts[0].pushRanges).toHaveLength(3);
      expect(charts[0].callRanges).toHaveLength(3);

      // Verify ranges get tighter with bigger stacks
      const range10bb = charts[0].pushRanges[0];
      const range20bb = charts[0].pushRanges[2];

      expect(range10bb.combinations.length).toBeGreaterThan(range20bb.combinations.length);
    });

    it('should include premium hands in all push ranges', async () => {
      const blindLevels = [{ sb: 50, bb: 100, ante: 10 }];
      const stackSizes = [8, 12, 16];

      const charts = await nashSolver.generatePushFoldCharts(blindLevels, stackSizes);

      const premiumHands = ['AA', 'KK', 'QQ', 'JJ', 'AK'];

      charts[0].pushRanges.forEach(range => {
        premiumHands.forEach(hand => {
          expect(range.combinations).toContain(hand);
        });
      });
    });

    it('should have calling ranges tighter than pushing ranges', async () => {
      const blindLevels = [{ sb: 25, bb: 50, ante: 5 }];
      const stackSizes = [12];

      const charts = await nashSolver.generatePushFoldCharts(blindLevels, stackSizes);

      const pushRange = charts[0].pushRanges[0];
      const callRange = charts[0].callRanges[0];

      expect(callRange.combinations.length).toBeLessThan(pushRange.combinations.length);
    });
  });

  describe('solveHeadsUpScenario', () => {
    it('should solve basic heads-up push/fold scenario', async () => {
      const scenario = {
        heroStack: 600,
        villainStack: 800,
        bigBlind: 50,
        smallBlind: 25,
        ante: 5,
        position: 'SB' as const
      };

      const solution = await nashSolver.solveHeadsUpScenario(scenario);

      expect(solution.heroStrategy).toBeDefined();
      expect(solution.villainStrategy).toBeDefined();
      expect(solution.equilibriumPushRange.combinations.length).toBeGreaterThan(0);
      expect(solution.equilibriumCallRange.combinations.length).toBeGreaterThan(0);
    });

    it('should adjust strategy based on stack sizes', async () => {
      const shortStackScenario = {
        heroStack: 300,
        villainStack: 1200,
        bigBlind: 50,
        smallBlind: 25,
        ante: 5,
        position: 'SB' as const
      };

      const deepStackScenario = {
        heroStack: 1500,
        villainStack: 1200,
        bigBlind: 50,
        smallBlind: 25,
        ante: 5,
        position: 'SB' as const
      };

      const shortSolution = await nashSolver.solveHeadsUpScenario(shortStackScenario);
      const deepSolution = await nashSolver.solveHeadsUpScenario(deepStackScenario);

      // Short stack should push wider range
      expect(shortSolution.equilibriumPushRange.combinations.length)
        .toBeGreaterThan(deepSolution.equilibriumPushRange.combinations.length);
    });

    it('should consider ante effects on ranges', async () => {
      const noAnteScenario = {
        heroStack: 800,
        villainStack: 800,
        bigBlind: 50,
        smallBlind: 25,
        ante: 0,
        position: 'SB' as const
      };

      const withAnteScenario = {
        heroStack: 800,
        villainStack: 800,
        bigBlind: 50,
        smallBlind: 25,
        ante: 10,
        position: 'SB' as const
      };

      const noAnteSolution = await nashSolver.solveHeadsUpScenario(noAnteScenario);
      const withAnteSolution = await nashSolver.solveHeadsUpScenario(withAnteScenario);

      // Ante should make pushing ranges wider due to increased pot odds
      expect(withAnteSolution.equilibriumPushRange.combinations.length)
        .toBeGreaterThan(noAnteSolution.equilibriumPushRange.combinations.length);
    });
  });

  describe('analyzeMultiPlayerScenario', () => {
    it('should analyze 3-player bubble scenario', async () => {
      const scenario = {
        playerStacks: [1200, 800, 400],
        payouts: [1000, 600, 0],
        bigBlind: 100,
        smallBlind: 50,
        ante: 10,
        heroPosition: 0,
        actionPosition: 2 // Short stack in SB
      };

      const analysis = await nashSolver.analyzeMultiPlayerScenario(scenario);

      expect(analysis.optimalAction).toBeDefined();
      expect(analysis.optimalAction).toBeOneOf(['FOLD', 'CALL', 'PUSH']);
      expect(analysis.equity).toBeGreaterThan(0);
      expect(analysis.icmPressure).toBeGreaterThan(0);
    });

    it('should account for ICM pressure in decision making', async () => {
      const bubbleScenario = {
        playerStacks: [2000, 1000, 500, 100], // Bubble with very short stack
        payouts: [2000, 1200, 800, 0],
        bigBlind: 100,
        smallBlind: 50,
        ante: 10,
        heroPosition: 1, // Middle stack
        actionPosition: 1
      };

      const regularScenario = {
        playerStacks: [2000, 1000, 500, 400], // No extreme short stack
        payouts: [2000, 1200, 800, 0],
        bigBlind: 100,
        smallBlind: 50,
        ante: 10,
        heroPosition: 1,
        actionPosition: 1
      };

      const bubbleAnalysis = await nashSolver.analyzeMultiPlayerScenario(bubbleScenario);
      const regularAnalysis = await nashSolver.analyzeMultiPlayerScenario(regularScenario);

      // Should be more conservative on bubble
      expect(bubbleAnalysis.icmPressure).toBeGreaterThan(regularAnalysis.icmPressure);
    });
  });

  describe('optimizeStrategy', () => {
    it('should find optimal mixed strategy for marginal spots', async () => {
      const gameState = {
        heroStack: 750,
        villainStack: 750,
        potSize: 150,
        heroRange: ['22', 'A2s', 'A3s', 'A4s', 'A5s'],
        villainRange: ['22+', 'A2s+', 'K5s+', 'Q8s+', 'J9s+'],
        position: 'SB' as const
      };

      const strategy = await nashSolver.optimizeStrategy(gameState);

      expect(strategy.actions).toBeDefined();
      expect(strategy.expectedValue).toBeDefined();
      expect(strategy.actions.length).toBeGreaterThan(0);

      // Verify strategy sums to 1 (valid probability distribution)
      const totalProbability = strategy.actions.reduce((sum, action) => sum + action.frequency, 0);
      expect(totalProbability).toBeCloseTo(1, 2);
    });

    it('should recommend pure strategies for clear spots', async () => {
      const clearPushSpot = {
        heroStack: 300,
        villainStack: 1000,
        potSize: 75,
        heroRange: ['AA'], // Only aces
        villainRange: ['22+', 'A2+', 'K2+'], // Very wide calling range
        position: 'SB' as const
      };

      const strategy = await nashSolver.optimizeStrategy(clearPushSpot);

      // Should recommend pushing with very high frequency
      const pushAction = strategy.actions.find(action => action.action === 'PUSH');
      expect(pushAction?.frequency).toBeGreaterThan(0.9);
    });
  });

  describe('performance', () => {
    it('should solve heads-up scenario in reasonable time', async () => {
      const scenario = {
        heroStack: 800,
        villainStack: 600,
        bigBlind: 50,
        smallBlind: 25,
        ante: 5,
        position: 'SB' as const
      };

      const startTime = performance.now();
      await nashSolver.solveHeadsUpScenario(scenario);
      const endTime = performance.now();

      const solveTime = endTime - startTime;
      expect(solveTime).toBeLessThan(5000); // Should solve in under 5 seconds
    });

    it('should generate charts efficiently for multiple stack sizes', async () => {
      const blindLevels = [{ sb: 25, bb: 50, ante: 5 }];
      const stackSizes = [8, 10, 12, 15, 20, 25, 30];

      const startTime = performance.now();
      await nashSolver.generatePushFoldCharts(blindLevels, stackSizes);
      const endTime = performance.now();

      const generateTime = endTime - startTime;
      expect(generateTime).toBeLessThan(10000); // Should generate in under 10 seconds
    });
  });

  describe('edge cases', () => {
    it('should handle extremely short stacks correctly', async () => {
      const scenario = {
        heroStack: 75, // 1.5 BB
        villainStack: 1000,
        bigBlind: 50,
        smallBlind: 25,
        ante: 5,
        position: 'SB' as const
      };

      const solution = await nashSolver.solveHeadsUpScenario(scenario);

      // Should push extremely wide with such a short stack
      expect(solution.equilibriumPushRange.combinations.length).toBeGreaterThan(100);
    });

    it('should handle deep stack scenarios', async () => {
      const scenario = {
        heroStack: 5000, // 100 BB
        villainStack: 4000,
        bigBlind: 50,
        smallBlind: 25,
        ante: 0,
        position: 'SB' as const
      };

      const solution = await nashSolver.solveHeadsUpScenario(scenario);

      // Should push very tight with deep stacks
      expect(solution.equilibriumPushRange.combinations.length).toBeLessThan(50);
    });

    it('should throw error for invalid stack sizes', async () => {
      const invalidScenario = {
        heroStack: 0,
        villainStack: 1000,
        bigBlind: 50,
        smallBlind: 25,
        ante: 5,
        position: 'SB' as const
      };

      await expect(nashSolver.solveHeadsUpScenario(invalidScenario)).rejects.toThrow();
    });
  });
});