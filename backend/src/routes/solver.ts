import express from 'express';
import Joi from 'joi';
import { asyncHandler, validateBody, createError } from '../middleware/errorHandler';
import { ICMCalculator } from '../services/icmCalculator';
import { RangeAnalyzer } from '../services/rangeAnalyzer';
import { HandEvaluator } from '../services/handEvaluator';
import { CacheService } from '../config/database';
import { PerformanceLogger } from '../utils/logger';
import { Scenario, SolverResult, Position, Action, Card } from '../types';

const router = express.Router();

// Validation schemas
const solveScenarioSchema = Joi.object({
  players: Joi.array().items(Joi.object({
    id: Joi.string().required(),
    position: Joi.string().valid(...Object.values(Position)).required(),
    stack: Joi.number().min(0).required(),
    isAlive: Joi.boolean().required(),
    range: Joi.object({
      rangeString: Joi.string().required(),
      hands: Joi.array().items(Joi.string())
    }).optional()
  })).min(2).max(10).required(),
  currentLevel: Joi.object({
    smallBlind: Joi.number().min(0).required(),
    bigBlind: Joi.number().min(0).required(),
    ante: Joi.number().min(0).required(),
    level: Joi.number().min(1).required()
  }).required(),
  position: Joi.string().valid(...Object.values(Position)).required(),
  heroStack: Joi.number().min(0).required(),
  heroCards: Joi.array().items(Joi.object({
    rank: Joi.string().valid('A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2').required(),
    suit: Joi.string().valid('s', 'h', 'd', 'c').required()
  })).length(2).optional(),
  board: Joi.array().items(Joi.object({
    rank: Joi.string().valid('A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2').required(),
    suit: Joi.string().valid('s', 'h', 'd', 'c').required()
  })).max(5).optional(),
  payouts: Joi.array().items(Joi.number().min(0)).required()
});

const pushFoldSchema = Joi.object({
  heroStack: Joi.number().min(1).required(),
  villainStacks: Joi.array().items(Joi.number().min(1)).min(1).max(9).required(),
  smallBlind: Joi.number().min(1).required(),
  bigBlind: Joi.number().min(1).required(),
  ante: Joi.number().min(0).default(0),
  position: Joi.string().valid(...Object.values(Position)).required(),
  payouts: Joi.array().items(Joi.number().min(0)).required(),
  heroCards: Joi.array().items(Joi.object({
    rank: Joi.string().valid('A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2').required(),
    suit: Joi.string().valid('s', 'h', 'd', 'c').required()
  })).length(2).optional()
});

// POST /api/solve - Solve a specific tournament scenario
router.post('/', validateBody(solveScenarioSchema), asyncHandler(async (req, res) => {
  const perf = new PerformanceLogger('Solve scenario');
  const scenario: Scenario = req.body;

  // Generate cache key
  const cacheKey = `solve:${JSON.stringify(scenario)}`;

  // Check cache first
  const cached = await CacheService.get<SolverResult>(cacheKey);
  if (cached) {
    perf.end();
    return res.json({
      success: true,
      data: cached,
      cached: true
    });
  }

  try {
    // Calculate ICM equity for current situation
    const stacks = scenario.players.map(p => p.stack);
    const heroIndex = scenario.players.findIndex(p => p.position === scenario.position);

    if (heroIndex === -1) {
      throw createError.badRequest('Hero position not found in players');
    }

    const icmResult = ICMCalculator.calculateICM(stacks, req.body.payouts, heroIndex);

    // Determine optimal action based on stack sizes and ICM considerations
    let optimalAction: Action;
    let equity: number;
    let ev: number;
    let confidence: number;

    const stackInBB = scenario.heroStack / scenario.currentLevel.bigBlind;

    if (stackInBB <= 15) {
      // Short stack - focus on push/fold
      const pushFoldEV = ICMCalculator.calculatePushFoldEquity(
        scenario.heroStack,
        Math.max(...stacks.filter((_, i) => i !== heroIndex)),
        scenario.currentLevel.smallBlind + scenario.currentLevel.bigBlind,
        scenario.currentLevel.ante * scenario.players.length,
        0.3, // Estimated calling range
        0.7  // Estimated fold equity
      );

      if (pushFoldEV.pushEV > pushFoldEV.foldEV) {
        optimalAction = Action.PUSH;
        ev = pushFoldEV.pushEV;
      } else {
        optimalAction = Action.FOLD;
        ev = pushFoldEV.foldEV;
      }

      equity = icmResult.equity;
      confidence = stackInBB <= 8 ? 0.95 : 0.85;

    } else {
      // Deeper stack - more complex analysis
      const range = RangeAnalyzer.getPositionalRange(scenario.position, 'open');

      if (scenario.heroCards) {
        const handString = `${scenario.heroCards[0].rank}${scenario.heroCards[1].rank}${
          scenario.heroCards[0].suit === scenario.heroCards[1].suit ? 's' : 'o'
        }`;

        if (range.hands.includes(handString)) {
          optimalAction = Action.RAISE;
          confidence = 0.8;
        } else {
          optimalAction = Action.FOLD;
          confidence = 0.9;
        }
      } else {
        optimalAction = Action.FOLD;
        confidence = 0.7;
      }

      equity = icmResult.equity;
      ev = icmResult.dollarEV;
    }

    const result: SolverResult = {
      action: optimalAction,
      equity,
      ev,
      confidence
    };

    // Cache the result
    await CacheService.set(cacheKey, result, 1800); // 30 minutes

    perf.end();

    res.json({
      success: true,
      data: result,
      icmAnalysis: icmResult,
      scenario: {
        stackInBB,
        position: scenario.position,
        players: scenario.players.length
      }
    });

  } catch (error) {
    throw createError.internal(`Solver calculation failed: ${error.message}`);
  }
}));

