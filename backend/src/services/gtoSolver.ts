import { Card, Position, Action } from '../types';
import { HandEvaluator } from './handEvaluator';
import { ICMCalculator } from './icmCalculator';
import { RangeAnalyzer } from './rangeAnalyzer';
import { logger } from '../utils/logger';

export interface GameState {
  street: 'preflop' | 'flop' | 'turn' | 'river';
  pot: number;
  heroStack: number;
  villainStack: number;
  heroCards: Card[];
  board: Card[];
  position: Position;
  actionHistory: Action[];
  currentPlayer: 'hero' | 'villain';
}

export interface GameTreeNode {
  state: GameState;
  children: GameTreeNode[];
  strategy: Map<string, number>; // action -> probability
  value: number;
  isTerminal: boolean;
}

export interface GTOSolution {
  strategy: Map<string, number>;
  ev: number;
  exploitability: number;
  iterations: number;
  convergence: boolean;
}

export class GTOSolver {
  private static readonly MAX_ITERATIONS = 1000;
  private static readonly CONVERGENCE_THRESHOLD = 0.001;
  private static readonly BET_SIZES = [0.33, 0.5, 0.67, 1.0, 1.5, 2.0]; // Pot fractions

  /**
   * Solve a game tree using Counterfactual Regret Minimization (CFR)
   */
  public static solveCFR(gameState: GameState, iterations: number = this.MAX_ITERATIONS): GTOSolution {
    logger.info('Starting CFR solver', { street: gameState.street, iterations });

    const strategy = new Map<string, number>();
    const regretSum = new Map<string, number>();
    const strategySum = new Map<string, number>();

    // Initialize strategy uniformly
    const actions = this.getAvailableActions(gameState);
    actions.forEach(action => {
      strategy.set(action, 1.0 / actions.length);
      regretSum.set(action, 0);
      strategySum.set(action, 0);
    });

    let exploitability = Infinity;
    let converged = false;

    for (let i = 0; i < iterations; i++) {
      // Run CFR iteration
      const nodeValue = this.cfr(gameState, 1.0, 1.0, 0, strategy, regretSum, strategySum);

      // Calculate exploitability
      if (i % 100 === 0 || i === iterations - 1) {
        exploitability = this.calculateExploitability(gameState, strategy);
        converged = exploitability < this.CONVERGENCE_THRESHOLD;

        if (converged) {
          logger.info('CFR converged', { iterations: i + 1, exploitability });
          break;
        }
      }
    }

    // Normalize strategy
    const normalizedStrategy = this.normalizeStrategy(strategy);

    return {
      strategy: normalizedStrategy,
      ev: this.calculateEV(gameState, normalizedStrategy),
      exploitability,
      iterations,
      convergence: converged,
    };
  }

  /**
   * Counterfactual Regret Minimization algorithm
   */
  private static cfr(
    state: GameState,
    reachHero: number,
    reachVillain: number,
    depth: number,
    strategy: Map<string, number>,
    regretSum: Map<string, number>,
    strategySum: Map<string, number>
  ): number {
    // Terminal node evaluation
    if (this.isTerminal(state)) {
      return this.evaluateTerminal(state);
    }

    const actions = this.getAvailableActions(state);
    const actionValues = new Map<string, number>();

    // Calculate action values
    actions.forEach(action => {
      const actionProb = strategy.get(action) || 0;
      if (actionProb > 0) {
        const nextState = this.applyAction(state, action);
        const actionValue = this.cfr(
          nextState,
          state.currentPlayer === 'hero' ? reachHero * actionProb : reachHero,
          state.currentPlayer === 'villain' ? reachVillain * actionProb : reachVillain,
          depth + 1,
          strategy,
          regretSum,
          strategySum
        );
        actionValues.set(action, actionValue);
      }
    });

    // Update regrets and strategy
    const nodeValue = Array.from(actionValues.values()).reduce((sum, val) => sum + val, 0) / actions.length;

    if (state.currentPlayer === 'hero') {
      actions.forEach(action => {
        const actionValue = actionValues.get(action) || 0;
        const regret = actionValue - nodeValue;
        const currentRegret = regretSum.get(action) || 0;
        regretSum.set(action, Math.max(0, currentRegret + reachVillain * regret));

        const currentStrategySum = strategySum.get(action) || 0;
        strategySum.set(action, currentStrategySum + reachHero * (strategy.get(action) || 0));
      });
    }

    return nodeValue;
  }

