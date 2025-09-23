import { HandEvaluator } from '../../../src/services/handEvaluator';
import { Card, HandCategory } from '../../../src/types';

describe('HandEvaluator', () => {
  describe('evaluateHand', () => {
    it('should identify royal flush correctly', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 's' },
        { rank: 'K', suit: 's' },
        { rank: 'Q', suit: 's' },
        { rank: 'J', suit: 's' },
        { rank: 'T', suit: 's' }
      ];

      const result = HandEvaluator.evaluateHand(cards);

      expect(result).toHaveHandRank(10);
      expect(result.category).toBe(HandCategory.ROYAL_FLUSH);
      expect(result.description).toBe('Royal Flush');
    });

    it('should identify straight flush correctly', () => {
      const cards: Card[] = [
        { rank: '9', suit: 'h' },
        { rank: '8', suit: 'h' },
        { rank: '7', suit: 'h' },
        { rank: '6', suit: 'h' },
        { rank: '5', suit: 'h' }
      ];

      const result = HandEvaluator.evaluateHand(cards);

      expect(result).toHaveHandRank(9);
      expect(result.category).toBe(HandCategory.STRAIGHT_FLUSH);
      expect(result.description).toContain('Straight Flush');
    });

    it('should identify four of a kind correctly', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 's' },
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 'd' },
        { rank: 'A', suit: 'c' },
        { rank: 'K', suit: 's' }
      ];

      const result = HandEvaluator.evaluateHand(cards);

      expect(result).toHaveHandRank(8);
      expect(result.category).toBe(HandCategory.FOUR_OF_A_KIND);
    });

    it('should identify full house correctly', () => {
      const cards: Card[] = [
        { rank: 'K', suit: 's' },
        { rank: 'K', suit: 'h' },
        { rank: 'K', suit: 'd' },
        { rank: 'Q', suit: 'c' },
        { rank: 'Q', suit: 's' }
      ];

      const result = HandEvaluator.evaluateHand(cards);

      expect(result).toHaveHandRank(7);
      expect(result.category).toBe(HandCategory.FULL_HOUSE);
    });

    it('should identify flush correctly', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 's' },
        { rank: 'J', suit: 's' },
        { rank: '9', suit: 's' },
        { rank: '7', suit: 's' },
        { rank: '2', suit: 's' }
      ];

      const result = HandEvaluator.evaluateHand(cards);

      expect(result).toHaveHandRank(6);
      expect(result.category).toBe(HandCategory.FLUSH);
    });

    it('should identify straight correctly', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 's' },
        { rank: 'K', suit: 'h' },
        { rank: 'Q', suit: 'd' },
        { rank: 'J', suit: 'c' },
        { rank: 'T', suit: 's' }
      ];

      const result = HandEvaluator.evaluateHand(cards);

      expect(result).toHaveHandRank(5);
      expect(result.category).toBe(HandCategory.STRAIGHT);
    });

    it('should identify wheel straight (A-2-3-4-5) correctly', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 's' },
        { rank: '2', suit: 'h' },
        { rank: '3', suit: 'd' },
        { rank: '4', suit: 'c' },
        { rank: '5', suit: 's' }
      ];

      const result = HandEvaluator.evaluateHand(cards);

      expect(result).toHaveHandRank(5);
      expect(result.category).toBe(HandCategory.STRAIGHT);
    });

    it('should identify three of a kind correctly', () => {
      const cards: Card[] = [
        { rank: 'Q', suit: 's' },
        { rank: 'Q', suit: 'h' },
        { rank: 'Q', suit: 'd' },
        { rank: 'J', suit: 'c' },
        { rank: '9', suit: 's' }
      ];

      const result = HandEvaluator.evaluateHand(cards);

      expect(result).toHaveHandRank(4);
      expect(result.category).toBe(HandCategory.THREE_OF_A_KIND);
    });

    it('should identify two pair correctly', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 's' },
        { rank: 'A', suit: 'h' },
        { rank: 'K', suit: 'd' },
        { rank: 'K', suit: 'c' },
        { rank: 'Q', suit: 's' }
      ];

      const result = HandEvaluator.evaluateHand(cards);

      expect(result).toHaveHandRank(3);
      expect(result.category).toBe(HandCategory.TWO_PAIR);
    });

    it('should identify pair correctly', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 's' },
        { rank: 'A', suit: 'h' },
        { rank: 'K', suit: 'd' },
        { rank: 'Q', suit: 'c' },
        { rank: 'J', suit: 's' }
      ];

      const result = HandEvaluator.evaluateHand(cards);

      expect(result).toHaveHandRank(2);
      expect(result.category).toBe(HandCategory.PAIR);
    });

    it('should identify high card correctly', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 's' },
        { rank: 'K', suit: 'h' },
        { rank: 'Q', suit: 'd' },
        { rank: 'J', suit: 'c' },
        { rank: '9', suit: 's' }
      ];

      const result = HandEvaluator.evaluateHand(cards);

      expect(result).toHaveHandRank(1);
      expect(result.category).toBe(HandCategory.HIGH_CARD);
    });

    it('should work with 7-card hands (Texas Hold\'em)', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 's' }, // Hole cards
        { rank: 'K', suit: 'h' },
        { rank: 'A', suit: 'd' }, // Board
        { rank: 'K', suit: 'c' },
        { rank: 'Q', suit: 's' },
        { rank: 'J', suit: 'h' },
        { rank: 'T', suit: 'd' }
      ];

      const result = HandEvaluator.evaluateHand(cards);

      // Should find the straight (A-K-Q-J-T)
      expect(result).toHaveHandRank(5);
      expect(result.category).toBe(HandCategory.STRAIGHT);
    });

    it('should throw error for invalid number of cards', () => {
      expect(() => {
        HandEvaluator.evaluateHand([]);
      }).toThrow('Hand must contain 5-7 cards');

      expect(() => {
        HandEvaluator.evaluateHand([
          { rank: 'A', suit: 's' },
          { rank: 'K', suit: 'h' },
          { rank: 'Q', suit: 'd' }
        ]);
      }).toThrow('Hand must contain 5-7 cards');
    });
  });

  describe('calculateEquity', () => {
    it('should calculate equity between two hands', () => {
      const hand1: Card[] = [{ rank: 'A', suit: 's' }, { rank: 'A', suit: 'h' }]; // Pocket Aces
      const hand2: Card[] = [{ rank: '2', suit: 'c' }, { rank: '7', suit: 'd' }]; // 2-7 offsuit

      const equity = HandEvaluator.calculateEquity(hand1, hand2, [], 1000);

      expect(equity).toBeValidEquity();
      expect(equity).toBeGreaterThan(0.8); // AA should win ~87% vs 27o
    });

    it('should handle board cards correctly', () => {
      const hand1: Card[] = [{ rank: 'A', suit: 's' }, { rank: 'K', suit: 'h' }];
      const hand2: Card[] = [{ rank: 'Q', suit: 'c' }, { rank: 'J', suit: 'd' }];
      const board: Card[] = [
        { rank: 'A', suit: 'd' },
        { rank: 'K', suit: 'c' },
        { rank: '2', suit: 's' }
      ];

      const equity = HandEvaluator.calculateEquity(hand1, hand2, board, 1000);

      expect(equity).toBeValidEquity();
      expect(equity).toBeGreaterThan(0.85); // Top two pair should be strong
    });

    it('should throw error for invalid board size', () => {
      const hand1: Card[] = [{ rank: 'A', suit: 's' }, { rank: 'K', suit: 'h' }];
      const hand2: Card[] = [{ rank: 'Q', suit: 'c' }, { rank: 'J', suit: 'd' }];
      const board: Card[] = [
        { rank: 'A', suit: 'd' },
        { rank: 'K', suit: 'c' },
        { rank: '2', suit: 's' },
        { rank: '3', suit: 'h' },
        { rank: '4', suit: 'c' },
        { rank: '5', suit: 'd' } // 6 cards - invalid
      ];

      expect(() => {
        HandEvaluator.calculateEquity(hand1, hand2, board);
      }).toThrow('Board cannot have more than 5 cards');
    });
  });

  describe('Performance Requirements', () => {
    it('should evaluate hands in under 1ms', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 's' },
        { rank: 'K', suit: 'h' },
        { rank: 'Q', suit: 'd' },
        { rank: 'J', suit: 'c' },
        { rank: 'T', suit: 's' },
        { rank: '9', suit: 'h' },
        { rank: '8', suit: 'd' }
      ];

      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        HandEvaluator.evaluateHand(cards);
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / 1000;

      expect(avgTime).toBeLessThan(1); // Should average under 1ms per evaluation
    });

    it('should handle high-volume equity calculations efficiently', () => {
      const hand1: Card[] = [{ rank: 'A', suit: 's' }, { rank: 'K', suit: 'h' }];
      const hand2: Card[] = [{ rank: 'Q', suit: 'c' }, { rank: 'J', suit: 'd' }];

      const startTime = performance.now();

      HandEvaluator.calculateEquity(hand1, hand2, [], 10000);

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(5000); // Should complete in under 5 seconds
    });
  });

  describe('Input Validation', () => {
    it('should validate card format', () => {
      const invalidCards = [
        { rank: 'X', suit: 's' }, // Invalid rank
        { rank: 'A', suit: 'x' }, // Invalid suit
        { rank: 'A' }, // Missing suit
        { suit: 's' } // Missing rank
      ];

      invalidCards.forEach(card => {
        expect(card).not.toBeValidCard();
      });
    });

    it('should handle duplicate cards gracefully', () => {
      const cardsWithDuplicate: Card[] = [
        { rank: 'A', suit: 's' },
        { rank: 'A', suit: 's' }, // Duplicate
        { rank: 'K', suit: 'h' },
        { rank: 'Q', suit: 'd' },
        { rank: 'J', suit: 'c' }
      ];

      // Should not throw but behavior may vary
      expect(() => {
        HandEvaluator.evaluateHand(cardsWithDuplicate);
      }).not.toThrow();
    });
  });
});