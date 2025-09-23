export interface Card {
  rank: string;
  suit: string;
}

export interface Hand {
  cards: Card[];
}

export interface Range {
  id?: string;
  position: Position;
  rangeString: string;
  description?: string;
  hands: string[];
}

export interface Player {
  id: string;
  position: Position;
  stack: number;
  isAlive: boolean;
  range?: Range;
}

export interface TournamentStructure {
  id: string;
  name: string;
  payouts: number[];
  blindLevels: BlindLevel[];
}

export interface BlindLevel {
  smallBlind: number;
  bigBlind: number;
  ante: number;
  level: number;
}

export interface Scenario {
  id?: string;
  tournamentId?: string;
  players: Player[];
  currentLevel: BlindLevel;
  position: Position;
  heroStack: number;
  heroCards?: Card[];
  board?: Card[];
  action?: Action;
}

export interface ICMResult {
  equity: number;
  chipEV: number;
  dollarEV: number;
  riskPremium: number;
}

export interface SolverResult {
  action: Action;
  equity: number;
  ev: number;
  range?: Range;
  confidence: number;
}

export interface PushFoldChart {
  position: Position;
  ranges: {
    push: string[];
    call: string[];
    fold: string[];
  };
  stackSize: number;
  opponents: number;
}

export interface HandEvaluation {
  rank: number;
  description: string;
  category: HandCategory;
}

export enum Position {
  UTG = 'UTG',
  UTG1 = 'UTG1',
  UTG2 = 'UTG2',
  MP = 'MP',
  MP1 = 'MP1',
  MP2 = 'MP2',
  HJ = 'HJ',
  CO = 'CO',
  BTN = 'BTN',
  SB = 'SB',
  BB = 'BB'
}

export enum Action {
  FOLD = 'FOLD',
  CALL = 'CALL',
  RAISE = 'RAISE',
  PUSH = 'PUSH',
  CHECK = 'CHECK'
}

export enum HandCategory {
  HIGH_CARD = 'HIGH_CARD',
  PAIR = 'PAIR',
  TWO_PAIR = 'TWO_PAIR',
  THREE_OF_A_KIND = 'THREE_OF_A_KIND',
  STRAIGHT = 'STRAIGHT',
  FLUSH = 'FLUSH',
  FULL_HOUSE = 'FULL_HOUSE',
  FOUR_OF_A_KIND = 'FOUR_OF_A_KIND',
  STRAIGHT_FLUSH = 'STRAIGHT_FLUSH',
  ROYAL_FLUSH = 'ROYAL_FLUSH'
}

export interface EquityCalculation {
  hand1Equity: number;
  hand2Equity: number;
  tieEquity: number;
  iterations: number;
}

export interface RangeVsRangeResult {
  range1Equity: number;
  range2Equity: number;
  tieEquity: number;
  iterations: number;
  detailed: {
    [hand: string]: number;
  };
}