import { Range, Position, Card, RangeVsRangeResult } from '../types';
import { HandEvaluator } from './handEvaluator';

export class RangeAnalyzer {
  private static readonly RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  private static readonly SUITS = ['s', 'h', 'd', 'c'];

  public static parseRangeString(rangeString: string): string[] {
    const hands: string[] = [];
    const parts = rangeString.split(',').map(part => part.trim());

    for (const part of parts) {
      if (part.includes('-')) {
        // Handle ranges like "22-77" or "ATo-AJo"
        hands.push(...this.expandRange(part));
      } else if (part.includes('+')) {
        // Handle plus ranges like "77+" or "ATo+"
        hands.push(...this.expandPlusRange(part));
      } else {
        // Single hand
        hands.push(...this.expandSingleHand(part));
      }
    }

    return [...new Set(hands)]; // Remove duplicates
  }

  public static rangeStringToHands(rangeString: string): string[] {
    return this.parseRangeString(rangeString);
  }

  public static handsToRangeString(hands: string[]): string {
    // Convert array of hands back to compact range string
    const pockets = hands.filter(h => h[0] === h[1]).sort((a, b) =>
      this.RANKS.indexOf(a[0]) - this.RANKS.indexOf(b[0])
    );

    const suited = hands.filter(h => h.endsWith('s') && h[0] !== h[1]).sort();
    const offsuit = hands.filter(h => h.endsWith('o')).sort();

    const parts: string[] = [];

    // Compress pocket pairs
    if (pockets.length > 0) {
      parts.push(...this.compressConsecutive(pockets));
    }

    // Compress suited hands
    if (suited.length > 0) {
      parts.push(...this.compressConsecutive(suited));
    }

    // Compress offsuit hands
    if (offsuit.length > 0) {
      parts.push(...this.compressConsecutive(offsuit));
    }

    return parts.join(', ');
  }

  public static calculateRangeEquity(
    range1: string[],
    range2: string[],
    board: Card[] = [],
    iterations: number = 1000
  ): RangeVsRangeResult {
    let range1Wins = 0;
    let range2Wins = 0;
    let ties = 0;
    let totalCombos = 0;

    const detailed: { [hand: string]: number } = {};

    for (const hand1 of range1) {
      for (const hand2 of range2) {
        const hand1Cards = this.handStringToCards(hand1);
        const hand2Cards = this.handStringToCards(hand2);

        // Check if hands conflict
        if (this.handsConflict(hand1Cards, hand2Cards, board)) {
          continue;
        }

        // Calculate equity for this specific matchup
        let wins = 0;
        let localTies = 0;

        for (let i = 0; i < iterations; i++) {
          const result = this.simulateHand(hand1Cards, hand2Cards, board);
          if (result === 1) wins++;
          else if (result === 0) localTies++;
        }

        const equity = (wins + localTies * 0.5) / iterations;
        detailed[`${hand1} vs ${hand2}`] = equity;

        range1Wins += wins;
        range2Wins += (iterations - wins - localTies);
        ties += localTies;
        totalCombos += iterations;
      }
    }

    return {
      range1Equity: totalCombos > 0 ? (range1Wins + ties * 0.5) / totalCombos : 0,
      range2Equity: totalCombos > 0 ? (range2Wins + ties * 0.5) / totalCombos : 0,
      tieEquity: totalCombos > 0 ? ties / totalCombos : 0,
      iterations: totalCombos,
      detailed
    };
  }

  public static getPositionalRange(position: Position, action: 'open' | 'call' | 'push'): Range {
    const ranges = this.getDefaultRanges();
    const key = `${position}_${action}`;

    if (ranges[key]) {
      return {
        position,
        rangeString: ranges[key],
        hands: this.parseRangeString(ranges[key]),
        description: `${position} ${action} range`
      };
    }

    // Fallback to tight range
    return {
      position,
      rangeString: 'AA-TT, AKs-ATs, AKo-AQo',
      hands: this.parseRangeString('AA-TT, AKs-ATs, AKo-AQo'),
      description: `${position} default range`
    };
  }

  private static expandRange(rangeString: string): string[] {
    const [start, end] = rangeString.split('-');
    const hands: string[] = [];

    if (start.length === 2 && end.length === 2 && start[0] === start[1] && end[0] === end[1]) {
      // Pocket pair range like "22-77"
      const startRank = this.RANKS.indexOf(start[0]);
      const endRank = this.RANKS.indexOf(end[0]);

      for (let i = Math.min(startRank, endRank); i <= Math.max(startRank, endRank); i++) {
        hands.push(this.RANKS[i] + this.RANKS[i]);
      }
    } else {
      // Suited/offsuit range like "ATo-AJo"
      const startCard = start[1];
      const endCard = end[1];
      const suit = start[2];
      const startRank = this.RANKS.indexOf(startCard);
      const endRank = this.RANKS.indexOf(endCard);

      for (let i = Math.min(startRank, endRank); i <= Math.max(startRank, endRank); i++) {
        hands.push(start[0] + this.RANKS[i] + suit);
      }
    }

    return hands;
  }

