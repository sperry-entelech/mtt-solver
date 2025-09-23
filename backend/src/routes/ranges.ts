import express from 'express';
import Joi from 'joi';
import { asyncHandler, validateBody, createError } from '../middleware/errorHandler';
import { RangeAnalyzer } from '../services/rangeAnalyzer';
import { CacheService } from '../config/database';
import { PerformanceLogger } from '../utils/logger';
import { Position } from '../types';

const router = express.Router();

// Validation schemas
const parseRangeSchema = Joi.object({
  rangeString: Joi.string().required(),
  format: Joi.string().valid('array', 'string').default('array')
});

const equityCalculationSchema = Joi.object({
  range1: Joi.array().items(Joi.string()).min(1).required(),
  range2: Joi.array().items(Joi.string()).min(1).required(),
  board: Joi.array().items(Joi.object({
    rank: Joi.string().valid('A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2').required(),
    suit: Joi.string().valid('s', 'h', 'd', 'c').required()
  })).max(5).default([]),
  iterations: Joi.number().min(100).max(10000).default(1000)
});

// GET /api/ranges/:position - Get optimal ranges for position
router.get('/:position', asyncHandler(async (req, res) => {
  const { position } = req.params;
  const { action = 'open' } = req.query;

  if (!Object.values(Position).includes(position as Position)) {
    throw createError.badRequest('Invalid position');
  }

  if (!['open', 'call', 'push'].includes(action as string)) {
    throw createError.badRequest('Invalid action. Must be open, call, or push');
  }

  const cacheKey = `range:${position}:${action}`;
  const cached = await CacheService.get(cacheKey);

  if (cached) {
    return res.json({
      success: true,
      data: cached,
      cached: true
    });
  }

  try {
    const range = RangeAnalyzer.getPositionalRange(
      position as Position,
      action as 'open' | 'call' | 'push'
    );

    // Add additional analysis
    const analysis = {
      ...range,
      handCount: range.hands.length,
      percentage: Math.round((range.hands.length / 1326) * 1000) / 10, // Total possible hands
      categories: categorizeHands(range.hands),
      tightness: getTightnessRating(range.hands.length)
    };

    await CacheService.set(cacheKey, analysis, 7200); // 2 hours cache

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    throw createError.internal(`Range analysis failed: ${error.message}`);
  }
}));

// POST /api/ranges/parse - Parse range string into hands
router.post('/parse', validateBody(parseRangeSchema), asyncHandler(async (req, res) => {
  const perf = new PerformanceLogger('Range parsing');
  const { rangeString, format } = req.body;

  const cacheKey = `parse:${rangeString}:${format}`;
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
    const hands = RangeAnalyzer.parseRangeString(rangeString);

    const result = {
      originalString: rangeString,
      hands: hands,
      handCount: hands.length,
      percentage: Math.round((hands.length / 1326) * 1000) / 10,
      categories: categorizeHands(hands),
      compactString: format === 'string' ? RangeAnalyzer.handsToRangeString(hands) : undefined
    };

    await CacheService.set(cacheKey, result, 3600); // 1 hour cache
    perf.end();

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    throw createError.badRequest(`Invalid range string: ${error.message}`);
  }
}));

