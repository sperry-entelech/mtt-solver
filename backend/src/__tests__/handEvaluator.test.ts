import { HandEvaluator } from '../services/handEvaluator';
import { Card } from '../types';

describe('HandEvaluator', () => {
  let handEvaluator: HandEvaluator;

  beforeEach(() => {
    handEvaluator = new HandEvaluator();
  });

  describe('evaluateHand', () => {
    it('should correctly identify a royal flush', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'K', suit: 'h' },
        { rank: 'Q', suit: 'h' },
        { rank: 'J', suit: 'h' },
        { rank: 'T', suit: 'h' },
        { rank: '2', suit: 's' },
        { rank: '3', suit: 's' }
      ];

      const result = handEvaluator.evaluateHand(cards);
      expect(result.handType).toBe('ROYAL_FLUSH');
      expect(result.strength).toBeGreaterThan(8000);
    });

    it('should correctly identify a straight flush', () => {
      const cards: Card[] = [
        { rank: '5', suit: 'c' },
        { rank: '4', suit: 'c' },
        { rank: '3', suit: 'c' },
        { rank: '2', suit: 'c' },
        { rank: 'A', suit: 'c' },
        { rank: 'K', suit: 's' },
        { rank: 'Q', suit: 's' }
      ];

      const result = handEvaluator.evaluateHand(cards);
      expect(result.handType).toBe('STRAIGHT_FLUSH');
      expect(result.strength).toBeGreaterThan(7000);
      expect(result.strength).toBeLessThan(8000);
    });

    it('should correctly identify four of a kind', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 's' },
        { rank: 'A', suit: 'c' },
        { rank: 'A', suit: 'd' },
        { rank: 'K', suit: 'h' },
        { rank: '2', suit: 's' },
        { rank: '3', suit: 's' }
      ];

      const result = handEvaluator.evaluateHand(cards);
      expect(result.handType).toBe('FOUR_OF_A_KIND');
      expect(result.strength).toBeGreaterThan(6000);
      expect(result.strength).toBeLessThan(7000);
    });

    it('should correctly identify a full house', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 's' },
        { rank: 'A', suit: 'c' },
        { rank: 'K', suit: 'd' },
        { rank: 'K', suit: 'h' },
        { rank: '2', suit: 's' },
        { rank: '3', suit: 's' }
      ];

      const result = handEvaluator.evaluateHand(cards);
      expect(result.handType).toBe('FULL_HOUSE');
      expect(result.strength).toBeGreaterThan(5000);
      expect(result.strength).toBeLessThan(6000);
    });

    it('should correctly identify a flush', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'K', suit: 'h' },
        { rank: 'Q', suit: 'h' },
        { rank: 'J', suit: 'h' },
        { rank: '9', suit: 'h' },
        { rank: '2', suit: 's' },
        { rank: '3', suit: 's' }
      ];

      const result = handEvaluator.evaluateHand(cards);
      expect(result.handType).toBe('FLUSH');
      expect(result.strength).toBeGreaterThan(4000);
      expect(result.strength).toBeLessThan(5000);
    });

    it('should correctly identify a straight', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'K', suit: 's' },
        { rank: 'Q', suit: 'c' },
        { rank: 'J', suit: 'd' },
        { rank: 'T', suit: 'h' },
        { rank: '2', suit: 's' },
        { rank: '3', suit: 's' }
      ];

      const result = handEvaluator.evaluateHand(cards);
      expect(result.handType).toBe('STRAIGHT');
      expect(result.strength).toBeGreaterThan(3000);
      expect(result.strength).toBeLessThan(4000);
    });

    it('should correctly identify three of a kind', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 's' },
        { rank: 'A', suit: 'c' },
        { rank: 'K', suit: 'd' },
        { rank: 'Q', suit: 'h' },
        { rank: '2', suit: 's' },
        { rank: '3', suit: 's' }
      ];

      const result = handEvaluator.evaluateHand(cards);
      expect(result.handType).toBe('THREE_OF_A_KIND');
      expect(result.strength).toBeGreaterThan(2000);
      expect(result.strength).toBeLessThan(3000);
    });

    it('should correctly identify two pair', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 's' },
        { rank: 'K', suit: 'c' },
        { rank: 'K', suit: 'd' },
        { rank: 'Q', suit: 'h' },
        { rank: '2', suit: 's' },
        { rank: '3', suit: 's' }
      ];

      const result = handEvaluator.evaluateHand(cards);
      expect(result.handType).toBe('TWO_PAIR');
      expect(result.strength).toBeGreaterThan(1000);
      expect(result.strength).toBeLessThan(2000);
    });

    it('should correctly identify one pair', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 's' },
        { rank: 'K', suit: 'c' },
        { rank: 'Q', suit: 'd' },
        { rank: 'J', suit: 'h' },
        { rank: '2', suit: 's' },
        { rank: '3', suit: 's' }
      ];

      const result = handEvaluator.evaluateHand(cards);
      expect(result.handType).toBe('ONE_PAIR');
      expect(result.strength).toBeGreaterThan(0);
      expect(result.strength).toBeLessThan(1000);
    });

    it('should correctly identify high card', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'K', suit: 's' },
        { rank: 'Q', suit: 'c' },
        { rank: 'J', suit: 'd' },
        { rank: '9', suit: 'h' },
        { rank: '2', suit: 's' },
        { rank: '3', suit: 's' }
      ];

      const result = handEvaluator.evaluateHand(cards);
      expect(result.handType).toBe('HIGH_CARD');
      expect(result.strength).toBeGreaterThan(0);
      expect(result.strength).toBeLessThan(1000);
    });

    it('should handle edge case: wheel straight', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: '2', suit: 's' },
        { rank: '3', suit: 'c' },
        { rank: '4', suit: 'd' },
        { rank: '5', suit: 'h' },
        { rank: 'K', suit: 's' },
        { rank: 'Q', suit: 's' }
      ];

      const result = handEvaluator.evaluateHand(cards);
      expect(result.handType).toBe('STRAIGHT');
    });
  });

  describe('performance', () => {
    it('should evaluate hands in under 1ms', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'K', suit: 's' },
        { rank: 'Q', suit: 'c' },
        { rank: 'J', suit: 'd' },
        { rank: 'T', suit: 'h' },
        { rank: '2', suit: 's' },
        { rank: '3', suit: 's' }
      ];

      const startTime = performance.now();
      for (let i = 0; i < 1000; i++) {
        handEvaluator.evaluateHand(cards);
      }
      const endTime = performance.now();

      const averageTime = (endTime - startTime) / 1000;
      expect(averageTime).toBeLessThan(1);
    });
  });

  describe('compareHands', () => {
    it('should correctly compare different hand types', () => {
      const royalFlush: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'K', suit: 'h' },
        { rank: 'Q', suit: 'h' },
        { rank: 'J', suit: 'h' },
        { rank: 'T', suit: 'h' },
        { rank: '2', suit: 's' },
        { rank: '3', suit: 's' }
      ];

      const fourOfAKind: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 's' },
        { rank: 'A', suit: 'c' },
        { rank: 'A', suit: 'd' },
        { rank: 'K', suit: 'h' },
        { rank: '2', suit: 's' },
        { rank: '3', suit: 's' }
      ];

      const result1 = handEvaluator.evaluateHand(royalFlush);
      const result2 = handEvaluator.evaluateHand(fourOfAKind);

      expect(result1.strength).toBeGreaterThan(result2.strength);
    });

    it('should correctly compare same hand types with different ranks', () => {
      const acesFullOfKings: Card[] = [
        { rank: 'A', suit: 'h' },
        { rank: 'A', suit: 's' },
        { rank: 'A', suit: 'c' },
        { rank: 'K', suit: 'd' },
        { rank: 'K', suit: 'h' },
        { rank: '2', suit: 's' },
        { rank: '3', suit: 's' }
      ];

      const kingsFullOfAces: Card[] = [
        { rank: 'K', suit: 'h' },
        { rank: 'K', suit: 's' },
        { rank: 'K', suit: 'c' },
        { rank: 'A', suit: 'd' },
        { rank: 'A', suit: 'h' },
        { rank: '2', suit: 's' },
        { rank: '3', suit: 's' }
      ];

      const result1 = handEvaluator.evaluateHand(acesFullOfKings);
      const result2 = handEvaluator.evaluateHand(kingsFullOfAces);

      expect(result1.strength).toBeGreaterThan(result2.strength);
    });
  });
});