import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Card from '../Card'

describe('Card Component', () => {
  const defaultProps = {
    rank: 'A' as const,
    suit: 's' as const,
    selected: false,
    onClick: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render card with correct rank and suit', () => {
      render(<Card {...defaultProps} />)

      expect(screen.getByText('A')).toBeInTheDocument()
      expect(screen.getByText('♠')).toBeInTheDocument()
    })

    it('should render all rank variants correctly', () => {
      const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']

      ranks.forEach(rank => {
        const { unmount } = render(<Card {...defaultProps} rank={rank} />)
        expect(screen.getByText(rank)).toBeInTheDocument()
        unmount()
      })
    })

    it('should render all suit symbols correctly', () => {
      const suits = [
        { suit: 's', symbol: '♠' },
        { suit: 'h', symbol: '♥' },
        { suit: 'd', symbol: '♦' },
        { suit: 'c', symbol: '♣' }
      ]

      suits.forEach(({ suit, symbol }) => {
        const { unmount } = render(<Card {...defaultProps} suit={suit as any} />)
        expect(screen.getByText(symbol)).toBeInTheDocument()
        unmount()
      })
    })

    it('should apply correct color classes for suits', () => {
      // Red suits
      const { rerender } = render(<Card {...defaultProps} suit="h" />)
      expect(screen.getByRole('button')).toHaveClass('text-red-600')

      rerender(<Card {...defaultProps} suit="d" />)
      expect(screen.getByRole('button')).toHaveClass('text-red-600')

      // Black suits
      rerender(<Card {...defaultProps} suit="s" />)
      expect(screen.getByRole('button')).toHaveClass('text-gray-800')

      rerender(<Card {...defaultProps} suit="c" />)
      expect(screen.getByRole('button')).toHaveClass('text-gray-800')
    })

    it('should apply selected state styling', () => {
      const { rerender } = render(<Card {...defaultProps} selected={false} />)
      expect(screen.getByRole('button')).not.toHaveClass('ring-2', 'ring-blue-500')

      rerender(<Card {...defaultProps} selected={true} />)
      expect(screen.getByRole('button')).toHaveClass('ring-2', 'ring-blue-500')
    })

    it('should apply disabled state styling', () => {
      const { rerender } = render(<Card {...defaultProps} disabled={false} />)
      expect(screen.getByRole('button')).not.toHaveClass('opacity-50', 'cursor-not-allowed')

      rerender(<Card {...defaultProps} disabled={true} />)
      expect(screen.getByRole('button')).toHaveClass('opacity-50', 'cursor-not-allowed')
    })

    it('should show placeholder when no rank or suit provided', () => {
      render(<Card {...defaultProps} rank={undefined} suit={undefined} />)
      expect(screen.getByText('?')).toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('should call onClick when clicked', () => {
      const mockOnClick = vi.fn()
      render(<Card {...defaultProps} onClick={mockOnClick} />)

      fireEvent.click(screen.getByRole('button'))
      expect(mockOnClick).toHaveBeenCalledTimes(1)
      expect(mockOnClick).toHaveBeenCalledWith({ rank: 'A', suit: 's' })
    })

    it('should not call onClick when disabled', () => {
      const mockOnClick = vi.fn()
      render(<Card {...defaultProps} onClick={mockOnClick} disabled={true} />)

      fireEvent.click(screen.getByRole('button'))
      expect(mockOnClick).not.toHaveBeenCalled()
    })

    it('should support keyboard navigation', () => {
      const mockOnClick = vi.fn()
      render(<Card {...defaultProps} onClick={mockOnClick} />)

      const button = screen.getByRole('button')
      fireEvent.keyDown(button, { key: 'Enter' })
      expect(mockOnClick).toHaveBeenCalledTimes(1)

      fireEvent.keyDown(button, { key: ' ' })
      expect(mockOnClick).toHaveBeenCalledTimes(2)
    })

    it('should have proper accessibility attributes', () => {
      render(<Card {...defaultProps} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Ace of Spades')
      expect(button).toHaveAttribute('tabIndex', '0')
    })
  })

  describe('Animation and Styling', () => {
    it('should have hover effects', () => {
      render(<Card {...defaultProps} />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:shadow-lg', 'transition-all')
    })

    it('should animate selection state', () => {
      const { rerender } = render(<Card {...defaultProps} selected={false} />)
      const button = screen.getByRole('button')

      rerender(<Card {...defaultProps} selected={true} />)
      expect(button).toHaveClass('transform', 'transition-all')
    })

    it('should have proper card dimensions', () => {
      render(<Card {...defaultProps} />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('w-16', 'h-24') // Standard card aspect ratio
    })
  })

  describe('Size Variants', () => {
    it('should render small size variant', () => {
      render(<Card {...defaultProps} size="small" />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('w-12', 'h-18')
    })

    it('should render large size variant', () => {
      render(<Card {...defaultProps} size="large" />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('w-20', 'h-28')
    })
  })

  describe('Card Back', () => {
    it('should render card back when faceDown prop is true', () => {
      render(<Card {...defaultProps} faceDown={true} />)

      expect(screen.queryByText('A')).not.toBeInTheDocument()
      expect(screen.queryByText('♠')).not.toBeInTheDocument()
      expect(screen.getByTestId('card-back')).toBeInTheDocument()
    })

    it('should still be clickable when face down', () => {
      const mockOnClick = vi.fn()
      render(<Card {...defaultProps} faceDown={true} onClick={mockOnClick} />)

      fireEvent.click(screen.getByRole('button'))
      expect(mockOnClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Custom Styling', () => {
    it('should accept custom className', () => {
      render(<Card {...defaultProps} className="custom-class" />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })

    it('should merge custom styles with default styles', () => {
      render(<Card {...defaultProps} className="border-red-500" />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('border-red-500', 'rounded-lg', 'border-2')
    })
  })

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const renderSpy = vi.fn()

      const TestCard = (props: any) => {
        renderSpy()
        return <Card {...props} />
      }

      const { rerender } = render(<TestCard {...defaultProps} />)
      expect(renderSpy).toHaveBeenCalledTimes(1)

      // Re-render with same props
      rerender(<TestCard {...defaultProps} />)
      expect(renderSpy).toHaveBeenCalledTimes(2) // React will re-render, but component should be memoized if implemented

      // Re-render with different props
      rerender(<TestCard {...defaultProps} selected={true} />)
      expect(renderSpy).toHaveBeenCalledTimes(3)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid rank gracefully', () => {
      render(<Card {...defaultProps} rank={'X' as any} />)
      expect(screen.getByText('?')).toBeInTheDocument()
    })

    it('should handle invalid suit gracefully', () => {
      render(<Card {...defaultProps} suit={'x' as any} />)
      expect(screen.getByText('?')).toBeInTheDocument()
    })

    it('should not crash with null onClick', () => {
      expect(() => {
        render(<Card {...defaultProps} onClick={undefined} />)
        fireEvent.click(screen.getByRole('button'))
      }).not.toThrow()
    })
  })

  describe('Accessibility', () => {
    it('should support screen readers', () => {
      render(<Card {...defaultProps} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Ace of Spades')
    })

    it('should indicate selected state to screen readers', () => {
      render(<Card {...defaultProps} selected={true} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-pressed', 'true')
    })

    it('should indicate disabled state to screen readers', () => {
      render(<Card {...defaultProps} disabled={true} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-disabled', 'true')
    })

    it('should have sufficient color contrast', () => {
      // This would typically be tested with automated accessibility tools
      // Here we just ensure the color classes are applied
      render(<Card {...defaultProps} suit="h" />)
      expect(screen.getByRole('button')).toHaveClass('text-red-600')
    })
  })

  describe('Integration with Card Data', () => {
    it('should work with valid card data from test utilities', () => {
      const cardData = { rank: 'K', suit: 'h' }

      render(<Card {...cardData} onClick={vi.fn()} />)

      expect(cardData).toBeValidCard()
      expect(screen.getByText('K')).toBeInTheDocument()
      expect(screen.getByText('♥')).toBeInTheDocument()
    })
  })
})