import express from 'express';
import Joi from 'joi';
import { asyncHandler, validateBody, createError } from '../middleware/errorHandler';
import { ICMCalculator } from '../services/icmCalculator';
import { CacheService } from '../config/database';
import { PerformanceLogger } from '../utils/logger';

const router = express.Router();

// Validation schemas
const icmCalculateSchema = Joi.object({
  stacks: Joi.array().items(Joi.number().min(1)).min(2).max(10).required(),
  payouts: Joi.array().items(Joi.number().min(0)).min(1).required(),
  playerIndex: Joi.number().min(0).default(0)
});

const bubbleFactorSchema = Joi.object({
  stacks: Joi.array().items(Joi.number().min(1)).min(2).max(10).required(),
  payouts: Joi.array().items(Joi.number().min(0)).min(1).required(),
  playerIndex: Joi.number().min(0).default(0)
});

const pushFoldEVSchema = Joi.object({
  heroStack: Joi.number().min(1).required(),
  villainStack: Joi.number().min(1).required(),
  blinds: Joi.number().min(1).required(),
  antes: Joi.number().min(0).default(0),
  callingRange: Joi.number().min(0).max(1).default(0.3),
  foldEquity: Joi.number().min(0).max(1).default(0.7)
});

// POST /api/icm/calculate - Calculate ICM equity
router.post('/calculate', validateBody(icmCalculateSchema), asyncHandler(async (req, res) => {
  const perf = new PerformanceLogger('ICM calculation');
  const { stacks, payouts, playerIndex } = req.body;

  // Generate cache key
  const cacheKey = `icm:${JSON.stringify({ stacks, payouts, playerIndex })}`;

  // Check cache
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
    if (playerIndex >= stacks.length) {
      throw createError.badRequest('Player index out of range');
    }

    const result = ICMCalculator.calculateICM(stacks, payouts, playerIndex);

    // Calculate additional metrics
    const totalChips = stacks.reduce((sum, stack) => sum + stack, 0);
    const totalPayout = payouts.reduce((sum, payout) => sum + payout, 0);
    const chipPercentage = stacks[playerIndex] / totalChips;

    const analysis = {
      ...result,
      chipPercentage,
      totalPayout,
      equityPercentage: (result.equity / totalPayout) * 100,
      riskPremiumPercentage: (result.riskPremium / totalPayout) * 100,
      position: stacks
        .map((stack, index) => ({ stack, index }))
        .sort((a, b) => b.stack - a.stack)
        .findIndex(item => item.index === playerIndex) + 1
    };

    // Cache for 30 minutes
    await CacheService.set(cacheKey, analysis, 1800);

    perf.end();

    res.json({
      success: true,
      data: analysis,
      metadata: {
        players: stacks.length,
        payoutPositions: payouts.length,
        inMoney: stacks.length <= payouts.length
      }
    });

  } catch (error) {
    throw createError.internal(`ICM calculation failed: ${error.message}`);
  }
}));

// POST /api/icm/bubble-factor - Calculate bubble factor
router.post('/bubble-factor', validateBody(bubbleFactorSchema), asyncHandler(async (req, res) => {
  const perf = new PerformanceLogger('Bubble factor calculation');
  const { stacks, payouts, playerIndex } = req.body;

  const cacheKey = `bubble:${JSON.stringify(req.body)}`;
  const cached = await CacheService.get(cacheKey);

  if (cached) {
    perf.end();
    return res.json({ success: true, data: cached, cached: true });
  }

  try {
    const bubbleFactor = ICMCalculator.calculateBubbleFactor(stacks, payouts, playerIndex);
    const icmResult = ICMCalculator.calculateICM(stacks, payouts, playerIndex);

    const totalChips = stacks.reduce((sum, stack) => sum + stack, 0);
    const totalPayout = payouts.reduce((sum, payout) => sum + payout, 0);

    const analysis = {
      bubbleFactor,
      icmEquity: icmResult.equity,
      chipEquity: (stacks[playerIndex] / totalChips) * totalPayout,
      riskPremium: icmResult.riskPremium,
      interpretation: getBubbleFactorInterpretation(bubbleFactor),
      recommendations: getBubbleRecommendations(bubbleFactor, stacks.length, payouts.length)
    };

    await CacheService.set(cacheKey, analysis, 1800);
    perf.end();

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    throw createError.internal(`Bubble factor calculation failed: ${error.message}`);
  }
}));

