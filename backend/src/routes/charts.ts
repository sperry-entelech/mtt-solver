import express from 'express';
import Joi from 'joi';
import { asyncHandler, validateBody, createError } from '../middleware/errorHandler';
import { ICMCalculator } from '../services/icmCalculator';
import { RangeAnalyzer } from '../services/rangeAnalyzer';
import { CacheService } from '../config/database';
import { PerformanceLogger } from '../utils/logger';
import { Position } from '../types';

const router = express.Router();

// Validation schemas
const pushFoldChartSchema = Joi.object({
  stackSizes: Joi.array().items(Joi.number().min(1).max(100)).default([5, 8, 10, 12, 15, 20]),
  opponents: Joi.number().min(1).max(9).default(1),
  payouts: Joi.array().items(Joi.number().min(0)).required(),
  blindStructure: Joi.object({
    smallBlind: Joi.number().min(1).default(1),
    bigBlind: Joi.number().min(1).default(2),
    ante: Joi.number().min(0).default(0)
  }),
  position: Joi.string().valid(...Object.values(Position)).required()
});

const customChartSchema = Joi.object({
  chartType: Joi.string().valid('OPENING', 'CALLING', 'PUSHING', 'DEFENDING').required(),
  parameters: Joi.object({
    stackDepth: Joi.string().valid('SHALLOW', 'MEDIUM', 'DEEP').default('MEDIUM'),
    opponents: Joi.number().min(1).max(9).default(1),
    position: Joi.string().valid(...Object.values(Position)).required(),
    aggression: Joi.string().valid('TIGHT', 'STANDARD', 'LOOSE').default('STANDARD'),
    icmPressure: Joi.string().valid('LOW', 'MEDIUM', 'HIGH').default('MEDIUM')
  }).required()
});

// GET /api/charts/push-fold - Generate push/fold charts
router.get('/push-fold', asyncHandler(async (req, res) => {
  const {
    stackSizes = [5, 8, 10, 12, 15, 20],
    opponents = 1,
    position = 'BTN',
    payouts = [50, 30, 20]
  } = req.query;

  const cacheKey = `pushfold-chart:${JSON.stringify({ stackSizes, opponents, position, payouts })}`;
  const cached = await CacheService.get(cacheKey);

  if (cached) {
    return res.json({
      success: true,
      data: cached,
      cached: true
    });
  }

  const perf = new PerformanceLogger('Push/fold chart generation');

  try {
    const charts = await generatePushFoldCharts({
      stackSizes: Array.isArray(stackSizes) ? stackSizes.map(Number) : [stackSizes].map(Number),
      opponents: Number(opponents),
      position: position as Position,
      payouts: Array.isArray(payouts) ? payouts.map(Number) : [payouts].map(Number)
    });

    await CacheService.set(cacheKey, charts, 7200); // 2 hours cache
    perf.end();

    res.json({
      success: true,
      data: charts
    });

  } catch (error) {
    throw createError.internal(`Push/fold chart generation failed: ${error.message}`);
  }
}));

// POST /api/charts/custom - Generate custom strategy charts
router.post('/custom', validateBody(customChartSchema), asyncHandler(async (req, res) => {
  const perf = new PerformanceLogger('Custom chart generation');
  const { chartType, parameters } = req.body;

  const cacheKey = `custom-chart:${JSON.stringify(req.body)}`;
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
    let chart;

    switch (chartType) {
      case 'OPENING':
        chart = generateOpeningChart(parameters);
        break;
      case 'CALLING':
        chart = generateCallingChart(parameters);
        break;
      case 'PUSHING':
        chart = generatePushingChart(parameters);
        break;
      case 'DEFENDING':
        chart = generateDefendingChart(parameters);
        break;
      default:
        throw createError.badRequest('Invalid chart type');
    }

    await CacheService.set(cacheKey, chart, 3600); // 1 hour cache
    perf.end();

    res.json({
      success: true,
      data: chart
    });

  } catch (error) {
    throw createError.internal(`Custom chart generation failed: ${error.message}`);
  }
}));

// GET /api/charts/preflop-grid - Generate preflop grid chart
router.get('/preflop-grid', asyncHandler(async (req, res) => {
  const { position = 'BTN', action = 'OPEN', stackDepth = 'MEDIUM' } = req.query;

  const cacheKey = `preflop-grid:${position}:${action}:${stackDepth}`;
  const cached = await CacheService.get(cacheKey);

  if (cached) {
    return res.json({
      success: true,
      data: cached,
      cached: true
    });
  }

  try {
    const grid = generatePreflopGrid(
      position as Position,
      action as string,
      stackDepth as string
    );

    await CacheService.set(cacheKey, grid, 7200); // 2 hours cache

    res.json({
      success: true,
      data: grid
    });

  } catch (error) {
    throw createError.internal(`Preflop grid generation failed: ${error.message}`);
  }
}));

