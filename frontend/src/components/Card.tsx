import React from 'react';
import { Card as CardType } from '../types';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { useAnimations, useHoverAnimation } from '../hooks/useAnimations';

interface CardProps {
  card?: CardType;
  isSelected?: boolean;
  isClickable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showBack?: boolean;
  onClick?: () => void;
  className?: string;
}

const Card: React.FC<CardProps> = ({
  card,
  isSelected = false,
  isClickable = false,
  size = 'md',
  showBack = false,
  onClick,
  className,
}) => {
  const sizeClasses = {
    sm: 'w-8 h-12',
    md: 'w-12 h-16',
    lg: 'w-16 h-24',
  };

  const getSuitColor = (suit: string) => {
    const colors = {
      h: '#ff0066', // Neon pink for hearts
      d: '#ff0066', // Neon pink for diamonds
      s: '#4a4a4a', // Dark gray for spades
      c: '#4a4a4a', // Dark gray for clubs
    };
    return colors[suit as keyof typeof colors] || '#4a4a4a';
  };

  const getSuitSymbol = (suit: string) => {
    const symbols = {
      h: '♥',
      d: '♦',
      s: '♠',
      c: '♣',
    };
    return symbols[suit as keyof typeof symbols] || suit;
  };

  const getRankDisplay = (rank: string) => {
    return rank === 'T' ? '10' : rank;
  };

  const { cardHover } = useAnimations();
  const hoverAnimation = useHoverAnimation({
    scale: 1.05,
    rotate: isClickable ? 2 : 0,
    y: -3,
  });

  if (showBack || !card) {
    return (
      <motion.div
        className={clsx(
          'relative rounded-xl card-back-cyber',
          'flex items-center justify-center',
          'shadow-neon-cyan font-futura',
          sizeClasses[size],
          isClickable && 'cursor-pointer',
          isSelected && 'shadow-neon-cyan-lg',
          className
        )}
        onClick={onClick}
        variants={hoverAnimation}
        initial="initial"
        whileHover={isClickable ? "hover" : undefined}
        whileTap={isClickable ? "tap" : undefined}
        animate={isSelected ? { scale: 1.02 } : "initial"}
      >
        <div className="text-neon-cyan text-xs font-bold opacity-60 tracking-wider">
          MTT
        </div>

        {/* Holographic effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-neon-cyan/10 to-transparent opacity-30" />

        {/* Cyber pattern overlay */}
        <div className="absolute inset-2 rounded-lg border border-neon-cyan/20 bg-cyber-grid bg-cyber-grid opacity-20" />
      </motion.div>
    );
  }

  return (
    <motion.div
      className={clsx(
        'relative rounded-xl card-futuristic',
        'flex flex-col items-center justify-between',
        'p-1 font-futura',
        sizeClasses[size],
        isClickable && 'cursor-pointer',
        isSelected && 'selected shadow-neon-cyan-lg',
        className
      )}
      onClick={onClick}
      variants={hoverAnimation}
      initial="initial"
      whileHover={isClickable ? "hover" : undefined}
      whileTap={isClickable ? "tap" : undefined}
      animate={isSelected ? { scale: 1.02 } : "initial"}
    >
      {/* Holographic shimmer effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-neon-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 animate-shimmer" />

      {/* Top rank and suit */}
      <div className="self-start z-10" style={{ color: getSuitColor(card.suit) }}>
        <div className="text-xs font-bold leading-none tracking-wide">
          {getRankDisplay(card.rank)}
        </div>
        <div className="text-xs leading-none">
          {getSuitSymbol(card.suit)}
        </div>
      </div>

      {/* Center suit symbol with glow */}
      <div
        className="text-2xl font-bold z-10 drop-shadow-lg"
        style={{
          color: getSuitColor(card.suit),
          textShadow: `0 0 10px ${getSuitColor(card.suit)}40`
        }}
      >
        {getSuitSymbol(card.suit)}
      </div>

      {/* Bottom rank and suit (rotated) */}
      <div
        className="self-end transform rotate-180 z-10"
        style={{ color: getSuitColor(card.suit) }}
      >
        <div className="text-xs font-bold leading-none tracking-wide">
          {getRankDisplay(card.rank)}
        </div>
        <div className="text-xs leading-none">
          {getSuitSymbol(card.suit)}
        </div>
      </div>

      {/* Corner accent lines */}
      <div className="absolute top-1 left-1 w-3 h-3 border-l-2 border-t-2 border-neon-white/30 rounded-tl-lg" />
      <div className="absolute top-1 right-1 w-3 h-3 border-r-2 border-t-2 border-neon-white/30 rounded-tr-lg" />
      <div className="absolute bottom-1 left-1 w-3 h-3 border-l-2 border-b-2 border-neon-white/30 rounded-bl-lg" />
      <div className="absolute bottom-1 right-1 w-3 h-3 border-r-2 border-b-2 border-neon-white/30 rounded-br-lg" />
    </motion.div>
  );
};

export default Card;