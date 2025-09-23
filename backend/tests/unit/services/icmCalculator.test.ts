import { ICMCalculator } from '../../../src/services/icmCalculator';

describe('ICMCalculator', () => {
  describe('calculateICM', () => {
    it('should calculate ICM for heads-up scenario', () => {
      const stacks = [1000, 500];
      const payouts = [1000, 600];

      const result = ICMCalculator.calculateICM(stacks, payouts, 0);

      expect(result.equity).toBeValidEquity();
      expect(result.equity).toBeGreaterThan(0.6); // Should have >60% equity with 2:1 chip lead
      expect(result.chipEV).toBeDefined();
      expect(result.dollarEV).toBeDefined();
      expect(result.riskPremium).toBeDefined();
    });

    it('should calculate ICM for 3-handed tournament', () => {
      const stacks = [2000, 1500, 500];
      const payouts = [5000, 3000, 2000];

      const result = ICMCalculator.calculateICM(stacks, payouts, 0);

      expect(result.equity).toBeValidEquity();
      expect(result.equity).toBeGreaterThan(0.4); // Chip leader should have significant equity
    });

    it('should handle single player scenario', () => {
      const stacks = [1000];
      const payouts = [1000];

      const result = ICMCalculator.calculateICM(stacks, payouts, 0);

      expect(result.equity).toBe(1000); // Should get full payout
    });

    it('should calculate correct chip EV vs dollar EV', () => {
      const stacks = [3000, 1000, 1000];
      const payouts = [5000, 3000, 2000];

      const result = ICMCalculator.calculateICM(stacks, payouts, 0);

      // Chip EV should be higher than dollar EV due to ICM pressure
      expect(result.chipEV).toBeGreaterThan(result.dollarEV);
      expect(result.riskPremium).toBeGreaterThan(0);
    });

    it('should throw error for empty inputs', () => {
      expect(() => {
        ICMCalculator.calculateICM([], [1000]);
      }).toThrow('Invalid input: empty stacks or payouts');

      expect(() => {
        ICMCalculator.calculateICM([1000], []);
      }).toThrow('Invalid input: empty stacks or payouts');
    });
  });

  describe('calculatePlayerEquity', () => {
    it('should calculate equal equity for equal stacks', () => {
      const stacks = [1000, 1000, 1000];
      const payouts = [6000, 3000, 1000];

      const equity0 = ICMCalculator.calculatePlayerEquity(stacks, payouts, 0);
      const equity1 = ICMCalculator.calculatePlayerEquity(stacks, payouts, 1);
      const equity2 = ICMCalculator.calculatePlayerEquity(stacks, payouts, 2);

      // All players should have roughly equal equity
      expect(Math.abs(equity0 - equity1)).toBeLessThan(100);
      expect(Math.abs(equity1 - equity2)).toBeLessThan(100);
      expect(Math.abs(equity0 - equity2)).toBeLessThan(100);
    });

    it('should calculate higher equity for larger stacks', () => {
      const stacks = [3000, 1000, 1000];
      const payouts = [5000, 3000, 2000];

      const chipLeaderEquity = ICMCalculator.calculatePlayerEquity(stacks, payouts, 0);
      const shortStackEquity = ICMCalculator.calculatePlayerEquity(stacks, payouts, 1);

      expect(chipLeaderEquity).toBeGreaterThan(shortStackEquity);
    });

    it('should handle in-the-money scenarios correctly', () => {
      const stacks = [1000, 1000];
      const payouts = [6000, 4000];

      const equity0 = ICMCalculator.calculatePlayerEquity(stacks, payouts, 0);
      const equity1 = ICMCalculator.calculatePlayerEquity(stacks, payouts, 1);

      // Should split the prize pool 50/50 with equal stacks
      expect(equity0).toBeCloseTo(5000, 200);
      expect(equity1).toBeCloseTo(5000, 200);
      expect(equity0 + equity1).toBeCloseTo(10000, 100);
    });
  });

  describe('calculateBubbleFactor', () => {
    it('should calculate bubble factor for pre-bubble scenario', () => {
      const stacks = [2000, 2000, 1000]; // 3 players, top 2 paid
      const payouts = [6000, 4000];

      const bubbleFactor = ICMCalculator.calculateBubbleFactor(stacks, payouts, 2);

      expect(bubbleFactor).toBeGreaterThan(1); // Should have bubble factor > 1
    });

    it('should calculate bubble factor for chip leader', () => {
      const stacks = [4000, 500, 500];
      const payouts = [6000, 4000];

      const bubbleFactor = ICMCalculator.calculateBubbleFactor(stacks, payouts, 0);

      expect(bubbleFactor).toBeLessThan(1); // Chip leader should have bubble factor < 1
    });

    it('should handle post-bubble scenarios', () => {
      const stacks = [2500, 1500];
      const payouts = [6000, 4000];

      const bubbleFactor = ICMCalculator.calculateBubbleFactor(stacks, payouts, 0);

      expect(bubbleFactor).toBeCloseTo(1, 0.2); // Should be close to 1 when in the money
    });
  });

  describe('calculatePushFoldEquity', () => {
    it('should calculate push/fold equity correctly', () => {
      const heroStack = 1000;
      const villainStack = 1500;
      const blinds = 100;
      const antes = 0;
      const callingRange = 0.15; // 15% of hands
      const foldEquity = 0.85; // 85% fold

      const result = ICMCalculator.calculatePushFoldEquity(
        heroStack,
        villainStack,
        blinds,
        antes,
        callingRange,
        foldEquity
      );

      expect(result.pushEV).toBeDefined();
      expect(result.foldEV).toBe(0);
      expect(typeof result.pushEV).toBe('number');
    });

    it('should show positive EV for profitable pushes', () => {
      const heroStack = 800;
      const villainStack = 2000;
      const blinds = 100;
      const antes = 10;
      const callingRange = 0.1; // Very tight calling range
      const foldEquity = 0.9; // High fold equity

      const result = ICMCalculator.calculatePushFoldEquity(
        heroStack,
        villainStack,
        blinds,
        antes,
        callingRange,
        foldEquity
      );

      expect(result.pushEV).toBeGreaterThan(0); // Should be profitable
    });
  });

  describe('calculateOptimalPushingRange', () => {
    it('should return tight range for very short stacks', () => {
      const heroStack = 600; // 6BB
      const villainStacks = [1500, 2000];
      const blinds = 100;
      const antes = 0;
      const position = 'SB';
      const payouts = [5000, 3000, 2000];

      const range = ICMCalculator.calculateOptimalPushingRange(
        heroStack,
        villainStacks,
        blinds,
        antes,
        position,
        payouts
      );

      expect(Array.isArray(range)).toBe(true);
      expect(range.length).toBeGreaterThan(0);
      expect(range).toContain('AA'); // Should always include pocket aces
      expect(range.length).toBeLessThan(50); // Should be tight range
    });

    it('should return wider range for medium stacks', () => {
      const heroStack = 1200; // 12BB
      const villainStacks = [1500, 2000];
      const blinds = 100;
      const antes = 0;
      const position = 'BTN';
      const payouts = [5000, 3000, 2000];

      const range = ICMCalculator.calculateOptimalPushingRange(
        heroStack,
        villainStacks,
        blinds,
        antes,
        position,
        payouts
      );

      expect(range.length).toBeGreaterThan(30); // Should be wider range
      expect(range).toContain('AA');
      expect(range).toContain('A2s'); // Should include suited aces
    });

    it('should return widest range for deep stacks', () => {
      const heroStack = 2000; // 20BB
      const villainStacks = [1500, 2000];
      const blinds = 100;
      const antes = 0;
      const position = 'BTN';
      const payouts = [5000, 3000, 2000];

      const range = ICMCalculator.calculateOptimalPushingRange(
        heroStack,
        villainStacks,
        blinds,
        antes,
        position,
        payouts
      );

      expect(range.length).toBeGreaterThan(60); // Should be very wide range
      expect(range).toContain('32s'); // Should include very wide hands
    });
  });

  describe('Performance Requirements', () => {
    it('should calculate ICM in under 100ms', () => {
      const stacks = [2000, 1800, 1600, 1400, 1200, 1000, 800, 600, 400, 200];
      const payouts = [10000, 6000, 4000, 3000, 2000];

      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        ICMCalculator.calculateICM(stacks, payouts, Math.floor(Math.random() * stacks.length));
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / 100;

      expect(avgTime).toBeLessThan(100); // Should average under 100ms
    });

    it('should handle large tournament calculations efficiently', () => {
      const stacks = Array.from({ length: 100 }, (_, i) => 1000 + i * 100);
      const payouts = Array.from({ length: 15 }, (_, i) => 10000 - i * 500);

      const startTime = performance.now();

      ICMCalculator.calculateICM(stacks, payouts, 0);

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(1000); // Should complete in under 1 second
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero stack scenarios', () => {
      const stacks = [1000, 0, 500]; // Player eliminated
      const payouts = [1000, 600];

      expect(() => {
        ICMCalculator.calculateICM(stacks, payouts, 1);
      }).not.toThrow();
    });

    it('should handle more players than payouts', () => {
      const stacks = [1000, 800, 600, 400, 200];
      const payouts = [3000, 2000]; // Only top 2 paid

      const result = ICMCalculator.calculateICM(stacks, payouts, 4);

      expect(result.equity).toBeValidEquity();
      expect(result.equity).toBeLessThan(stacks[0]); // Should be less than chip leader
    });

    it('should handle equal payouts', () => {
      const stacks = [1000, 800, 600];
      const payouts = [1000, 1000, 1000]; // Equal payouts

      const result = ICMCalculator.calculateICM(stacks, payouts, 0);

      expect(result.equity).toBeCloseTo(1000, 100); // Should be close to equal payout
    });
  });

  describe('Mathematical Properties', () => {
    it('should have total equity equal to total payouts', () => {
      const stacks = [2000, 1500, 1000, 500];
      const payouts = [5000, 3000, 2000, 1000];

      let totalEquity = 0;
      for (let i = 0; i < stacks.length; i++) {
        const equity = ICMCalculator.calculatePlayerEquity(stacks, payouts, i);
        totalEquity += equity;
      }

      const totalPayouts = payouts.reduce((sum, payout) => sum + payout, 0);
      expect(totalEquity).toBeCloseTo(totalPayouts, 100);
    });

    it('should maintain equity conservation with stack changes', () => {
      const originalStacks = [1000, 1000, 1000];
      const modifiedStacks = [1100, 950, 950]; // Slight redistribution
      const payouts = [3000, 2000, 1000];

      let originalTotal = 0;
      let modifiedTotal = 0;

      for (let i = 0; i < originalStacks.length; i++) {
        originalTotal += ICMCalculator.calculatePlayerEquity(originalStacks, payouts, i);
        modifiedTotal += ICMCalculator.calculatePlayerEquity(modifiedStacks, payouts, i);
      }

      expect(Math.abs(originalTotal - modifiedTotal)).toBeLessThan(50);
    });
  });
});