// GET /api/charts/icm-pressure - Generate ICM pressure chart
router.get('/icm-pressure', asyncHandler(async (req, res) => {
  const {
    totalPlayers = 100,
    currentPlayers = 10,
    payoutStructure = 'STANDARD'
  } = req.query;

  const cacheKey = `icm-pressure:${totalPlayers}:${currentPlayers}:${payoutStructure}`;
  const cached = await CacheService.get(cacheKey);

  if (cached) {
    return res.json({
      success: true,
      data: cached,
      cached: true
    });
  }

  try {
    const chart = generateICMPressureChart({
      totalPlayers: Number(totalPlayers),
      currentPlayers: Number(currentPlayers),
      payoutStructure: payoutStructure as string
    });

    await CacheService.set(cacheKey, chart, 3600); // 1 hour cache

    res.json({
      success: true,
      data: chart
    });

  } catch (error) {
    throw createError.internal(`ICM pressure chart generation failed: ${error.message}`);
  }
}));

// Helper functions
async function generatePushFoldCharts(params: any): Promise<any> {
  const { stackSizes, opponents, position, payouts } = params;
  const charts: any = {};

  for (const stackSize of stackSizes) {
    const pushRange = ICMCalculator.calculateOptimalPushingRange(
      stackSize * 2, // Convert BB to chips (assuming 2 chip BB)
      Array(opponents).fill(stackSize * 2),
      2, // Big blind
      0, // Ante
      position,
      payouts
    );

    // Calculate calling range against different opponent ranges
    const callingRange = calculateCallingRange(stackSize, opponents, payouts);

    charts[`${stackSize}BB`] = {
      stackSize,
      pushRange,
      callingRange,
      rangeSize: pushRange.length,
      percentage: Math.round((pushRange.length / 1326) * 1000) / 10,
      description: `Optimal ranges for ${stackSize}BB stack`
    };
  }

  return {
    charts,
    position,
    opponents,
    payouts,
    metadata: {
      generated: new Date().toISOString(),
      description: 'Push/fold charts optimized for ICM',
      assumptions: [
        'Opponents play optimally',
        'ICM considerations included',
        'No reads or exploitative adjustments'
      ]
    }
  };
}

function generateOpeningChart(parameters: any): any {
  const { stackDepth, position, aggression, icmPressure } = parameters;

  const baseRange = RangeAnalyzer.getPositionalRange(position, 'open');
  let adjustedRange = [...baseRange.hands];

  // Adjust for stack depth
  if (stackDepth === 'SHALLOW') {
    adjustedRange = tightenRange(adjustedRange, 0.8);
  } else if (stackDepth === 'DEEP') {
    adjustedRange = loosenRange(adjustedRange, 1.2);
  }

  // Adjust for aggression
  if (aggression === 'TIGHT') {
    adjustedRange = tightenRange(adjustedRange, 0.85);
  } else if (aggression === 'LOOSE') {
    adjustedRange = loosenRange(adjustedRange, 1.15);
  }

  // Adjust for ICM pressure
  if (icmPressure === 'HIGH') {
    adjustedRange = tightenRange(adjustedRange, 0.75);
  } else if (icmPressure === 'LOW') {
    adjustedRange = loosenRange(adjustedRange, 1.1);
  }

  return {
    chartType: 'OPENING',
    parameters,
    range: adjustedRange,
    rangeString: RangeAnalyzer.handsToRangeString(adjustedRange),
    handCount: adjustedRange.length,
    percentage: Math.round((adjustedRange.length / 1326) * 1000) / 10,
    grid: convertToGrid(adjustedRange),
    notes: generateRangeNotes('OPENING', parameters)
  };
}

function generateCallingChart(parameters: any): any {
  const { stackDepth, position, aggression, icmPressure } = parameters;

  const baseRange = RangeAnalyzer.getPositionalRange(position, 'call');
  let adjustedRange = [...baseRange.hands];

  // Similar adjustments as opening chart but generally tighter
  if (stackDepth === 'SHALLOW') {
    adjustedRange = tightenRange(adjustedRange, 0.9);
  }

  if (icmPressure === 'HIGH') {
    adjustedRange = tightenRange(adjustedRange, 0.8);
  }

  return {
    chartType: 'CALLING',
    parameters,
    range: adjustedRange,
    rangeString: RangeAnalyzer.handsToRangeString(adjustedRange),
    handCount: adjustedRange.length,
    percentage: Math.round((adjustedRange.length / 1326) * 1000) / 10,
    grid: convertToGrid(adjustedRange),
    notes: generateRangeNotes('CALLING', parameters)
  };
}

