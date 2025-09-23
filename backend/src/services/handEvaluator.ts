import { Card, HandEvaluation, HandCategory } from '../types';

export class HandEvaluator {
  private static readonly RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
  private static readonly SUITS = ['c', 'd', 'h', 's'];

  public static evaluateHand(cards: Card[]): HandEvaluation {
    if (cards.length < 5 || cards.length > 7) {
      throw new Error('Hand must contain 5-7 cards');
    }

    const sortedCards = this.sortCards(cards);
    const rankCounts = this.getRankCounts(sortedCards);
    const suitCounts = this.getSuitCounts(sortedCards);

    // Check for flush
    const isFlush = Object.values(suitCounts).some(count => count >= 5);

    // Check for straight
    const straightResult = this.checkStraight(sortedCards);
    const isStraight = straightResult.isStraight;

    // Determine hand category
    if (isFlush && isStraight) {
      if (straightResult.highCard === 14) { // Ace high straight
        return {
          rank: 10,
          description: 'Royal Flush',
          category: HandCategory.ROYAL_FLUSH
        };
      }
      return {
        rank: 9,
        description: `Straight Flush, ${this.rankToString(straightResult.highCard)} high`,
        category: HandCategory.STRAIGHT_FLUSH
      };
    }

    const counts = Object.values(rankCounts).sort((a, b) => b - a);

    if (counts[0] === 4) {
      return {
        rank: 8,
        description: 'Four of a Kind',
        category: HandCategory.FOUR_OF_A_KIND
      };
    }

    if (counts[0] === 3 && counts[1] === 2) {
      return {
        rank: 7,
        description: 'Full House',
        category: HandCategory.FULL_HOUSE
      };
    }

    if (isFlush) {
      return {
        rank: 6,
        description: 'Flush',
        category: HandCategory.FLUSH
      };
    }

    if (isStraight) {
      return {
        rank: 5,
        description: `Straight, ${this.rankToString(straightResult.highCard)} high`,
        category: HandCategory.STRAIGHT
      };
    }

    if (counts[0] === 3) {
      return {
        rank: 4,
        description: 'Three of a Kind',
        category: HandCategory.THREE_OF_A_KIND
      };
    }

    if (counts[0] === 2 && counts[1] === 2) {
      return {
        rank: 3,
        description: 'Two Pair',
        category: HandCategory.TWO_PAIR
      };
    }

    if (counts[0] === 2) {
      return {
        rank: 2,
        description: 'Pair',
        category: HandCategory.PAIR
      };
    }

    return {
      rank: 1,
      description: 'High Card',
      category: HandCategory.HIGH_CARD
    };
  }

  public static calculateEquity(hand1: Card[], hand2: Card[], board: Card[] = [], iterations: number = 10000): number {
    if (board.length > 5) {
      throw new Error('Board cannot have more than 5 cards');
    }

    let wins = 0;
    let ties = 0;

    for (let i = 0; i < iterations; i++) {
      const deck = this.createDeck();
      const usedCards = [...hand1, ...hand2, ...board];

      // Remove used cards from deck
      const availableDeck = deck.filter(card =>
        !usedCards.some(used => used.rank === card.rank && used.suit === card.suit)
      );

      // Complete the board
      const completeBoard = [...board];
      while (completeBoard.length < 5) {
        const randomIndex = Math.floor(Math.random() * availableDeck.length);
        completeBoard.push(availableDeck.splice(randomIndex, 1)[0]);
      }

      const hand1Best = this.getBestHand([...hand1, ...completeBoard]);
      const hand2Best = this.getBestHand([...hand2, ...completeBoard]);

      const comparison = this.compareHands(hand1Best, hand2Best);
      if (comparison > 0) wins++;
      else if (comparison === 0) ties++;
    }

    return (wins + ties * 0.5) / iterations;
  }

  private static sortCards(cards: Card[]): Card[] {
    return cards.sort((a, b) => {
      const rankA = this.RANKS.indexOf(a.rank);
      const rankB = this.RANKS.indexOf(b.rank);
      return rankB - rankA; // Sort in descending order
    });
  }

