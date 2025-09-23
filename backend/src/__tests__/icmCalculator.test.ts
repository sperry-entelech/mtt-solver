import { ICMCalculator } from '../services/icmCalculator';

describe('ICMCalculator', () => {
  let icmCalculator: ICMCalculator;

  beforeEach(() => {
    icmCalculator = new ICMCalculator();
  });

  describe('calculateICM', () => {
    it('should correctly calculate ICM for a simple 3-player scenario', () => {
      const stacks = [2000, 1500, 500];
      const payouts = [500, 300, 200];

      const icmValues = icmCalculator.calculateICM(stacks, payouts);

      expect(icmValues).toHaveLength(3);
      expect(icmValues[0]).toBeGreaterThan(icmValues[1]);
      expect(icmValues[1]).toBeGreaterThan(icmValues[2]);

      // ICM values should sum to total prize pool
      const totalICM = icmValues.reduce((sum, value) => sum + value, 0);
      const totalPrizes = payouts.reduce((sum, payout) => sum + payout, 0);
      expect(Math.abs(totalICM - totalPrizes)).toBeLessThan(0.01);
    });

    it('should handle heads-up scenario correctly', () => {
      const stacks = [3000, 1000];
      const payouts = [600, 400];

      const icmValues = icmCalculator.calculateICM(stacks, payouts);

      expect(icmValues).toHaveLength(2);
      expect(icmValues[0]).toBeGreaterThan(400);
      expect(icmValues[1]).toBeLessThan(400);
      expect(icmValues[0] + icmValues[1]).toBeCloseTo(1000, 1);
    });

    it('should calculate ICM for equal stacks correctly', () => {
      const stacks = [1000, 1000, 1000, 1000];
      const payouts = [400, 300, 200, 100];

      const icmValues = icmCalculator.calculateICM(stacks, payouts);

      // With equal stacks, all ICM values should be equal
      icmValues.forEach(value => {
        expect(value).toBeCloseTo(250, 1); // 1000/4 = 250
      });
    });

    it('should handle bubble scenario with zero payout', () => {
      const stacks = [2000, 1500, 1000, 500];
      const payouts = [600, 400, 0, 0]; // Only top 2 paid

      const icmValues = icmCalculator.calculateICM(stacks, payouts);

      expect(icmValues).toHaveLength(4);
      expect(icmValues[0]).toBeGreaterThan(icmValues[1]);
      expect(icmValues[1]).toBeGreaterThan(icmValues[2]);
      expect(icmValues[2]).toBeGreaterThan(icmValues[3]);
      expect(icmValues[3]).toBeGreaterThan(0); // Even with 0 payout, should have some ICM value
    });
  });

  describe('calculateBubbleFactor', () => {
    it('should calculate bubble factor correctly at money bubble', () => {
      const stacks = [2000, 1500, 1000, 500];
      const payouts = [600, 400, 0, 0];

      const bubbleFactor = icmCalculator.calculateBubbleFactor(stacks, payouts, 2); // Player 3 (index 2)

      expect(bubbleFactor).toBeGreaterThan(1);
      expect(bubbleFactor).toBeLessThan(3);
    });

    it('should return lower bubble factor for chip leader', () => {
      const stacks = [3000, 1000, 800, 200];
      const payouts = [600, 400, 0, 0];

      const chipLeaderBubble = icmCalculator.calculateBubbleFactor(stacks, payouts, 0);
      const shortStackBubble = icmCalculator.calculateBubbleFactor(stacks, payouts, 3);

      expect(chipLeaderBubble).toBeLessThan(shortStackBubble);
    });
  });

  describe('calculatePushFoldEquity', () => {
    it('should calculate push/fold equity for tournament scenario', () => {
      const heroStack = 800;
      const villainStack = 1200;
      const otherStacks = [2000, 1500];
      const payouts = [1000, 600, 400, 200];
      const heroWinRate = 0.6;

      const equity = icmCalculator.calculatePushFoldEquity(
        heroStack,
        villainStack,
        otherStacks,
        payouts,
        heroWinRate
      );

      expect(equity.pushEquity).toBeGreaterThan(0);
      expect(equity.foldEquity).toBeGreaterThan(0);
      expect(equity.pushEquity).not.toBe(equity.foldEquity);
    });

    it('should prefer pushing with very strong hand', () => {
      const heroStack = 500;
      const villainStack = 1000;
      const otherStacks = [2000, 1500];
      const payouts = [1000, 600, 400, 200];
      const strongWinRate = 0.85;

      const equity = icmCalculator.calculatePushFoldEquity(
        heroStack,
        villainStack,
        otherStacks,
        payouts,
        strongWinRate
      );

      expect(equity.pushEquity).toBeGreaterThan(equity.foldEquity);
    });

    it('should prefer folding with weak hand in ICM spot', () => {
      const heroStack = 1000;
      const villainStack = 500;
      const otherStacks = [400, 100]; // Short stacks about to bust
      const payouts = [1000, 600, 400, 200];
      const weakWinRate = 0.3;

      const equity = icmCalculator.calculatePushFoldEquity(
        heroStack,
        villainStack,
        otherStacks,
        payouts,
        weakWinRate
      );

      expect(equity.foldEquity).toBeGreaterThan(equity.pushEquity);
    });
  });

  describe('performance', () => {
    it('should calculate ICM in under 100ms for 9 players', () => {
      const stacks = [5000, 4000, 3500, 3000, 2500, 2000, 1500, 1000, 500];
      const payouts = [4500, 2700, 1800, 1350, 1080, 900, 720, 450, 0];

      const startTime = performance.now();
      for (let i = 0; i < 100; i++) {
        icmCalculator.calculateICM(stacks, payouts);
      }
      const endTime = performance.now();

      const averageTime = (endTime - startTime) / 100;
      expect(averageTime).toBeLessThan(100);
    });
  });

  describe('edge cases', () => {
    it('should handle single player scenario', () => {
      const stacks = [1000];
      const payouts = [1000];

      const icmValues = icmCalculator.calculateICM(stacks, payouts);

      expect(icmValues).toHaveLength(1);
      expect(icmValues[0]).toBe(1000);
    });

    it('should handle all-in scenario where one player has all chips', () => {
      const stacks = [4000, 0, 0, 0];
      const payouts = [1000, 600, 400, 200];

      const icmValues = icmCalculator.calculateICM(stacks, payouts);

      expect(icmValues[0]).toBe(2200); // Should get full prize pool
      expect(icmValues[1]).toBe(0);
      expect(icmValues[2]).toBe(0);
      expect(icmValues[3]).toBe(0);
    });

    it('should throw error for mismatched array lengths', () => {
      const stacks = [1000, 1000];
      const payouts = [600, 400, 200]; // Wrong length

      expect(() => {
        icmCalculator.calculateICM(stacks, payouts);
      }).toThrow();
    });

    it('should throw error for negative stacks', () => {
      const stacks = [1000, -500];
      const payouts = [600, 400];

      expect(() => {
        icmCalculator.calculateICM(stacks, payouts);
      }).toThrow();
    });
  });
});