function generatePushingChart(parameters: any): any {
  const { stackDepth, position, opponents, icmPressure } = parameters;

  // For shallow stacks, pushing becomes more relevant
  const stackSizeInBB = stackDepth === 'SHALLOW' ? 8 : stackDepth === 'MEDIUM' ? 15 : 25;

  const pushRange = ICMCalculator.calculateOptimalPushingRange(
    stackSizeInBB * 2,
    Array(opponents).fill(stackSizeInBB * 2),
    2,
    0,
    position,
    [50, 30, 20] // Default payout structure
  );

  return {
    chartType: 'PUSHING',
    parameters,
    range: pushRange,
    rangeString: RangeAnalyzer.handsToRangeString(pushRange),
    handCount: pushRange.length,
    percentage: Math.round((pushRange.length / 1326) * 1000) / 10,
    grid: convertToGrid(pushRange),
    stackSizeInBB,
    notes: generateRangeNotes('PUSHING', parameters)
  };
}

function generateDefendingChart(parameters: any): any {
  const { position, icmPressure } = parameters;

  // Defending ranges are typically tighter than opening ranges
  const baseRange = RangeAnalyzer.getPositionalRange(position, 'call');
  let defendingRange = tightenRange(baseRange.hands, 0.85);

  if (icmPressure === 'HIGH') {
    defendingRange = tightenRange(defendingRange, 0.8);
  }

  return {
    chartType: 'DEFENDING',
    parameters,
    range: defendingRange,
    rangeString: RangeAnalyzer.handsToRangeString(defendingRange),
    handCount: defendingRange.length,
    percentage: Math.round((defendingRange.length / 1326) * 1000) / 10,
    grid: convertToGrid(defendingRange),
    notes: generateRangeNotes('DEFENDING', parameters)
  };
}

function generatePreflopGrid(position: Position, action: string, stackDepth: string): any {
  const range = RangeAnalyzer.getPositionalRange(position, action as any);

  const grid = createHandGrid();
  const handsInRange = new Set(range.hands);

  // Color code the grid
  for (const hand of Object.keys(grid)) {
    if (handsInRange.has(hand)) {
      grid[hand].action = action.toUpperCase();
      grid[hand].inRange = true;
    }
  }

  return {
    position,
    action,
    stackDepth,
    grid,
    range: range.hands,
    statistics: {
      totalHands: range.hands.length,
      percentage: Math.round((range.hands.length / 1326) * 1000) / 10,
      vpip: calculateVPIP(range.hands),
      pfr: calculatePFR(range.hands, action)
    }
  };
}

function generateICMPressureChart(params: any): any {
  const { totalPlayers, currentPlayers, payoutStructure } = params;

  const payouts = generatePayoutStructure(totalPlayers, payoutStructure);
  const bubbleFactors: any = {};

  // Calculate bubble factors for different stack distributions
  const stackDistributions = [
    'EVEN', 'TOP_HEAVY', 'BOTTOM_HEAVY', 'POLARIZED'
  ];

  for (const distribution of stackDistributions) {
    const stacks = generateStackDistribution(currentPlayers, distribution);
    const factors = stacks.map((_, index) =>
      ICMCalculator.calculateBubbleFactor(stacks, payouts.slice(0, currentPlayers), index)
    );

    bubbleFactors[distribution] = {
      stacks,
      factors,
      average: factors.reduce((sum, f) => sum + f, 0) / factors.length,
      max: Math.max(...factors),
      min: Math.min(...factors)
    };
  }

  return {
    totalPlayers,
    currentPlayers,
    payoutStructure,
    payouts: payouts.slice(0, currentPlayers),
    bubbleFactors,
    recommendations: generateICMRecommendations(bubbleFactors),
    metadata: {
      generated: new Date().toISOString(),
      description: 'ICM pressure analysis for different stack distributions'
    }
  };
}

// Utility functions
function calculateCallingRange(stackSize: number, opponents: number, payouts: number[]): string[] {
  // Simplified calling range calculation
  const baseCallingRange = ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', 'AKs', 'AKo', 'AQs'];

  if (stackSize <= 8) {
    return [...baseCallingRange, '77', '66', 'AQo', 'AJs', 'KQs'];
  } else if (stackSize <= 12) {
    return [...baseCallingRange, '77', 'AQo', 'AJs'];
  }

  return baseCallingRange;
}

