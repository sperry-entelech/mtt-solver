import { ICMResult, Player, TournamentStructure } from '../types';

export class ICMCalculator {

  public static calculateICM(
    stacks: number[],
    payouts: number[],
    playerIndex: number = 0
  ): ICMResult {
    const totalChips = stacks.reduce((sum, stack) => sum + stack, 0);
    const playerStack = stacks[playerIndex];

    if (payouts.length === 0 || stacks.length === 0) {
      throw new Error('Invalid input: empty stacks or payouts');
    }

    // Calculate basic ICM equity
    const equity = this.calculatePlayerEquity(stacks, payouts, playerIndex);
    const chipEV = (playerStack / totalChips) * payouts.reduce((sum, payout) => sum + payout, 0);
    const dollarEV = equity;
    const riskPremium = chipEV - dollarEV;

    return {
      equity,
      chipEV,
      dollarEV,
      riskPremium
    };
  }

  public static calculatePlayerEquity(
    stacks: number[],
    payouts: number[],
    playerIndex: number
  ): number {
    const n = stacks.length;
    const totalChips = stacks.reduce((sum, stack) => sum + stack, 0);

    if (n === 1) {
      return payouts[0] || 0;
    }

    if (n <= payouts.length) {
      // All players are in the money
      return this.calculateInMoneyEquity(stacks, payouts, playerIndex);
    }

    // Calculate probability of being eliminated next
    const eliminationProbs = this.calculateEliminationProbabilities(stacks);

    let equity = 0;

    // Calculate equity for each possible elimination scenario
    for (let i = 0; i < n; i++) {
      if (i === playerIndex) {
        // Player is eliminated - gets 0
        continue;
      }

      // Player i is eliminated
      const newStacks = stacks.filter((_, index) => index !== i);
      const newPlayerIndex = playerIndex > i ? playerIndex - 1 : playerIndex;
      const newPayouts = payouts.slice(0, Math.min(payouts.length, newStacks.length));

      if (newPayouts.length > 0) {
        const subEquity = this.calculatePlayerEquity(newStacks, newPayouts, newPlayerIndex);
        equity += eliminationProbs[i] * subEquity;
      }
    }

    return equity;
  }

  private static calculateInMoneyEquity(
    stacks: number[],
    payouts: number[],
    playerIndex: number
  ): number {
    const n = stacks.length;

    if (n === 1) {
      return payouts[0];
    }

    if (n === 2) {
      const totalChips = stacks[0] + stacks[1];
      const playerChips = stacks[playerIndex];
      const winProb = playerChips / totalChips;

      return winProb * payouts[0] + (1 - winProb) * (payouts[1] || 0);
    }

    // For more complex calculations, use recursive approach
    const eliminationProbs = this.calculateEliminationProbabilities(stacks);
    let equity = 0;

    for (let i = 0; i < n; i++) {
      if (i === playerIndex) {
        // Player gets the lowest remaining payout
        const lowestPayout = payouts[n - 1] || 0;
        equity += eliminationProbs[i] * lowestPayout;
      } else {
        // Another player is eliminated
        const newStacks = stacks.filter((_, index) => index !== i);
        const newPlayerIndex = playerIndex > i ? playerIndex - 1 : playerIndex;
        const newPayouts = payouts.slice(0, newStacks.length);

        const subEquity = this.calculateInMoneyEquity(newStacks, newPayouts, newPlayerIndex);
        equity += eliminationProbs[i] * subEquity;
      }
    }

    return equity;
  }

  private static calculateEliminationProbabilities(stacks: number[]): number[] {
    const totalChips = stacks.reduce((sum, stack) => sum + stack, 0);
    const probs: number[] = [];

    for (let i = 0; i < stacks.length; i++) {
      // Probability of being eliminated is inversely proportional to stack size
      // Using harmonic mean for more accurate ICM calculation
      const otherStacks = stacks.filter((_, index) => index !== i);
      const harmonicMean = otherStacks.length / otherStacks.reduce((sum, stack) => sum + 1/stack, 0);

      probs[i] = harmonicMean / (harmonicMean + stacks[i]);
    }

    // Normalize probabilities
    const sum = probs.reduce((total, prob) => total + prob, 0);
    return probs.map(prob => prob / sum);
  }