  private static expandPlusRange(rangeString: string): string[] {
    const base = rangeString.slice(0, -1); // Remove '+'
    const hands: string[] = [];

    if (base.length === 2 && base[0] === base[1]) {
      // Pocket pair plus like "77+"
      const startRank = this.RANKS.indexOf(base[0]);
      for (let i = 0; i <= startRank; i++) {
        hands.push(this.RANKS[i] + this.RANKS[i]);
      }
    } else if (base.length === 3) {
      // Suited/offsuit plus like "ATo+"
      const highCard = base[0];
      const startCard = base[1];
      const suit = base[2];
      const startRank = this.RANKS.indexOf(startCard);

      for (let i = 0; i < startRank; i++) {
        hands.push(highCard + this.RANKS[i] + suit);
      }
      hands.push(base); // Include the base hand itself
    }

    return hands;
  }

  private static expandSingleHand(hand: string): string[] {
    if (hand.length === 2 && hand[0] === hand[1]) {
      // Pocket pair
      return [hand];
    } else if (hand.length === 3) {
      // Specific suited/offsuit hand
      return [hand];
    } else if (hand.length === 2) {
      // Generic hand like "AK" - return both suited and offsuit
      return [hand + 's', hand + 'o'];
    }

    return [hand];
  }

  private static compressConsecutive(hands: string[]): string[] {
    // Simplified compression - in practice would be more sophisticated
    return hands;
  }

  private static handStringToCards(handString: string): Card[] {
    const cards: Card[] = [];

    if (handString.length === 2) {
      // Pocket pair
      cards.push({ rank: handString[0], suit: 'h' });
      cards.push({ rank: handString[0], suit: 's' });
    } else if (handString.length === 3) {
      const suit1 = handString[2] === 's' ? 'h' : 'h';
      const suit2 = handString[2] === 's' ? 's' : 'c';
      cards.push({ rank: handString[0], suit: suit1 });
      cards.push({ rank: handString[1], suit: suit2 });
    }

    return cards;
  }

  private static handsConflict(hand1: Card[], hand2: Card[], board: Card[]): boolean {
    const allCards = [...hand1, ...hand2, ...board];
    const cardStrings = allCards.map(c => c.rank + c.suit);
    return cardStrings.length !== new Set(cardStrings).size;
  }

  private static simulateHand(hand1: Card[], hand2: Card[], board: Card[]): number {
    // Simplified simulation - would use more sophisticated evaluation
    const deck = this.createDeck();
    const usedCards = [...hand1, ...hand2, ...board];

    // Remove used cards
    const availableDeck = deck.filter(card =>
      !usedCards.some(used => used.rank === card.rank && used.suit === card.suit)
    );

    // Complete board
    const completeBoard = [...board];
    while (completeBoard.length < 5) {
      const randomIndex = Math.floor(Math.random() * availableDeck.length);
      completeBoard.push(availableDeck.splice(randomIndex, 1)[0]);
    }

    const eval1 = HandEvaluator.evaluateHand([...hand1, ...completeBoard]);
    const eval2 = HandEvaluator.evaluateHand([...hand2, ...completeBoard]);

    if (eval1.rank > eval2.rank) return 1;
    if (eval1.rank < eval2.rank) return -1;
    return 0;
  }

  private static createDeck(): Card[] {
    const deck: Card[] = [];
    for (const suit of ['h', 's', 'd', 'c']) {
      for (const rank of this.RANKS) {
        deck.push({ rank, suit });
      }
    }
    return deck;
  }

  private static getDefaultRanges(): { [key: string]: string } {
    return {
      'UTG_open': 'AA-77, AKs-ATs, AKo-AQo, KQs',
      'UTG1_open': 'AA-66, AKs-A9s, AKo-AJo, KQs-KJs, QJs',
      'MP_open': 'AA-55, AKs-A8s, AKo-ATo, KQs-KTs, QJs-QTs, JTs',
      'HJ_open': 'AA-44, AKs-A7s, AKo-A9o, KQs-K9s, QJs-Q9s, JTs-J9s, T9s',
      'CO_open': 'AA-33, AKs-A5s, AKo-A8o, KQs-K8s, QJs-Q8s, JTs-J8s, T9s-T8s, 98s',
      'BTN_open': 'AA-22, AKs-A2s, AKo-A7o, KQs-K7s, QJs-Q7s, JTs-J7s, T9s-T7s, 98s-97s, 87s, 76s, 65s',
      'SB_open': 'AA-22, AKs-A2s, AKo-A5o, KQs-K5s, QJs-Q5s, JTs-J6s, T9s-T6s, 98s-96s, 87s-86s, 76s-75s, 65s-64s, 54s',
      'BB_call': 'AA-22, AKs-A2s, AKo-A2o, KQs-K2s, QJs-Q2s, JTs-J2s, T9s-T2s, 98s-92s, 87s-82s, 76s-72s, 65s-62s, 54s-52s, 43s-42s, 32s'
    };
  }
}