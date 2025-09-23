import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import CardSelector from '../components/CardSelector';
import Card from '../components/Card';
import { handApi } from '../utils/api';
import { Card as CardType, Position, HandAnalysis } from '../types';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const HandAnalyzer: React.FC = () => {
  const [holeCards, setHoleCards] = useState<CardType[]>([]);
  const [board, setBoard] = useState<CardType[]>([]);
  const [position, setPosition] = useState<Position>(Position.BTN);
  const [opponents, setOpponents] = useState<number>(1);
  const [stackSize, setStackSize] = useState<number>(100);
  const [potSize, setPotSize] = useState<number>(0);

  const allSelectedCards = [...holeCards, ...board];

  // Hand analysis query
  const { data: handAnalysis, isLoading, refetch } = useQuery({
    queryKey: ['hand-analysis', holeCards, board, position, opponents, stackSize, potSize],
    queryFn: async () => {
      if (holeCards.length !== 2) return null;

      const response = await handApi.analyze({
        holeCards,
        board,
        position,
        opponents,
        action: board.length === 0 ? 'PREFLOP' : board.length === 3 ? 'FLOP' : board.length === 4 ? 'TURN' : 'RIVER',
        stackSize: stackSize * 100, // Convert to chips (assuming 100 chips per BB)
        potSize: potSize * 100,
      });

      return response.data.data as HandAnalysis;
    },
    enabled: holeCards.length === 2,
  });

  const handleHoleCardSelect = (card: CardType) => {
    if (allSelectedCards.some(c => c.rank === card.rank && c.suit === card.suit)) {
      toast.error('Card already selected');
      return;
    }
    setHoleCards(prev => [...prev, card]);
  };

  const handleHoleCardDeselect = (card: CardType) => {
    setHoleCards(prev => prev.filter(c => !(c.rank === card.rank && c.suit === card.suit)));
  };

  const handleBoardCardSelect = (card: CardType) => {
    if (allSelectedCards.some(c => c.rank === card.rank && c.suit === card.suit)) {
      toast.error('Card already selected');
      return;
    }
    setBoard(prev => [...prev, card]);
  };

  const handleBoardCardDeselect = (card: CardType) => {
    setBoard(prev => prev.filter(c => !(c.rank === card.rank && c.suit === card.suit)));
  };

  const resetHand = () => {
    setHoleCards([]);
    setBoard([]);
    setPotSize(0);
  };

  const getStreetName = () => {
    if (board.length === 0) return 'Preflop';
    if (board.length === 3) return 'Flop';
    if (board.length === 4) return 'Turn';
    if (board.length === 5) return 'River';
    return 'Unknown';
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 8) return 'text-green-400';
    if (strength >= 6) return 'text-yellow-400';
    if (strength >= 4) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Hand Analyzer</h1>
        <p className="text-xl text-gray-400">
          Analyze poker hands with detailed equity calculations and strategic recommendations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Input */}
        <div className="space-y-6">
          {/* Hand Setup */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Hand Setup</h2>

            {/* Position and Opponents */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Position
                </label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value as Position)}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  {Object.values(Position).map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Opponents: {opponents}
                </label>
                <input
                  type="range"
                  min="1"
                  max="9"
                  value={opponents}
                  onChange={(e) => setOpponents(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Stack (BB)
                  </label>
                  <input
                    type="number"
                    value={stackSize}
                    onChange={(e) => setStackSize(parseInt(e.target.value) || 0)}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                    placeholder="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Pot (BB)
                  </label>
                  <input
                    type="number"
                    value={potSize}
                    onChange={(e) => setPotSize(parseInt(e.target.value) || 0)}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Card Selectors */}
            <CardSelector
              selectedCards={holeCards}
              onCardSelect={handleHoleCardSelect}
              onCardDeselect={handleHoleCardDeselect}
              maxCards={2}
              title="Hole Cards"
              className="mb-6"
            />

            <CardSelector
              selectedCards={board}
              onCardSelect={handleBoardCardSelect}
              onCardDeselect={handleBoardCardDeselect}
              maxCards={5}
              title={`Board Cards (${getStreetName()})`}
            />

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={resetHand}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => refetch()}
                disabled={holeCards.length !== 2 || isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded transition-colors"
              >
                {isLoading ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          </div>
        </div>

        {/* Middle Column - Hand Display */}
        <div className="space-y-6">
          {/* Current Hand */}
          <div className="bg-gray-800 rounded-lg p-6 poker-felt">
            <h3 className="text-lg font-semibold text-white mb-4 text-center">
              {getStreetName()} Analysis
            </h3>

            {/* Hole Cards */}
            <div className="text-center mb-6">
              <p className="text-sm text-gray-300 mb-2">Hole Cards</p>
              <div className="flex justify-center gap-2">
                {holeCards.length > 0 ? (
                  holeCards.map((card, index) => (
                    <Card key={index} card={card} size="lg" />
                  ))
                ) : (
                  <div className="flex gap-2">
                    <div className="w-16 h-24 bg-gray-700 rounded-lg border-2 border-dashed border-gray-500 flex items-center justify-center">
                      <span className="text-gray-500 text-xs">Card 1</span>
                    </div>
                    <div className="w-16 h-24 bg-gray-700 rounded-lg border-2 border-dashed border-gray-500 flex items-center justify-center">
                      <span className="text-gray-500 text-xs">Card 2</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Board */}
            {board.length > 0 && (
              <div className="text-center">
                <p className="text-sm text-gray-300 mb-2">Community Cards</p>
                <div className="flex justify-center gap-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Card
                      key={index}
                      card={board[index]}
                      showBack={!board[index]}
                      size="md"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Hand Strength Indicator */}
            {handAnalysis?.handStrength && (
              <div className="mt-6 text-center">
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <p className="text-sm text-gray-300 mb-1">Hand Strength</p>
                  <p className="text-lg font-bold text-white">
                    {handAnalysis.handStrength.description}
                  </p>
                  <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(handAnalysis.handStrength.rank / 10) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          {handAnalysis && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-900 rounded">
                  <p className="text-sm text-gray-400">Equity vs Random</p>
                  <p className="text-xl font-bold text-green-400">
                    {(handAnalysis.equityVsRandom * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-900 rounded">
                  <p className="text-sm text-gray-400">Preflop Strength</p>
                  <p className={clsx('text-xl font-bold', getStrengthColor(handAnalysis.preflopStrength.strength))}>
                    {handAnalysis.preflopStrength.strength}/10
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-900 rounded">
                  <p className="text-sm text-gray-400">Position Strength</p>
                  <p className="text-xl font-bold text-blue-400">
                    {handAnalysis.positionalAdvantage.strength}/10
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-900 rounded">
                  <p className="text-sm text-gray-400">Playability</p>
                  <p className="text-xl font-bold text-purple-400">
                    {handAnalysis.playability.overall}/10
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Analysis */}
        <div className="space-y-6">
          {handAnalysis && (
            <>
              {/* Hand Information */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Hand Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Hand:</span>
                    <span className="text-white font-mono">
                      {handAnalysis.preflopStrength.hand}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Category:</span>
                    <span className="text-blue-400">
                      {handAnalysis.preflopStrength.category.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Premium:</span>
                    <span className={handAnalysis.preflopStrength.premium ? 'text-green-400' : 'text-gray-400'}>
                      {handAnalysis.preflopStrength.premium ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Multiway:</span>
                    <span className={handAnalysis.playability.multiway ? 'text-green-400' : 'text-gray-400'}>
                      {handAnalysis.playability.multiway ? 'Good' : 'Poor'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Heads-up:</span>
                    <span className={handAnalysis.playability.headsUp ? 'text-green-400' : 'text-gray-400'}>
                      {handAnalysis.playability.headsUp ? 'Good' : 'Poor'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Recommendations</h3>
                <div className="space-y-2">
                  {handAnalysis.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-900 rounded">
                      <span className="text-blue-400 mt-1">•</span>
                      <span className="text-gray-300 text-sm">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Position Analysis */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Position Analysis</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Current Position:</span>
                    <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                      {position}
                    </span>
                  </div>
                  <div className="text-sm text-gray-300 bg-gray-900 p-3 rounded">
                    {handAnalysis.positionalAdvantage.description}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Advantage Level:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-400 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(handAnalysis.positionalAdvantage.strength / 10) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-blue-400 text-sm">
                        {handAnalysis.positionalAdvantage.strength}/10
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pot Odds (if applicable) */}
              {potSize > 0 && (
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Pot Odds</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Pot Size:</span>
                      <span className="text-white">{potSize} BB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Stack Size:</span>
                      <span className="text-white">{stackSize} BB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">SPR:</span>
                      <span className="text-blue-400">
                        {potSize > 0 ? (stackSize / potSize).toFixed(1) : '∞'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-center h-32">
                <div className="spinner w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!handAnalysis && !isLoading && holeCards.length !== 2 && (
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-center text-gray-400">
                <p>Select hole cards to begin analysis</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HandAnalyzer;