  public static calculateBubbleFactor(
    stacks: number[],
    payouts: number[],
    playerIndex: number
  ): number {
    const totalChips = stacks.reduce((sum, stack) => sum + stack, 0);
    const playerStack = stacks[playerIndex];

    // Chip equity (what the chips would be worth if distributed proportionally)
    const chipEquity = (playerStack / totalChips) * payouts.reduce((sum, payout) => sum + payout, 0);

    // ICM equity (actual tournament equity)
    const icmEquity = this.calculatePlayerEquity(stacks, payouts, playerIndex);

    // Bubble factor is the ratio of chip equity to ICM equity
    return icmEquity > 0 ? chipEquity / icmEquity : 1;
  }

  public static calculatePushFoldEquity(
    heroStack: number,
    villainStack: number,
    blinds: number,
    antes: number,
    callingRange: number, // Percentage of hands villain calls with
    foldEquity: number // Percentage of time villain folds
  ): { pushEV: number; foldEV: number } {
    const pot = blinds + antes;

    // EV of folding is always 0 in push/fold scenarios
    const foldEV = 0;

    // EV of pushing = (fold equity * pot) + (call equity * (pot + villain's call))
    const callEquity = 0.5; // Simplified - would calculate based on specific hands
    const effectiveStack = Math.min(heroStack, villainStack);

    const pushEV = (foldEquity * pot) +
                   ((1 - foldEquity) * (callEquity * (pot + effectiveStack) - (1 - callEquity) * effectiveStack));

    return { pushEV, foldEV };
  }

  public static calculateOptimalPushingRange(
    heroStack: number,
    villainStacks: number[],
    blinds: number,
    antes: number,
    position: string,
    payouts: number[]
  ): string[] {
    // Simplified push range calculation
    // In practice, this would involve complex GTO calculations

    const stackInBB = heroStack / blinds;

    // Basic push ranges based on stack size (simplified)
    if (stackInBB <= 8) {
      return this.getTightPushRange();
    } else if (stackInBB <= 12) {
      return this.getMediumPushRange();
    } else if (stackInBB <= 18) {
      return this.getWidePushRange();
    } else {
      return this.getVeryWidePushRange();
    }
  }

  private static getTightPushRange(): string[] {
    return [
      'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77',
      'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'ATs', 'ATo',
      'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
      'KQs', 'KQo', 'KJs', 'KJo', 'KTs', 'K9s',
      'QJs', 'QJo', 'QTs', 'Q9s',
      'JTs', 'J9s',
      'T9s'
    ];
  }

  private static getMediumPushRange(): string[] {
    return [
      ...this.getTightPushRange(),
      '66', '55', '44', '33', '22',
      'A9o', 'A8o', 'A7o', 'A6o', 'A5o',
      'KTo', 'K9o', 'K8s', 'K7s', 'K6s', 'K5s',
      'Q9o', 'Q8s', 'Q7s',
      'J9o', 'J8s', 'J7s',
      'T9o', 'T8s', '98s'
    ];
  }

  private static getWidePushRange(): string[] {
    return [
      ...this.getMediumPushRange(),
      'A4o', 'A3o', 'A2o',
      'K8o', 'K7o', 'K6o', 'K5o', 'K4s', 'K3s', 'K2s',
      'Q8o', 'Q7o', 'Q6s', 'Q5s', 'Q4s',
      'J8o', 'J7o', 'J6s', 'J5s',
      'T8o', 'T7s', 'T6s',
      '98o', '97s', '96s',
      '87s', '86s',
      '76s', '75s',
      '65s'
    ];
  }

  private static getVeryWidePushRange(): string[] {
    return [
      ...this.getWidePushRange(),
      'K4o', 'K3o', 'K2o',
      'Q6o', 'Q5o', 'Q4o', 'Q3s', 'Q2s',
      'J6o', 'J5o', 'J4s', 'J3s', 'J2s',
      'T7o', 'T6o', 'T5s', 'T4s', 'T3s', 'T2s',
      '97o', '96o', '95s', '94s',
      '87o', '86o', '85s', '84s',
      '76o', '75o', '74s',
      '65o', '64s', '63s',
      '54s', '53s',
      '43s', '42s',
      '32s'
    ];
  }
}