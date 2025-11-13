import express from 'express';
import Joi from 'joi';
import { asyncHandler, validateBody, createError } from '../middleware/errorHandler';
import { GTOSolver } from '../services/gtoSolver';
import { SolutionDatabase } from '../services/solutionDatabase';
import { CacheService } from '../config/database';
import { PerformanceLogger } from '../utils/logger';
import { Card, Position } from '../types';

const router = express.Router();

// Validation schemas
const solveGTOSchema = Joi.object({
  street: Joi.string().valid('preflop', 'flop', 'turn', 'river').required(),
  pot: Joi.number().min(0).required(),
  heroStack: Joi.number().min(1).required(),
  villainStack: Joi.number().min(1).required(),
  heroCards: Joi.array().items(Joi.object({
    rank: Joi.string().valid('A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2').required(),
    suit: Joi.string().valid('s', 'h', 'd', 'c').required()
  })).length(2).required(),
  board: Joi.array().items(Joi.object({
    rank: Joi.string().valid('A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2').required(),
    suit: Joi.string().valid('s', 'h', 'd', 'c').required()
  })).max(5).default([]),
  position: Joi.string().valid(...Object.values(Position)).required(),
  actionHistory: Joi.array().items(Joi.string()).default([]),
  iterations: Joi.number().min(100).max(10000).default(1000)
});

const rangeVsRangeSchema = Joi.object({
  heroRange: Joi.array().items(Joi.string()).min(1).required(),
  villainRange: Joi.array().items(Joi.string()).min(1).required(),
  board: Joi.array().items(Joi.object({
    rank: Joi.string().valid('A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2').required(),
    suit: Joi.string().valid('s', 'h', 'd', 'c').required()
  })).max(5).default([]),
  iterations: Joi.number().min(1000).max(100000).default(10000)
});

// POST /api/gto/solve - Solve GTO strategy
router.post('/solve', validateBody(solveGTOSchema), asyncHandler(async (req, res) => {
  const perf = new PerformanceLogger('GTO solve');
  const gameState = req.body;

  // Generate hash for solution lookup
  const solutionHash = SolutionDatabase.generateGameStateHash(gameState);

  // Check pre-solved solutions database first
  const cachedSolution = await SolutionDatabase.getSolution(solutionHash);
  if (cachedSolution) {
    perf.end();
    return res.json({
      success: true,
      data: cachedSolution,
      cached: true,
      hash: solutionHash
    });
  }

  // Check Redis cache
  const cacheKey = `gto:solve:${solutionHash}`;
  const cached = await CacheService.get(cacheKey);
  if (cached) {
    perf.end();
    return res.json({
      success: true,
      data: cached,
      cached: true,
      hash: solutionHash
    });
  }

  try {
    // Solve using CFR
    const solution = GTOSolver.solveCFR(gameState, req.body.iterations || 1000);

    // Store in solution database
    await SolutionDatabase.storeSolution(solutionHash, gameState, solution);

    // Cache for 1 hour
    await CacheService.set(cacheKey, solution, 3600);

    perf.end();

    res.json({
      success: true,
      data: solution,
      hash: solutionHash,
      performance: {
        duration: perf.getDuration(),
        iterations: solution.iterations
      }
    });

  } catch (error: any) {
    throw createError.internal(`GTO solve failed: ${error.message}`);
  }
}));

// POST /api/gto/range-vs-range - Calculate range vs range equity
router.post('/range-vs-range', validateBody(rangeVsRangeSchema), asyncHandler(async (req, res) => {
  const perf = new PerformanceLogger('Range vs range');
  const { heroRange, villainRange, board, iterations } = req.body;

  const cacheKey = `gto:range:${JSON.stringify({ heroRange, villainRange, board })}`;
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
    const equity = GTOSolver.solveRangeVsRange(heroRange, villainRange, board, iterations);

    const result = {
      heroEquity: equity,
      villainEquity: 1 - equity,
      tieEquity: 0, // Simplified
      iterations
    };

    await CacheService.set(cacheKey, result, 1800); // 30 minutes
    perf.end();

    res.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    throw createError.internal(`Range vs range calculation failed: ${error.message}`);
  }
}));

// GET /api/gto/solution/:hash - Get pre-solved solution by hash
router.get('/solution/:hash', asyncHandler(async (req, res) => {
  const { hash } = req.params;

  const solution = await SolutionDatabase.getSolution(hash);

  if (!solution) {
    throw createError.notFound('Solution not found');
  }

  res.json({
    success: true,
    data: solution,
    hash
  });
}));

export default router;

