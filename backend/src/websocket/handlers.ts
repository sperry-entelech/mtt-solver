import { logger } from '../utils/logger';
import { ICMCalculator } from '../services/icmCalculator';
import { HandEvaluator } from '../services/handEvaluator';
import { RangeAnalyzer } from '../services/rangeAnalyzer';

export interface SolverRequest {
  type: 'scenario' | 'push-fold' | 'multi-way';
  data: any;
}

export async function handleSolverRequest(request: SolverRequest): Promise<any> {
  const { type, data } = request;

  switch (type) {
    case 'scenario':
      return handleScenarioSolver(data);
    case 'push-fold':
      return handlePushFoldSolver(data);
    case 'multi-way':
      return handleMultiWaySolver(data);
    default:
      throw new Error(`Unknown solver type: ${type}`);
  }
}

async function handleScenarioSolver(data: any): Promise<any> {
  const { stacks, payouts, playerIndex, heroStack, blinds, position } = data;

  // Calculate ICM
  const icmResult = ICMCalculator.calculateICM(stacks, payouts, playerIndex || 0);

  // Calculate push/fold equity if applicable
  const stackInBB = heroStack / blinds.bigBlind;
  let pushFoldAnalysis = null;

  if (stackInBB <= 15) {
    const maxVillainStack = Math.max(...stacks.filter((_: any, i: number) => i !== (playerIndex || 0)));
    pushFoldAnalysis = ICMCalculator.calculatePushFoldEquity(
      heroStack,
      maxVillainStack,
      blinds.smallBlind + blinds.bigBlind,
      blinds.ante || 0,
      0.3,
      0.7
    );
  }

  return {
    icm: icmResult,
    pushFoldAnalysis,
    stackInBB,
    position,
    recommendation: getRecommendation(icmResult, pushFoldAnalysis, stackInBB),
  };
}

async function handlePushFoldSolver(data: any): Promise<any> {
  const { heroStack, villainStacks, blinds, antes, position, payouts, heroCards } = data;

  const allStacks = [heroStack, ...villainStacks];
  const icmResult = ICMCalculator.calculateICM(allStacks, payouts, 0);

  const totalBlinds = blinds.smallBlind + blinds.bigBlind + (antes * (villainStacks.length + 1));
  const pushFoldEV = ICMCalculator.calculatePushFoldEquity(
    heroStack,
    Math.max(...villainStacks),
    totalBlinds,
    antes * (villainStacks.length + 1),
    0.25,
    0.75
  );

  const optimalRange = ICMCalculator.calculateOptimalPushingRange(
    heroStack,
    villainStacks,
    blinds.bigBlind,
    antes,
    position,
    payouts
  );

  let handAnalysis = null;
  if (heroCards) {
    const handString = heroCards[0].rank === heroCards[1].rank
      ? heroCards[0].rank + heroCards[0].rank
      : heroCards[0].rank + heroCards[1].rank + (heroCards[0].suit === heroCards[1].suit ? 's' : 'o');

    handAnalysis = {
      hand: handString,
      inRange: optimalRange.includes(handString),
      equity: pushFoldEV.pushEV > 0 ? 0.55 : 0.45,
    };
  }

  return {
    recommendation: pushFoldEV.pushEV > pushFoldEV.foldEV ? 'PUSH' : 'FOLD',
    pushEV: pushFoldEV.pushEV,
    foldEV: pushFoldEV.foldEV,
    icmEquity: icmResult.equity,
    bubbleFactor: ICMCalculator.calculateBubbleFactor(allStacks, payouts, 0),
    optimalRange,
    handAnalysis,
    stackSizeInBB: heroStack / blinds.bigBlind,
  };
}

async function handleMultiWaySolver(data: any): Promise<any> {
  const { players, payouts, position } = data;

  if (!players || players.length < 3) {
    throw new Error('Multi-way scenarios require at least 3 players');
  }

  const stacks = players.map((p: any) => p.stack);
  const results = stacks.map((_: number, index: number) => {
    const icm = ICMCalculator.calculateICM(stacks, payouts, index);
    return {
      playerId: players[index].id,
      position: players[index].position,
      icmEquity: icm.equity,
      riskPremium: icm.riskPremium,
    };
  });

  const heroResult = results.find((r: any) => r.position === position);
  const recommendation = heroResult?.riskPremium > 0.1 ? 'TIGHT' : 'NORMAL';

  return {
    recommendation,
    analysis: 'Multi-way scenarios require tight play due to ICM pressure',
    playerAnalysis: results,
    complexity: 'HIGH',
  };
}

function getRecommendation(icm: any, pushFold: any, stackInBB: number): string {
  if (stackInBB <= 8) {
    return 'CRITICAL - Push/fold mode';
  } else if (stackInBB <= 15) {
    return 'SHORT - Tight play recommended';
  } else if (icm.riskPremium > 0.1) {
    return 'ICM PRESSURE - Play tighter than chip EV';
  } else {
    return 'NORMAL - Play close to chip EV';
  }
}