  /**
   * Get available actions for current game state
   */
  private static getAvailableActions(state: GameState): string[] {
    const actions: string[] = ['fold'];

    if (state.street === 'preflop') {
      if (state.actionHistory.length === 0) {
        actions.push('check', 'bet_33', 'bet_50', 'bet_67');
      } else {
        actions.push('call', 'raise_33', 'raise_50', 'raise_67');
      }
    } else {
      // Post-flop actions
      actions.push('check', 'bet_33', 'bet_50', 'bet_67', 'bet_100');
    }

    return actions;
  }

  /**
   * Check if state is terminal
   */
  private static isTerminal(state: GameState): boolean {
    if (state.street === 'river' && state.actionHistory.length >= 2) {
      const lastAction = state.actionHistory[state.actionHistory.length - 1];
      return lastAction === Action.FOLD || lastAction === Action.CALL;
    }
    return state.actionHistory[state.actionHistory.length - 1] === Action.FOLD;
  }

  /**
   * Evaluate terminal node
   */
  private static evaluateTerminal(state: GameState): number {
    const lastAction = state.actionHistory[state.actionHistory.length - 1];

    if (lastAction === Action.FOLD) {
      // Folding player loses their investment
      return state.currentPlayer === 'hero' ? -state.pot / 2 : state.pot / 2;
    }

    // Showdown - calculate equity
    if (state.board.length >= 5) {
      // Simplified equity calculation
      // In production, this would use HandEvaluator for accurate equity
      return 0; // Neutral EV for now
    }

    return 0;
  }

  /**
   * Apply action to game state
   */
  private static applyAction(state: GameState, action: string): GameState {
    const newState = { ...state };
    newState.actionHistory = [...state.actionHistory];

    // Parse action
    if (action === 'fold') {
      newState.actionHistory.push(Action.FOLD);
    } else if (action === 'check' || action === 'call') {
      newState.actionHistory.push(Action.CALL);
    } else if (action.startsWith('bet_') || action.startsWith('raise_')) {
      const size = parseFloat(action.split('_')[1]) / 100;
      newState.pot += state.pot * size;
      newState.actionHistory.push(Action.RAISE);
    }

    // Switch current player
    newState.currentPlayer = state.currentPlayer === 'hero' ? 'villain' : 'hero';

    return newState;
  }

  /**
   * Normalize strategy to probabilities
   */
  private static normalizeStrategy(strategy: Map<string, number>): Map<string, number> {
    const normalized = new Map<string, number>();
    const sum = Array.from(strategy.values()).reduce((a, b) => a + b, 0);

    if (sum > 0) {
      strategy.forEach((value, action) => {
        normalized.set(action, value / sum);
      });
    } else {
      // Uniform strategy if sum is zero
      const actions = Array.from(strategy.keys());
      actions.forEach(action => {
        normalized.set(action, 1.0 / actions.length);
      });
    }

    return normalized;
  }

  /**
   * Calculate exploitability
   */
  private static calculateExploitability(state: GameState, strategy: Map<string, number>): number {
    // Simplified exploitability calculation
    // In production, this would calculate best response value
    return 0.01; // Placeholder
  }

  /**
   * Calculate expected value
   */
  private static calculateEV(state: GameState, strategy: Map<string, number>): number {
    // Simplified EV calculation
    let ev = 0;
    strategy.forEach((prob, action) => {
      const actionValue = this.evaluateTerminal(this.applyAction(state, action));
      ev += prob * actionValue;
    });
    return ev;
  }

  /**
   * Solve range vs range equity
   */
  public static solveRangeVsRange(
    heroRange: string[],
    villainRange: string[],
    board: Card[] = [],
    iterations: number = 10000
  ): number {
    // Simplified range vs range calculation
    // In production, this would enumerate all hand combinations
    let totalEquity = 0;
    let count = 0;

    for (const heroHand of heroRange) {
      for (const villainHand of villainRange) {
        if (heroHand !== villainHand) {
          // Calculate equity for this hand matchup
          const equity = HandEvaluator.calculateEquity(
            this.parseHand(heroHand),
            this.parseHand(villainHand),
            board,
            iterations / (heroRange.length * villainRange.length)
          );
          totalEquity += equity;
          count++;
        }
      }
    }

    return count > 0 ? totalEquity / count : 0.5;
  }

  /**
   * Parse hand string to Card array
   */
  private static parseHand(handString: string): Card[] {
    // Simplified parsing - assumes format like "AsKh"
    const cards: Card[] = [];
    const pairs = handString.match(/.{2}/g) || [];

    pairs.forEach(pair => {
      const rank = pair[0];
      const suit = pair[1].toLowerCase();
      cards.push({ rank, suit });
    });

    return cards;
  }
}

