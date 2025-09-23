import express from 'express';
import Joi from 'joi';
import { asyncHandler, validateBody, createError } from '../middleware/errorHandler';
import { HandEvaluator } from '../services/handEvaluator';
import { CacheService } from '../config/database';
import { PerformanceLogger } from '../utils/logger';
import { Card } from '../types';

const router = express.Router();

// Validation schemas
const cardSchema = Joi.object({
  rank: Joi.string().valid('A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2').required(),
  suit: Joi.string().valid('s', 'h', 'd', 'c').required()
});

const handAnalysisSchema = Joi.object({
  holeCards: Joi.array().items(cardSchema).length(2).required(),
  board: Joi.array().items(cardSchema).max(5).default([]),
  opponents: Joi.number().min(1).max(9).default(1),
  position: Joi.string().valid('UTG', 'UTG1', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB').required(),
  action: Joi.string().valid('PREFLOP', 'FLOP', 'TURN', 'RIVER').default('PREFLOP'),
  stackSize: Joi.number().min(1).optional(),
  potSize: Joi.number().min(0).optional()
});

const handEvaluationSchema = Joi.object({
  cards: Joi.array().items(cardSchema).min(5).max(7).required()
});

const equityCalculationSchema = Joi.object({
  hand1: Joi.array().items(cardSchema).length(2).required(),
  hand2: Joi.array().items(cardSchema).length(2).required(),
  board: Joi.array().items(cardSchema).max(5).default([]),
  iterations: Joi.number().min(100).max(50000).default(10000)
});

// POST /api/hands/analyze - Analyze specific hand
router.post('/analyze', validateBody(handAnalysisSchema), asyncHandler(async (req, res) => {
  const perf = new PerformanceLogger('Hand analysis');
  const { holeCards, board, opponents, position, action, stackSize, potSize } = req.body;

  const cacheKey = `analyze:${JSON.stringify(req.body)}`;
  const cached = await CacheService.get(cacheKey);

  if (cached) {
    perf.end();
    return res.json({
      success: true,
      data: cached,
      cached: true
    });
  }

  try {
    const analysis: any = {
      holeCards,
      board,
      position,
      action,
      opponents
    };

    // Evaluate current hand strength
    if (board.length >= 3) {
      const allCards = [...holeCards, ...board];
      analysis.handStrength = HandEvaluator.evaluateHand(allCards);
    }

    // Calculate preflop hand strength
    analysis.preflopStrength = analyzePreflopHand(holeCards);

    // Calculate equity against random hands
    const randomHandEquity = await calculateEquityVsRandom(holeCards, board, opponents);
    analysis.equityVsRandom = randomHandEquity;

    // Position-based analysis
    analysis.positionalAdvantage = getPositionalAdvantage(position);

    // Action recommendations
    analysis.recommendations = getActionRecommendations(
      analysis.preflopStrength,
      position,
      opponents,
      stackSize,
      potSize,
      board.length
    );

    // Hand categories and playability
    analysis.playability = getHandPlayability(holeCards, position, opponents);

    // Pot odds and implied odds (if applicable)
    if (potSize && stackSize) {
      analysis.potOdds = calculatePotOdds(potSize, stackSize);
    }

    await CacheService.set(cacheKey, analysis, 1800); // 30 minutes cache
    perf.end();

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    throw createError.internal(`Hand analysis failed: ${error.message}`);
  }
}));

// POST /api/hands/evaluate - Evaluate hand strength
router.post('/evaluate', validateBody(handEvaluationSchema), asyncHandler(async (req, res) => {
  const perf = new PerformanceLogger('Hand evaluation');
  const { cards } = req.body;

  const cacheKey = `evaluate:${JSON.stringify(cards)}`;
  const cached = await CacheService.get(cacheKey);

  if (cached) {
    perf.end();
    return res.json({
      success: true,
      data: cached,
      cached: true
    });
  }

  try {
    const evaluation = HandEvaluator.evaluateHand(cards);

    const analysis = {
      ...evaluation,
      cards,
      strength: getStrengthDescription(evaluation.rank),
      percentile: getHandPercentile(evaluation.rank),
      nuts: isNuts(cards, evaluation)
    };

    await CacheService.set(cacheKey, analysis, 3600); // 1 hour cache
    perf.end();

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    throw createError.internal(`Hand evaluation failed: ${error.message}`);
  }
}));

// POST /api/hands/equity - Calculate hand vs hand equity
router.post('/equity', validateBody(equityCalculationSchema), asyncHandler(async (req, res) => {
  const perf = new PerformanceLogger('Equity calculation');
  const { hand1, hand2, board, iterations } = req.body;

  const cacheKey = `equity:${JSON.stringify(req.body)}`;
  const cached = await CacheService.get(cacheKey);

  if (cached) {
    perf.end();
    return res.json({
      success: true,
      data: cached,
      cached: true
    });
  }

  try {
    // Check for card conflicts
    const allCards = [...hand1, ...hand2, ...board];
    if (hasCardConflicts(allCards)) {
      throw createError.badRequest('Duplicate cards detected');
    }

    const equity = HandEvaluator.calculateEquity(hand1, hand2, board, iterations);

    const analysis = {
      hand1: {
        cards: hand1,
        equity: equity,
        description: getHandDescription(hand1)
      },
      hand2: {
        cards: hand2,
        equity: 1 - equity,
        description: getHandDescription(hand2)
      },
      board,
      iterations,
      favorite: equity > 0.5 ? 'Hand 1' : 'Hand 2',
      equityDifference: Math.abs(equity - 0.5) * 2,
      flips: Math.abs(equity - 0.5) < 0.1,
      dominance: getDominanceLevel(equity)
    };

    await CacheService.set(cacheKey, analysis, 1800); // 30 minutes cache
    perf.end();

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    throw createError.internal(`Equity calculation failed: ${error.message}`);
  }
}));

// GET /api/hands/starting-hands - Get starting hand rankings
router.get('/starting-hands', asyncHandler(async (req, res) => {
  const { category = 'all', limit = 50 } = req.query;

  const cacheKey = `starting-hands:${category}:${limit}`;
  const cached = await CacheService.get(cacheKey);

  if (cached) {
    return res.json({
      success: true,
      data: cached,
      cached: true
    });
  }

  try {
    const startingHands = getStartingHandRankings(category as string, parseInt(limit as string));
    await CacheService.set(cacheKey, startingHands, 7200); // 2 hours cache

    res.json({
      success: true,
      data: startingHands
    });

  } catch (error) {
    throw createError.internal(`Starting hand ranking failed: ${error.message}`);
  }
}));

// POST /api/hands/odds - Calculate various poker odds
router.post('/odds', asyncHandler(async (req, res) => {
  const { handType, scenario } = req.body;

  try {
    let odds: any = {};

    switch (handType) {
      case 'preflop':
        odds = getPreflopOdds(scenario);
        break;
      case 'draws':
        odds = getDrawOdds(scenario);
        break;
      case 'improvements':
        odds = getImprovementOdds(scenario);
        break;
      default:
        throw createError.badRequest('Invalid hand type');
    }

    res.json({
      success: true,
      data: odds
    });

  } catch (error) {
    throw createError.internal(`Odds calculation failed: ${error.message}`);
  }
}));

// Helper functions
function analyzePreflopHand(holeCards: Card[]): any {
  const hand = getHandDescription(holeCards);
  const category = getPreflopCategory(holeCards);
  const strength = getPreflopStrength(holeCards);

  return {
    hand,
    category,
    strength,
    playable: strength > 3,
    premium: strength > 8
  };
}

function getPreflopCategory(cards: Card[]): string {
  const [card1, card2] = cards;
  const isPair = card1.rank === card2.rank;
  const isSuited = card1.suit === card2.suit;
  const isConnected = isConnector(card1.rank, card2.rank);
  const isBroadway = ['A', 'K', 'Q', 'J', 'T'].includes(card1.rank) &&
                    ['A', 'K', 'Q', 'J', 'T'].includes(card2.rank);

  if (isPair) return 'POCKET_PAIR';
  if (isSuited && isConnected) return 'SUITED_CONNECTOR';
  if (isSuited && isBroadway) return 'SUITED_BROADWAY';
  if (isSuited) return 'SUITED';
  if (isConnected) return 'CONNECTOR';
  if (isBroadway) return 'BROADWAY';
  return 'OTHER';
}

function getPreflopStrength(cards: Card[]): number {
  // Simplified preflop strength calculation (1-10 scale)
  const handDescription = getHandDescription(cards);

  const premiumHands = ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo'];
  const strongHands = ['TT', '99', 'AQs', 'AQo', 'AJs', 'AJo', 'KQs'];
  const playableHands = ['88', '77', 'ATs', 'ATo', 'A9s', 'KQo', 'KJs', 'QJs'];

  if (premiumHands.includes(handDescription)) return 9;
  if (strongHands.includes(handDescription)) return 7;
  if (playableHands.includes(handDescription)) return 5;

  return 3; // Default for other hands
}

function isConnector(rank1: string, rank2: string): boolean {
  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  const index1 = ranks.indexOf(rank1);
  const index2 = ranks.indexOf(rank2);
  return Math.abs(index1 - index2) === 1;
}

async function calculateEquityVsRandom(holeCards: Card[], board: Card[], opponents: number): Promise<number> {
  // Simplified calculation - in production would be more accurate
  const handStrength = getPreflopStrength(holeCards);
  const baseEquity = handStrength / 10;
  const opponentAdjustment = Math.pow(0.9, opponents - 1);
  return Math.min(0.95, baseEquity * opponentAdjustment);
}

function getPositionalAdvantage(position: string): any {
  const advantages = {
    'UTG': { strength: 1, description: 'Early position - play tight' },
    'UTG1': { strength: 2, description: 'Early position - selective play' },
    'MP': { strength: 4, description: 'Middle position - moderate range' },
    'HJ': { strength: 6, description: 'Hijack - wider range possible' },
    'CO': { strength: 7, description: 'Cutoff - strong positional advantage' },
    'BTN': { strength: 9, description: 'Button - maximum positional advantage' },
    'SB': { strength: 3, description: 'Small blind - positional disadvantage' },
    'BB': { strength: 5, description: 'Big blind - closing action preflop' }
  };

  return advantages[position] || { strength: 5, description: 'Unknown position' };
}

function getActionRecommendations(
  preflopStrength: any,
  position: string,
  opponents: number,
  stackSize?: number,
  potSize?: number,
  street?: number
): string[] {
  const recommendations: string[] = [];

  if (preflopStrength.strength >= 8) {
    recommendations.push('RAISE/BET for value');
    recommendations.push('Premium hand - be aggressive');
  } else if (preflopStrength.strength >= 6) {
    recommendations.push('RAISE in position, CALL out of position');
    recommendations.push('Strong hand - play for value');
  } else if (preflopStrength.strength >= 4) {
    recommendations.push('Consider position and opponents');
    recommendations.push('Marginal hand - proceed with caution');
  } else {
    recommendations.push('FOLD in most situations');
    recommendations.push('Weak hand - avoid unless very good price');
  }

  // Add position-specific advice
  if (['UTG', 'UTG1'].includes(position)) {
    recommendations.push('Early position - tighten range');
  } else if (['CO', 'BTN'].includes(position)) {
    recommendations.push('Late position - can play wider');
  }

  return recommendations;
}

function getHandPlayability(holeCards: Card[], position: string, opponents: number): any {
  const strength = getPreflopStrength(holeCards);
  const category = getPreflopCategory(holeCards);

  return {
    strength,
    category,
    multiway: category.includes('CONNECTOR') || category.includes('SUITED'),
    headsUp: strength >= 6,
    position: getPositionalAdvantage(position).strength,
    overall: Math.min(10, (strength + getPositionalAdvantage(position).strength) / 2)
  };
}

function calculatePotOdds(potSize: number, betSize: number): any {
  const odds = betSize / (potSize + betSize);
  const ratio = `${betSize}:${potSize}`;
  const percentage = Math.round(odds * 100);

  return {
    decimal: odds,
    percentage,
    ratio,
    breakeven: percentage
  };
}

function getHandDescription(cards: Card[]): string {
  const [card1, card2] = cards;

  if (card1.rank === card2.rank) {
    return card1.rank + card2.rank;
  }

  const suited = card1.suit === card2.suit ? 's' : 'o';
  const ranks = [card1.rank, card2.rank].sort((a, b) => {
    const order = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
    return order.indexOf(a) - order.indexOf(b);
  });

  return ranks[0] + ranks[1] + suited;
}

function hasCardConflicts(cards: Card[]): boolean {
  const cardStrings = cards.map(c => c.rank + c.suit);
  return cardStrings.length !== new Set(cardStrings).size;
}

function getStrengthDescription(rank: number): string {
  const descriptions = {
    10: 'NUTS - Royal Flush',
    9: 'MONSTER - Straight Flush',
    8: 'VERY_STRONG - Four of a Kind',
    7: 'STRONG - Full House',
    6: 'GOOD - Flush',
    5: 'DECENT - Straight',
    4: 'MARGINAL - Three of a Kind',
    3: 'WEAK - Two Pair',
    2: 'VERY_WEAK - Pair',
    1: 'TRASH - High Card'
  };

  return descriptions[rank] || 'UNKNOWN';
}

function getHandPercentile(rank: number): number {
  // Simplified percentile calculation
  return Math.min(99, rank * 10);
}

function isNuts(cards: Card[], evaluation: any): boolean {
  // Simplified nuts calculation
  return evaluation.rank >= 9;
}

function getDominanceLevel(equity: number): string {
  const advantage = Math.abs(equity - 0.5);
  if (advantage < 0.1) return 'CLOSE';
  if (advantage < 0.2) return 'SLIGHT';
  if (advantage < 0.3) return 'MODERATE';
  if (advantage < 0.4) return 'STRONG';
  return 'DOMINATING';
}

function getStartingHandRankings(category: string, limit: number): any {
  // Simplified starting hand rankings
  const allHands = [
    { hand: 'AA', strength: 10, category: 'PREMIUM' },
    { hand: 'KK', strength: 9.9, category: 'PREMIUM' },
    { hand: 'QQ', strength: 9.7, category: 'PREMIUM' },
    { hand: 'JJ', strength: 9.5, category: 'PREMIUM' },
    { hand: 'AKs', strength: 9.3, category: 'PREMIUM' },
    { hand: 'AKo', strength: 9.0, category: 'STRONG' },
    { hand: 'TT', strength: 8.8, category: 'STRONG' },
    { hand: 'AQs', strength: 8.5, category: 'STRONG' },
    { hand: 'AQo', strength: 8.2, category: 'STRONG' },
    { hand: '99', strength: 8.0, category: 'STRONG' }
    // ... more hands would be added in production
  ];

  let filtered = allHands;
  if (category !== 'all') {
    filtered = allHands.filter(h => h.category.toLowerCase() === category.toLowerCase());
  }

  return {
    hands: filtered.slice(0, limit),
    category,
    total: filtered.length,
    description: `Top ${Math.min(limit, filtered.length)} starting hands`
  };
}

function getPreflopOdds(scenario: any): any {
  return {
    pocketPairs: '5.9%',
    aceSomething: '14.9%',
    suited: '23.5%',
    connected: '15.7%'
  };
}

function getDrawOdds(scenario: any): any {
  return {
    flushDraw: '35%',
    straightDraw: '31%',
    gutshot: '17%',
    twoOvercards: '24%'
  };
}

function getImprovementOdds(scenario: any): any {
  return {
    pairToTrips: '11%',
    pairToTwoPair: '17%',
    overcardHit: '13%'
  };
}

export default router;