// POST /api/ranges/equity - Calculate range vs range equity
router.post('/equity', validateBody(equityCalculationSchema), asyncHandler(async (req, res) => {
  const perf = new PerformanceLogger('Range equity calculation');
  const { range1, range2, board, iterations } = req.body;

  const cacheKey = `equity:${JSON.stringify({ range1, range2, board, iterations })}`;
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
    const result = RangeAnalyzer.calculateRangeEquity(range1, range2, board, iterations);

    const analysis = {
      ...result,
      range1Info: {
        hands: range1,
        handCount: range1.length,
        percentage: Math.round((range1.length / 1326) * 1000) / 10
      },
      range2Info: {
        hands: range2,
        handCount: range2.length,
        percentage: Math.round((range2.length / 1326) * 1000) / 10
      },
      boardInfo: {
        cards: board,
        texture: analyzeBoardTexture(board)
      },
      summary: {
        favorite: result.range1Equity > result.range2Equity ? 'Range 1' : 'Range 2',
        equityDifference: Math.abs(result.range1Equity - result.range2Equity),
        closeness: getEquityCloseness(result.range1Equity, result.range2Equity)
      }
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

// GET /api/ranges/preflop-charts - Get comprehensive preflop charts
router.get('/preflop-charts', asyncHandler(async (req, res) => {
  const { stackDepth = 'medium' } = req.query;

  const cacheKey = `preflop-charts:${stackDepth}`;
  const cached = await CacheService.get(cacheKey);

  if (cached) {
    return res.json({
      success: true,
      data: cached,
      cached: true
    });
  }

  try {
    const charts = generatePreflopCharts(stackDepth as string);
    await CacheService.set(cacheKey, charts, 7200); // 2 hours cache

    res.json({
      success: true,
      data: charts
    });

  } catch (error) {
    throw createError.internal(`Chart generation failed: ${error.message}`);
  }
}));

// POST /api/ranges/combos - Calculate hand combinations
router.post('/combos', asyncHandler(async (req, res) => {
  const { hands, deadCards = [] } = req.body;

  if (!Array.isArray(hands)) {
    throw createError.badRequest('Hands must be an array');
  }

  try {
    const combos = calculateCombinations(hands, deadCards);

    res.json({
      success: true,
      data: {
        totalCombos: combos.total,
        breakdown: combos.breakdown,
        deadCards,
        availableCombos: combos.available
      }
    });

  } catch (error) {
    throw createError.internal(`Combination calculation failed: ${error.message}`);
  }
}));

// Helper functions
function categorizeHands(hands: string[]): any {
  const categories = {
    pocketPairs: hands.filter(h => h.length === 2 && h[0] === h[1]),
    suitedConnectors: hands.filter(h => h.endsWith('s') && isConnector(h)),
    suitedAces: hands.filter(h => h.startsWith('A') && h.endsWith('s') && h.length === 3),
    offsuitBroadways: hands.filter(h => h.endsWith('o') && isBroadway(h)),
    suited: hands.filter(h => h.endsWith('s') && h.length === 3),
    offsuit: hands.filter(h => h.endsWith('o')),
    others: []
  };

  // Calculate others
  const categorized = [
    ...categories.pocketPairs,
    ...categories.suitedConnectors,
    ...categories.suitedAces,
    ...categories.offsuitBroadways,
    ...categories.suited,
    ...categories.offsuit
  ];

  categories.others = hands.filter(h => !categorized.includes(h));

  return {
    pocketPairs: { hands: categories.pocketPairs, count: categories.pocketPairs.length },
    suitedConnectors: { hands: categories.suitedConnectors, count: categories.suitedConnectors.length },
    suitedAces: { hands: categories.suitedAces, count: categories.suitedAces.length },
    offsuitBroadways: { hands: categories.offsuitBroadways, count: categories.offsuitBroadways.length },
    others: { hands: categories.others, count: categories.others.length }
  };
}

function isConnector(hand: string): boolean {
  if (hand.length !== 3) return false;
  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  const rank1Index = ranks.indexOf(hand[0]);
  const rank2Index = ranks.indexOf(hand[1]);
  return Math.abs(rank1Index - rank2Index) === 1;
}

function isBroadway(hand: string): boolean {
  const broadwayRanks = ['A', 'K', 'Q', 'J', 'T'];
  return broadwayRanks.includes(hand[0]) && broadwayRanks.includes(hand[1]);
}

function getTightnessRating(handCount: number): string {
  if (handCount <= 60) return 'VERY_TIGHT';
  if (handCount <= 120) return 'TIGHT';
  if (handCount <= 200) return 'MEDIUM';
  if (handCount <= 300) return 'LOOSE';
  return 'VERY_LOOSE';
}

function analyzeBoardTexture(board: any[]): string {
  if (board.length === 0) return 'PREFLOP';
  if (board.length < 3) return 'INCOMPLETE';

  // Simplified board texture analysis
  const suits = board.map(card => card.suit);
  const ranks = board.map(card => card.rank);

  const isFlushDraw = suits.filter(suit => suit === suits[0]).length >= 2;
  const isStraightDraw = checkStraightDraw(ranks);

  if (isFlushDraw && isStraightDraw) return 'WET';
  if (isFlushDraw || isStraightDraw) return 'SEMI_WET';
  return 'DRY';
}

function checkStraightDraw(ranks: string[]): boolean {
  const rankValues = ranks.map(rank => {
    const rankMap: { [key: string]: number } = {
      'A': 14, 'K': 13, 'Q': 12, 'J': 11, 'T': 10,
      '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
    };
    return rankMap[rank];
  }).sort((a, b) => b - a);

  // Check for gaps
  for (let i = 0; i < rankValues.length - 1; i++) {
    if (rankValues[i] - rankValues[i + 1] <= 2) return true;
  }

  return false;
}

function getEquityCloseness(equity1: number, equity2: number): string {
  const diff = Math.abs(equity1 - equity2);
  if (diff <= 0.05) return 'VERY_CLOSE';
  if (diff <= 0.10) return 'CLOSE';
  if (diff <= 0.20) return 'MODERATE';
  return 'WIDE';
}

function generatePreflopCharts(stackDepth: string): any {
  // Simplified preflop charts - in production would be more comprehensive
  const charts = {
    UTG: {
      open: 'AA-77, AKs-ATs, AKo-AQo, KQs',
      call: 'AA-99, AKs-AJs, AKo-AQo, KQs',
      push: 'AA-55, AKs-A9s, AKo-AJo, KQs-KJs'
    },
    MP: {
      open: 'AA-55, AKs-A8s, AKo-ATo, KQs-KTs, QJs',
      call: 'AA-77, AKs-ATs, AKo-AQo, KQs-KJs, QJs',
      push: 'AA-44, AKs-A8s, AKo-ATo, KQs-KTs, QJs-QTs'
    },
    CO: {
      open: 'AA-33, AKs-A5s, AKo-A8o, KQs-K8s, QJs-Q8s, JTs-J8s',
      call: 'AA-66, AKs-A9s, AKo-ATo, KQs-KTs, QJs-QTs, JTs',
      push: 'AA-22, AKs-A6s, AKo-A9o, KQs-K9s, QJs-Q9s, JTs-J9s'
    },
    BTN: {
      open: 'AA-22, AKs-A2s, AKo-A7o, KQs-K7s, QJs-Q7s, JTs-J7s, T9s-T7s',
      call: 'AA-55, AKs-A8s, AKo-A9o, KQs-K9s, QJs-Q9s, JTs-J8s, T9s',
      push: 'AA-22, AKs-A4s, AKo-A8o, KQs-K8s, QJs-Q8s, JTs-J8s, T9s-T8s'
    }
  };

  return {
    stackDepth,
    charts,
    description: `Preflop ranges for ${stackDepth} stack depth`,
    notes: [
      'Ranges are position-dependent',
      'Adjust based on opponent tendencies',
      'ICM considerations may require tightening',
      'These are baseline ranges for unexploitative play'
    ]
  };
}

function calculateCombinations(hands: string[], deadCards: any[]): any {
  // Simplified combination calculation
  let total = 0;
  const breakdown: any = {};

  for (const hand of hands) {
    let combos = 0;

    if (hand.length === 2 && hand[0] === hand[1]) {
      // Pocket pair
      combos = 6; // 4 choose 2 combinations
    } else if (hand.endsWith('s')) {
      // Suited hand
      combos = 4; // One combination per suit
    } else if (hand.endsWith('o')) {
      // Offsuit hand
      combos = 12; // 4 * 3 combinations
    }

    // Reduce by dead cards (simplified)
    const deadReduction = deadCards.length * 0.1; // Simplified calculation
    combos = Math.max(0, combos - deadReduction);

    breakdown[hand] = combos;
    total += combos;
  }

  return {
    total: Math.round(total),
    breakdown,
    available: Math.round(total)
  };
}

export default router;