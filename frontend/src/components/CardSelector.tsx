import React, { useState } from 'react';
import { Card as CardType } from '../types';
import Card from './Card';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface CardSelectorProps {
  selectedCards: CardType[];
  onCardSelect: (card: CardType) => void;
  onCardDeselect: (card: CardType) => void;
  maxCards?: number;
  title?: string;
  className?: string;
  disabled?: boolean;
}

const CardSelector: React.FC<CardSelectorProps> = ({
  selectedCards,
  onCardSelect,
  onCardDeselect,
  maxCards = 2,
  title = 'Select Cards',
  className,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  const suits = [
    { symbol: '♠', value: 's', color: 'text-gray-900' },
    { symbol: '♥', value: 'h', color: 'text-red-600' },
    { symbol: '♦', value: 'd', color: 'text-red-600' },
    { symbol: '♣', value: 'c', color: 'text-gray-900' },
  ];

  const allCards: CardType[] = [];
  ranks.forEach(rank => {
    suits.forEach(suit => {
      allCards.push({ rank, suit: suit.value });
    });
  });

  const isCardSelected = (card: CardType) => {
    return selectedCards.some(
      selected => selected.rank === card.rank && selected.suit === card.suit
    );
  };

  const handleCardClick = (card: CardType) => {
    if (disabled) return;

    if (isCardSelected(card)) {
      onCardDeselect(card);
    } else if (selectedCards.length < maxCards) {
      onCardSelect(card);
    }
  };

  const canSelectMore = selectedCards.length < maxCards;

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Header with selected cards */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
          <p className="text-sm text-gray-400">
            {selectedCards.length}/{maxCards} cards selected
          </p>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className={clsx(
            'px-4 py-2 rounded-lg font-medium transition-colors',
            disabled
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white',
            'focus:outline-none focus:ring-2 focus:ring-blue-500'
          )}
        >
          {isOpen ? 'Close Selector' : 'Select Cards'}
        </button>
      </div>

      {/* Selected cards display */}
      <div className="flex gap-2 flex-wrap">
        <AnimatePresence>
          {selectedCards.map((card, index) => (
            <motion.div
              key={`${card.rank}${card.suit}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Card
                card={card}
                isSelected={true}
                isClickable={!disabled}
                onClick={() => handleCardClick(card)}
                size="md"
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Placeholder cards */}
        {Array.from({ length: maxCards - selectedCards.length }).map((_, index) => (
          <motion.div
            key={`placeholder-${index}`}
            className="w-12 h-16 rounded-lg border-2 border-dashed border-gray-500 flex items-center justify-center bg-gray-800/50"
            animate={{ opacity: canSelectMore ? 0.7 : 0.3 }}
          >
            <span className="text-gray-500 text-xs">Empty</span>
          </motion.div>
        ))}
      </div>

      {/* Card selector grid */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="space-y-4">
                {/* Suits header */}
                <div className="flex justify-center gap-8">
                  {suits.map(suit => (
                    <div
                      key={suit.value}
                      className={clsx('text-2xl font-bold', suit.color)}
                    >
                      {suit.symbol}
                    </div>
                  ))}
                </div>

                {/* Cards grid */}
                <div className="space-y-2">
                  {ranks.map(rank => (
                    <div key={rank} className="flex justify-center gap-2">
                      <div className="w-8 flex items-center justify-center text-gray-300 font-bold">
                        {rank}
                      </div>
                      {suits.map(suit => {
                        const card = { rank, suit: suit.value };
                        const isSelected = isCardSelected(card);
                        const isDisabled = disabled || (!canSelectMore && !isSelected);

                        return (
                          <motion.button
                            key={`${rank}${suit.value}`}
                            onClick={() => handleCardClick(card)}
                            disabled={isDisabled}
                            className={clsx(
                              'w-8 h-10 rounded text-xs font-bold border transition-all',
                              'flex items-center justify-center',
                              isSelected
                                ? 'bg-green-600 border-green-500 text-white'
                                : 'bg-white border-gray-300 hover:bg-gray-100',
                              isDisabled && 'opacity-50 cursor-not-allowed',
                              !isDisabled && !isSelected && 'hover:scale-110',
                              suit.color
                            )}
                            whileHover={!isDisabled ? { scale: 1.1 } : undefined}
                            whileTap={!isDisabled ? { scale: 0.95 } : undefined}
                          >
                            <div className="flex flex-col items-center leading-none">
                              <span className="text-[10px]">{rank}</span>
                              <span className="text-[8px]">{suit.symbol}</span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick actions */}
              <div className="mt-4 flex gap-2 justify-center">
                <button
                  onClick={() => selectedCards.forEach(onCardDeselect)}
                  disabled={disabled || selectedCards.length === 0}
                  className={clsx(
                    'px-3 py-1 rounded text-sm transition-colors',
                    disabled || selectedCards.length === 0
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  )}
                >
                  Clear All
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1 rounded text-sm bg-gray-600 hover:bg-gray-700 text-white transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick hand buttons for common hands */}
      {maxCards === 2 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-400">Quick select:</p>
          <div className="flex gap-2 flex-wrap">
            {[
              { label: 'AA', cards: [{ rank: 'A', suit: 's' }, { rank: 'A', suit: 'h' }] },
              { label: 'KK', cards: [{ rank: 'K', suit: 's' }, { rank: 'K', suit: 'h' }] },
              { label: 'AKs', cards: [{ rank: 'A', suit: 's' }, { rank: 'K', suit: 's' }] },
              { label: 'AKo', cards: [{ rank: 'A', suit: 's' }, { rank: 'K', suit: 'h' }] },
            ].map(hand => (
              <button
                key={hand.label}
                onClick={() => {
                  selectedCards.forEach(onCardDeselect);
                  hand.cards.forEach(onCardSelect);
                }}
                disabled={disabled}
                className={clsx(
                  'px-2 py-1 rounded text-xs font-mono transition-colors',
                  disabled
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                )}
              >
                {hand.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CardSelector;