function tightenRange(range: string[], factor: number): string[] {
  const targetSize = Math.floor(range.length * factor);
  return range.slice(0, targetSize);
}

function loosenRange(range: string[], factor: number): string[] {
  // In a real implementation, this would add appropriate hands
  // For now, return the original range
  return range;
}

function convertToGrid(hands: string[]): any {
  const grid = createHandGrid();
  const handsSet = new Set(hands);

  for (const hand of Object.keys(grid)) {
    grid[hand].inRange = handsSet.has(hand);
  }

  return grid;
}

function createHandGrid(): any {
  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  const grid: any = {};

  for (let i = 0; i < ranks.length; i++) {
    for (let j = 0; j < ranks.length; j++) {
      const rank1 = ranks[i];
      const rank2 = ranks[j];

      let hand: string;
      if (i === j) {
        hand = rank1 + rank2; // Pocket pair
      } else if (i < j) {
        hand = rank1 + rank2 + 's'; // Suited
      } else {
        hand = rank2 + rank1 + 'o'; // Offsuit
      }

      grid[hand] = {
        hand,
        row: i,
        col: j,
        inRange: false,
        action: 'FOLD'
      };
    }
  }

  return grid;
}

function generateRangeNotes(chartType: string, parameters: any): string[] {
  const notes: string[] = [];

  notes.push(`${chartType} range for ${parameters.position} position`);

  if (parameters.stackDepth === 'SHALLOW') {
    notes.push('Shallow stack - tightened range due to reduced post-flop play');
  } else if (parameters.stackDepth === 'DEEP') {
    notes.push('Deep stack - can play more speculative hands');
  }

  if (parameters.icmPressure === 'HIGH') {
    notes.push('High ICM pressure - significantly tightened range');
  } else if (parameters.icmPressure === 'LOW') {
    notes.push('Low ICM pressure - can play closer to chip EV');
  }

  if (parameters.aggression === 'TIGHT') {
    notes.push('Conservative approach - playing only premium hands');
  } else if (parameters.aggression === 'LOOSE') {
    notes.push('Aggressive approach - wider range for pressure');
  }

  return notes;
}

function generatePayoutStructure(totalPlayers: number, structure: string): number[] {
  // Simplified payout structure generation
  const payouts: number[] = [];
  const totalPrize = 100; // Percentage

  if (structure === 'STANDARD') {
    const paidPositions = Math.min(Math.floor(totalPlayers * 0.15), 10);
    for (let i = 0; i < paidPositions; i++) {
      const percentage = Math.max(1, Math.floor(totalPrize * Math.pow(0.6, i)));
      payouts.push(percentage);
    }
  }

  return payouts;
}

function generateStackDistribution(players: number, distribution: string): number[] {
  const stacks: number[] = [];
  const baseStack = 100;

  switch (distribution) {
    case 'EVEN':
      return Array(players).fill(baseStack);

    case 'TOP_HEAVY':
      for (let i = 0; i < players; i++) {
        stacks.push(baseStack * (2 - i * 0.2));
      }
      break;

    case 'BOTTOM_HEAVY':
      for (let i = 0; i < players; i++) {
        stacks.push(baseStack * (0.5 + i * 0.2));
      }
      break;

    case 'POLARIZED':
      for (let i = 0; i < players; i++) {
        stacks.push(i % 2 === 0 ? baseStack * 2 : baseStack * 0.5);
      }
      break;
  }

  return stacks;
}

function generateICMRecommendations(bubbleFactors: any): string[] {
  const recommendations: string[] = [];

  const avgPressure = Object.values(bubbleFactors).reduce((sum: number, dist: any) => sum + dist.average, 0) / Object.keys(bubbleFactors).length;

  if (avgPressure > 2.0) {
    recommendations.push('High ICM pressure detected - play very tight');
    recommendations.push('Avoid marginal spots and focus on premium hands');
  } else if (avgPressure > 1.5) {
    recommendations.push('Moderate ICM pressure - some range tightening required');
  } else {
    recommendations.push('Low ICM pressure - can play closer to chip EV');
  }

  return recommendations;
}

function calculateVPIP(hands: string[]): number {
  // VPIP = Voluntarily Put $ In Pot
  return Math.round((hands.length / 1326) * 100);
}

function calculatePFR(hands: string[], action: string): number {
  // PFR = Pre-Flop Raise
  if (action === 'OPEN') {
    return Math.round((hands.length / 1326) * 100);
  }
  return Math.round((hands.length / 1326) * 80); // Simplified
}

export default router;