  private static getRankCounts(cards: Card[]): { [rank: string]: number } {
    const counts: { [rank: string]: number } = {};
    cards.forEach(card => {
      counts[card.rank] = (counts[card.rank] || 0) + 1;
    });
    return counts;
  }

  private static getSuitCounts(cards: Card[]): { [suit: string]: number } {
    const counts: { [suit: string]: number } = {};
    cards.forEach(card => {
      counts[card.suit] = (counts[card.suit] || 0) + 1;
    });
    return counts;
  }

  private static checkStraight(cards: Card[]): { isStraight: boolean; highCard: number } {
    const ranks = cards.map(card => this.RANKS.indexOf(card.rank)).sort((a, b) => b - a);
    const uniqueRanks = [...new Set(ranks)];

    // Check for regular straight
    for (let i = 0; i <= uniqueRanks.length - 5; i++) {
      let consecutive = 1;
      for (let j = i + 1; j < uniqueRanks.length && consecutive < 5; j++) {
        if (uniqueRanks[j] === uniqueRanks[j - 1] - 1) {
          consecutive++;
        } else {
          break;
        }
      }
      if (consecutive >= 5) {
        return { isStraight: true, highCard: uniqueRanks[i] + 2 }; // Convert to 2-14 scale
      }
    }

    // Check for A-2-3-4-5 straight (wheel)
    if (uniqueRanks.includes(12) && uniqueRanks.includes(0) && uniqueRanks.includes(1) &&
        uniqueRanks.includes(2) && uniqueRanks.includes(3)) {
      return { isStraight: true, highCard: 5 };
    }

    return { isStraight: false, highCard: 0 };
  }

  private static createDeck(): Card[] {
    const deck: Card[] = [];
    for (const suit of this.SUITS) {
      for (const rank of this.RANKS) {
        deck.push({ rank, suit });
      }
    }
    return deck;
  }

  private static getBestHand(cards: Card[]): Card[] {
    if (cards.length === 5) return cards;

    // Generate all 5-card combinations from 6 or 7 cards
    const combinations = this.getCombinations(cards, 5);
    let bestHand = combinations[0];
    let bestEvaluation = this.evaluateHand(bestHand);

    for (let i = 1; i < combinations.length; i++) {
      const evaluation = this.evaluateHand(combinations[i]);
      if (evaluation.rank > bestEvaluation.rank) {
        bestHand = combinations[i];
        bestEvaluation = evaluation;
      }
    }

    return bestHand;
  }

  private static getCombinations(arr: Card[], size: number): Card[][] {
    if (size === 1) return arr.map(item => [item]);

    const combinations: Card[][] = [];
    for (let i = 0; i <= arr.length - size; i++) {
      const smaller = this.getCombinations(arr.slice(i + 1), size - 1);
      combinations.push(...smaller.map(combo => [arr[i], ...combo]));
    }

    return combinations;
  }

  private static compareHands(hand1: Card[], hand2: Card[]): number {
    const eval1 = this.evaluateHand(hand1);
    const eval2 = this.evaluateHand(hand2);

    if (eval1.rank !== eval2.rank) {
      return eval1.rank - eval2.rank;
    }

    // Same hand rank, need tiebreaker logic
    return this.tiebreaker(hand1, hand2, eval1.category);
  }

  private static tiebreaker(hand1: Card[], hand2: Card[], category: HandCategory): number {
    // Simplified tiebreaker - in production, this would be much more detailed
    const ranks1 = hand1.map(c => this.RANKS.indexOf(c.rank)).sort((a, b) => b - a);
    const ranks2 = hand2.map(c => this.RANKS.indexOf(c.rank)).sort((a, b) => b - a);

    for (let i = 0; i < ranks1.length; i++) {
      if (ranks1[i] !== ranks2[i]) {
        return ranks1[i] - ranks2[i];
      }
    }

    return 0;
  }

  private static rankToString(rank: number): string {
    if (rank === 14) return 'A';
    if (rank === 13) return 'K';
    if (rank === 12) return 'Q';
    if (rank === 11) return 'J';
    if (rank === 10) return 'T';
    return rank.toString();
  }
}