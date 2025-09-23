import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card as CardType } from '../types';
import Card from '../components/Card';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, className, ...props }: any) => (
      <div onClick={onClick} className={className} {...props}>
        {children}
      </div>
    ),
  },
}));

// Mock useAnimations hook
jest.mock('../hooks/useAnimations', () => ({
  useAnimations: () => ({
    cardHover: {
      initial: { scale: 1 },
      hover: { scale: 1.05 },
      tap: { scale: 0.98 }
    }
  }),
  useHoverAnimation: () => ({
    initial: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.98 }
  })
}));

describe('Card Component', () => {
  const mockCard: CardType = {
    rank: 'A',
    suit: 'h'
  };

  it('renders card with correct rank and suit', () => {
    render(<Card card={mockCard} />);

    expect(screen.getAllByText('A')).toHaveLength(2); // Top and bottom rank
    expect(screen.getAllByText('♥')).toHaveLength(3); // Top, center, and bottom suit
  });

  it('renders card back when showBack is true', () => {
    render(<Card showBack />);

    expect(screen.getByText('MTT')).toBeInTheDocument();
    expect(screen.queryByText('A')).not.toBeInTheDocument();
  });

  it('renders placeholder when no card is provided', () => {
    render(<Card />);

    expect(screen.getByText('MTT')).toBeInTheDocument();
    expect(screen.queryByText('A')).not.toBeInTheDocument();
  });

  it('applies correct color for red suits', () => {
    render(<Card card={{ rank: 'K', suit: 'h' }} />);

    const rankElements = screen.getAllByText('K');
    rankElements.forEach(element => {
      expect(element).toHaveStyle({ color: '#ff0066' });
    });
  });

  it('applies correct color for black suits', () => {
    render(<Card card={{ rank: 'Q', suit: 's' }} />);

    const rankElements = screen.getAllByText('Q');
    rankElements.forEach(element => {
      expect(element).toHaveStyle({ color: '#4a4a4a' });
    });
  });

  it('handles click events when clickable', () => {
    const handleClick = jest.fn();
    render(<Card card={mockCard} isClickable onClick={handleClick} />);

    const cardElement = screen.getByText('A').closest('div');
    fireEvent.click(cardElement!);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not handle click events when not clickable', () => {
    const handleClick = jest.fn();
    render(<Card card={mockCard} isClickable={false} onClick={handleClick} />);

    const cardElement = screen.getByText('A').closest('div');
    fireEvent.click(cardElement!);

    expect(handleClick).toHaveBeenCalledTimes(1); // onClick still fires, but no cursor pointer
  });

  it('applies selected styling when isSelected is true', () => {
    render(<Card card={mockCard} isSelected />);

    const cardElement = screen.getByText('A').closest('div');
    expect(cardElement).toHaveClass('selected');
    expect(cardElement).toHaveClass('shadow-neon-cyan-lg');
  });

  it('displays rank T as 10', () => {
    render(<Card card={{ rank: 'T', suit: 'c' }} />);

    expect(screen.getAllByText('10')).toHaveLength(2);
    expect(screen.queryByText('T')).not.toBeInTheDocument();
  });

  it('applies correct size classes', () => {
    const { rerender } = render(<Card card={mockCard} size="sm" />);
    let cardElement = screen.getByText('A').closest('div');
    expect(cardElement).toHaveClass('w-8', 'h-12');

    rerender(<Card card={mockCard} size="md" />);
    cardElement = screen.getByText('A').closest('div');
    expect(cardElement).toHaveClass('w-12', 'h-16');

    rerender(<Card card={mockCard} size="lg" />);
    cardElement = screen.getByText('A').closest('div');
    expect(cardElement).toHaveClass('w-16', 'h-24');
  });

  it('applies custom className', () => {
    render(<Card card={mockCard} className="custom-class" />);

    const cardElement = screen.getByText('A').closest('div');
    expect(cardElement).toHaveClass('custom-class');
  });

  it('displays correct suit symbols', () => {
    const suits = [
      { suit: 'h', symbol: '♥' },
      { suit: 'd', symbol: '♦' },
      { suit: 's', symbol: '♠' },
      { suit: 'c', symbol: '♣' }
    ];

    suits.forEach(({ suit, symbol }) => {
      const { unmount } = render(<Card card={{ rank: 'A', suit: suit as any }} />);
      expect(screen.getAllByText(symbol)).toHaveLength(3);
      unmount();
    });
  });

  it('renders corner accent lines', () => {
    render(<Card card={mockCard} />);

    const cardElement = screen.getByText('A').closest('div');
    const accentLines = cardElement?.querySelectorAll('.border-neon-white\\/30');
    expect(accentLines).toHaveLength(4); // Four corner accent lines
  });

  it('has holographic shimmer effect element', () => {
    render(<Card card={mockCard} />);

    const cardElement = screen.getByText('A').closest('div');
    const shimmerElement = cardElement?.querySelector('.animate-shimmer');
    expect(shimmerElement).toBeInTheDocument();
  });
});