// POST /api/solve/push-fold - Calculate optimal push/fold decision
router.post('/push-fold', validateBody(pushFoldSchema), asyncHandler(async (req, res) => {
  const perf = new PerformanceLogger('Push/fold calculation');

  const {
    heroStack,
    villainStacks,
    smallBlind,
    bigBlind,
    ante,
    position,
    payouts,
    heroCards
  } = req.body;

  const cacheKey = `pushfold:${JSON.stringify(req.body)}`;
  const cached = await CacheService.get(cacheKey);

  if (cached) {
    perf.end();
    return res.json({ success: true, data: cached, cached: true });
  }

  try {
    const allStacks = [heroStack, ...villainStacks];
    const icmResult = ICMCalculator.calculateICM(allStacks, payouts, 0);

    // Calculate push/fold EV
    const totalBlinds = smallBlind + bigBlind + (ante * (villainStacks.length + 1));
    const pushFoldEV = ICMCalculator.calculatePushFoldEquity(
      heroStack,
      Math.max(...villainStacks),
      totalBlinds,
      ante * (villainStacks.length + 1),
      0.25, // Estimated calling frequency
      0.75  // Fold equity
    );

    // Get optimal pushing range for this stack size
    const optimalRange = ICMCalculator.calculateOptimalPushingRange(
      heroStack,
      villainStacks,
      bigBlind,
      ante,
      position,
      payouts
    );

    let recommendation: Action = Action.FOLD;
    let handAnalysis: any = null;

    if (heroCards) {
      const handString = heroCards[0].rank === heroCards[1].rank
        ? heroCards[0].rank + heroCards[0].rank
        : heroCards[0].rank + heroCards[1].rank + (heroCards[0].suit === heroCards[1].suit ? 's' : 'o');

      handAnalysis = {
        hand: handString,
        inRange: optimalRange.includes(handString),
        equity: pushFoldEV.pushEV > 0 ? 0.55 : 0.45 // Simplified
      };

      recommendation = handAnalysis.inRange ? Action.PUSH : Action.FOLD;
    }

    const result = {
      recommendation,
      pushEV: pushFoldEV.pushEV,
      foldEV: pushFoldEV.foldEV,
      icmEquity: icmResult.equity,
      bubbleFactor: ICMCalculator.calculateBubbleFactor(allStacks, payouts, 0),
      optimalRange,
      handAnalysis,
      stackSizeInBB: heroStack / bigBlind
    };

    await CacheService.set(cacheKey, result, 3600); // 1 hour cache

    perf.end();

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    throw createError.internal(`Push/fold calculation failed: ${error.message}`);
  }
}));

// POST /api/solve/multi-way - Solve multi-way scenarios
router.post('/multi-way', asyncHandler(async (req, res) => {
  const perf = new PerformanceLogger('Multi-way scenario');

  // Simplified multi-way solver
  // In production, this would involve complex game tree analysis

  const { players, action, position } = req.body;

  if (!players || players.length < 3) {
    throw createError.badRequest('Multi-way scenarios require at least 3 players');
  }

  try {
    // Calculate ICM for all players
    const stacks = players.map((p: any) => p.stack);
    const payouts = req.body.payouts || [50, 30, 20]; // Default payout structure

    const results = stacks.map((_, index) => {
      const icm = ICMCalculator.calculateICM(stacks, payouts, index);
      return {
        playerId: players[index].id,
        position: players[index].position,
        icmEquity: icm.equity,
        riskPremium: icm.riskPremium
      };
    });

    // Simplified recommendation based on ICM pressure
    const heroResult = results.find(r => r.position === position);
    const recommendation = heroResult?.riskPremium > 0.1 ? 'TIGHT' : 'NORMAL';

    const result = {
      recommendation,
      analysis: 'Multi-way scenarios require tight play due to ICM pressure',
      playerAnalysis: results,
      complexity: 'HIGH'
    };

    perf.end();

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    throw createError.internal(`Multi-way analysis failed: ${error.message}`);
  }
}));

export default router;