// POST /api/icm/push-fold-ev - Calculate push/fold expected value
router.post('/push-fold-ev', validateBody(pushFoldEVSchema), asyncHandler(async (req, res) => {
  const perf = new PerformanceLogger('Push/fold EV calculation');
  const { heroStack, villainStack, blinds, antes, callingRange, foldEquity } = req.body;

  const cacheKey = `pushfold-ev:${JSON.stringify(req.body)}`;
  const cached = await CacheService.get(cacheKey);

  if (cached) {
    perf.end();
    return res.json({ success: true, data: cached, cached: true });
  }

  try {
    const result = ICMCalculator.calculatePushFoldEquity(
      heroStack,
      villainStack,
      blinds,
      antes,
      callingRange,
      foldEquity
    );

    const effectiveStack = Math.min(heroStack, villainStack);
    const stackInBB = heroStack / (blinds / 3); // Assuming blinds parameter is total blinds

    const analysis = {
      ...result,
      recommendation: result.pushEV > result.foldEV ? 'PUSH' : 'FOLD',
      evDifference: result.pushEV - result.foldEV,
      effectiveStack,
      stackInBB: Math.round(stackInBB * 10) / 10,
      profitability: result.pushEV > 0 ? 'PROFITABLE' : 'UNPROFITABLE',
      confidence: calculateConfidence(result.pushEV, result.foldEV, foldEquity)
    };

    await CacheService.set(cacheKey, analysis, 3600); // 1 hour cache
    perf.end();

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    throw createError.internal(`Push/fold EV calculation failed: ${error.message}`);
  }
}));

// GET /api/icm/scenarios - Get common ICM scenarios and solutions
router.get('/scenarios', asyncHandler(async (req, res) => {
  const commonScenarios = [
    {
      name: 'Bubble Play - 4 players, 3 paid',
      stacks: [100, 80, 60, 40],
      payouts: [50, 30, 20],
      description: 'Classic bubble situation with clear big stack advantage',
      bubbleFactors: [1.2, 1.5, 2.1, 3.2]
    },
    {
      name: 'Final Table - 3 players',
      stacks: [150, 100, 50],
      payouts: [60, 25, 15],
      description: 'Final three with significant ICM implications',
      bubbleFactors: [1.1, 1.4, 2.8]
    },
    {
      name: 'Early ITM - 6 players, all paid',
      stacks: [200, 150, 100, 75, 50, 25],
      payouts: [40, 25, 15, 10, 6, 4],
      description: 'Just made the money, ladder considerations',
      bubbleFactors: [1.0, 1.1, 1.3, 1.6, 2.2, 3.5]
    }
  ];

  res.json({
    success: true,
    data: commonScenarios,
    tips: [
      'Higher bubble factors indicate more ICM pressure',
      'Short stacks should play tighter in bubble situations',
      'Big stacks can apply pressure but should avoid unnecessary risks',
      'Medium stacks are often in the most difficult spots'
    ]
  });
}));

// Helper functions
function getBubbleFactorInterpretation(bubbleFactor: number): string {
  if (bubbleFactor >= 3.0) return 'EXTREME ICM pressure - play very tight';
  if (bubbleFactor >= 2.0) return 'HIGH ICM pressure - significant tightening required';
  if (bubbleFactor >= 1.5) return 'MODERATE ICM pressure - some adjustments needed';
  if (bubbleFactor >= 1.2) return 'MILD ICM pressure - minor adjustments';
  return 'LOW ICM pressure - close to chip EV';
}

function getBubbleRecommendations(
  bubbleFactor: number,
  totalPlayers: number,
  paidPositions: number
): string[] {
  const recommendations: string[] = [];

  if (bubbleFactor >= 2.0) {
    recommendations.push('Avoid marginal spots');
    recommendations.push('Fold hands you would normally call with');
    recommendations.push('Do not chase draws without strong pot odds');
  }

  if (totalPlayers === paidPositions + 1) {
    recommendations.push('This is the bubble - extreme caution required');
    recommendations.push('Only play premium hands');
  }

  if (bubbleFactor < 1.3) {
    recommendations.push('Can play closer to chip EV');
    recommendations.push('Take profitable spots');
  }

  return recommendations;
}

function calculateConfidence(pushEV: number, foldEV: number, foldEquity: number): number {
  const evDiff = Math.abs(pushEV - foldEV);
  const baseConfidence = Math.min(evDiff * 10, 0.9); // Scale EV difference to confidence

  // Adjust based on fold equity
  const foldEquityAdjustment = foldEquity > 0.8 ? 0.1 : foldEquity < 0.5 ? -0.1 : 0;

  return Math.max(0.5, Math.min(0.95, baseConfidence + foldEquityAdjustment));
}

export default router;