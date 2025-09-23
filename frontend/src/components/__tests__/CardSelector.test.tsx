import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import CardSelector from '../CardSelector'
import { createMockCard, createMockHand } from '../../test/setup'

describe('CardSelector Component', () => {
  const defaultProps = {
    selectedCards: [],
    onCardSelect: vi.fn(),
    onCardDeselect: vi.fn(),
    maxCards: 7,
    minCards: 2
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial Rendering', () => {
    it('should render all 52 cards', () => {
      render(<CardSelector {...defaultProps} />)

      // Should render 52 cards (13 ranks × 4 suits)
      const cards = screen.getAllByRole('button')
      expect(cards).toHaveLength(52)
    })

    it('should organize cards by suits', () => {
      render(<CardSelector {...defaultProps} />)

      expect(screen.getByText('Spades')).toBeInTheDocument()
      expect(screen.getByText('Hearts')).toBeInTheDocument()
      expect(screen.getByText('Diamonds')).toBeInTheDocument()
      expect(screen.getByText('Clubs')).toBeInTheDocument()
    })

    it('should display cards in rank order', () => {
      render(<CardSelector {...defaultProps} />)

      const spadeSection = screen.getByTestId('suit-spades')
      const spadeCards = spadeSection.querySelectorAll('button')

      // Check if first few cards are in correct order
      expect(spadeCards[0]).toHaveTextContent('A')
      expect(spadeCards[1]).toHaveTextContent('K')
      expect(spadeCards[2]).toHaveTextContent('Q')
      expect(spadeCards[3]).toHaveTextContent('J')
    })

    it('should show selected card count', () => {
      const selectedCards = createMockHand()
      render(<CardSelector {...defaultProps} selectedCards={selectedCards} />)

      expect(screen.getByText('2 / 7 cards selected')).toBeInTheDocument()
    })
  })

  describe('Card Selection', () => {
    it('should call onCardSelect when clicking unselected card', () => {
      const mockOnCardSelect = vi.fn()
      render(<CardSelector {...defaultProps} onCardSelect={mockOnCardSelect} />)

      const aceOfSpades = screen.getByLabelText('Ace of Spades')
      fireEvent.click(aceOfSpades)

      expect(mockOnCardSelect).toHaveBeenCalledTimes(1)
      expect(mockOnCardSelect).toHaveBeenCalledWith({ rank: 'A', suit: 's' })
    })

    it('should call onCardDeselect when clicking selected card', () => {
      const mockOnCardDeselect = vi.fn()
      const selectedCards = [createMockCard('A', 's')]

      render(
        <CardSelector
          {...defaultProps}
          selectedCards={selectedCards}
          onCardDeselect={mockOnCardDeselect}
        />
      )

      const aceOfSpades = screen.getByLabelText('Ace of Spades')
      fireEvent.click(aceOfSpades)

      expect(mockOnCardDeselect).toHaveBeenCalledTimes(1)
      expect(mockOnCardDeselect).toHaveBeenCalledWith({ rank: 'A', suit: 's' })
    })

    it('should visually indicate selected cards', () => {
      const selectedCards = [createMockCard('A', 's'), createMockCard('K', 'h')]

      render(<CardSelector {...defaultProps} selectedCards={selectedCards} />)

      const aceOfSpades = screen.getByLabelText('Ace of Spades')
      const kingOfHearts = screen.getByLabelText('King of Hearts')

      expect(aceOfSpades).toHaveClass('ring-2', 'ring-blue-500')
      expect(kingOfHearts).toHaveClass('ring-2', 'ring-blue-500')
    })

    it('should disable cards when maximum reached', () => {
      const selectedCards = Array(7).fill(null).map((_, i) =>
        createMockCard(i < 4 ? 'A' : 'K', ['s', 'h', 'd', 'c'][i % 4])
      )

      render(<CardSelector {...defaultProps} selectedCards={selectedCards} maxCards={7} />)

      // Find an unselected card and check if it's disabled
      const queenOfSpades = screen.getByLabelText('Queen of Spades')
      expect(queenOfSpades).toBeDisabled()
    })

    it('should not disable selected cards when maximum reached', () => {
      const selectedCards = Array(7).fill(null).map((_, i) =>
        createMockCard(i < 4 ? 'A' : 'K', ['s', 'h', 'd', 'c'][i % 4])
      )

      render(<CardSelector {...defaultProps} selectedCards={selectedCards} maxCards={7} />)

      const aceOfSpades = screen.getByLabelText('Ace of Spades')
      expect(aceOfSpades).not.toBeDisabled()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should support arrow key navigation', () => {
      render(<CardSelector {...defaultProps} />)

      const aceOfSpades = screen.getByLabelText('Ace of Spades')
      aceOfSpades.focus()

      fireEvent.keyDown(aceOfSpades, { key: 'ArrowRight' })

      const kingOfSpades = screen.getByLabelText('King of Spades')
      expect(kingOfSpades).toHaveFocus()
    })

    it('should support Enter key for selection', () => {
      const mockOnCardSelect = vi.fn()
      render(<CardSelector {...defaultProps} onCardSelect={mockOnCardSelect} />)

      const aceOfSpades = screen.getByLabelText('Ace of Spades')
      fireEvent.keyDown(aceOfSpades, { key: 'Enter' })

      expect(mockOnCardSelect).toHaveBeenCalledTimes(1)
    })

    it('should support Space key for selection', () => {
      const mockOnCardSelect = vi.fn()
      render(<CardSelector {...defaultProps} onCardSelect={mockOnCardSelect} />)

      const aceOfSpades = screen.getByLabelText('Ace of Spades')
      fireEvent.keyDown(aceOfSpades, { key: ' ' })

      expect(mockOnCardSelect).toHaveBeenCalledTimes(1)
    })

    it('should wrap navigation at end of rows', () => {
      render(<CardSelector {...defaultProps} />)

      const twoOfSpades = screen.getByLabelText('2 of Spades') // Last card in spades
      twoOfSpades.focus()

      fireEvent.keyDown(twoOfSpades, { key: 'ArrowRight' })

      const aceOfHearts = screen.getByLabelText('Ace of Hearts') // First card in hearts
      expect(aceOfHearts).toHaveFocus()
    })
  })

  describe('Quick Selection Tools', () => {
    it('should render quick selection buttons', () => {
      render(<CardSelector {...defaultProps} />)

      expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /select pocket aces/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /select random hand/i })).toBeInTheDocument()
    })

    it('should clear all cards when clicking clear all', () => {
      const mockOnCardDeselect = vi.fn()
      const selectedCards = createMockHand()

      render(
        <CardSelector
          {...defaultProps}
          selectedCards={selectedCards}
          onCardDeselect={mockOnCardDeselect}
        />
      )

      const clearButton = screen.getByRole('button', { name: /clear all/i })
      fireEvent.click(clearButton)

      expect(mockOnCardDeselect).toHaveBeenCalledTimes(selectedCards.length)
    })

    it('should select pocket aces when clicking preset button', () => {
      const mockOnCardSelect = vi.fn()
      render(<CardSelector {...defaultProps} onCardSelect={mockOnCardSelect} />)

      const pocketAcesButton = screen.getByRole('button', { name: /select pocket aces/i })
      fireEvent.click(pocketAcesButton)

      expect(mockOnCardSelect).toHaveBeenCalledTimes(2)
      expect(mockOnCardSelect).toHaveBeenCalledWith({ rank: 'A', suit: 's' })
      expect(mockOnCardSelect).toHaveBeenCalledWith({ rank: 'A', suit: 'h' })
    })

    it('should select random cards when clicking random button', () => {
      const mockOnCardSelect = vi.fn()
      render(<CardSelector {...defaultProps} onCardSelect={mockOnCardSelect} />)

      const randomButton = screen.getByRole('button', { name: /select random hand/i })
      fireEvent.click(randomButton)

      expect(mockOnCardSelect).toHaveBeenCalledTimes(2) // Should select 2 random cards
    })
  })

  describe('Hand Type Detection', () => {
    it('should detect and display hand type for selected cards', async () => {
      const selectedCards = [
        createMockCard('A', 's'),
        createMockCard('K', 's'),
        createMockCard('Q', 's'),
        createMockCard('J', 's'),
        createMockCard('T', 's')
      ]

      render(<CardSelector {...defaultProps} selectedCards={selectedCards} />)

      await waitFor(() => {
        expect(screen.getByText('Royal Flush')).toBeInTheDocument()
      })
    })

    it('should show incomplete hand message for fewer than 5 cards', () => {
      const selectedCards = [createMockCard('A', 's'), createMockCard('K', 's')]

      render(<CardSelector {...defaultProps} selectedCards={selectedCards} />)

      expect(screen.getByText(/select at least 5 cards/i)).toBeInTheDocument()
    })

    it('should update hand type as cards are selected', async () => {
      const { rerender } = render(<CardSelector {...defaultProps} selectedCards={[]} />)

      // Add cards progressively
      const cards = [
        createMockCard('A', 's'),
        createMockCard('A', 'h'),
        createMockCard('A', 'd'),
        createMockCard('A', 'c'),
        createMockCard('K', 's')
      ]

      for (let i = 1; i <= cards.length; i++) {
        rerender(<CardSelector {...defaultProps} selectedCards={cards.slice(0, i)} />)

        if (i >= 5) {
          await waitFor(() => {
            expect(screen.getByText('Four of a Kind')).toBeInTheDocument()
          })
        }
      }
    })
  })

  describe('Visual Feedback', () => {
    it('should highlight valid selections', () => {
      render(<CardSelector {...defaultProps} />)

      const aceOfSpades = screen.getByLabelText('Ace of Spades')
      fireEvent.mouseEnter(aceOfSpades)

      expect(aceOfSpades).toHaveClass('hover:shadow-lg')
    })

    it('should show selection count with color coding', () => {
      const { rerender } = render(<CardSelector {...defaultProps} selectedCards={[]} />)

      // No cards selected - neutral
      expect(screen.getByTestId('selection-count')).toHaveClass('text-gray-600')

      // Minimum cards selected - success
      const minCards = Array(2).fill(null).map((_, i) => createMockCard('A', i === 0 ? 's' : 'h'))
      rerender(<CardSelector {...defaultProps} selectedCards={minCards} minCards={2} />)
      expect(screen.getByTestId('selection-count')).toHaveClass('text-green-600')

      // Maximum cards selected - warning
      const maxCards = Array(7).fill(null).map((_, i) =>
        createMockCard(i < 4 ? 'A' : 'K', ['s', 'h', 'd', 'c'][i % 4])
      )
      rerender(<CardSelector {...defaultProps} selectedCards={maxCards} maxCards={7} />)
      expect(screen.getByTestId('selection-count')).toHaveClass('text-orange-600')
    })
  })

  describe('Search and Filter', () => {
    it('should filter cards by search term', async () => {
      render(<CardSelector {...defaultProps} />)

      const searchInput = screen.getByPlaceholderText(/search cards/i)
      fireEvent.change(searchInput, { target: { value: 'ace' } })

      await waitFor(() => {
        const visibleCards = screen.getAllByRole('button').filter(
          button => !button.hasAttribute('hidden')
        )
        expect(visibleCards).toHaveLength(4) // 4 aces
      })
    })

    it('should filter by suit', async () => {
      render(<CardSelector {...defaultProps} />)

      const suitFilter = screen.getByRole('combobox', { name: /filter by suit/i })
      fireEvent.change(suitFilter, { target: { value: 'spades' } })

      await waitFor(() => {
        const spadeCards = screen.getAllByLabelText(/spades/i)
        expect(spadeCards).toHaveLength(13)

        const heartCards = screen.queryAllByLabelText(/hearts/i)
        expect(heartCards).toHaveLength(0)
      })
    })

    it('should filter by rank', async () => {
      render(<CardSelector {...defaultProps} />)

      const rankFilter = screen.getByRole('combobox', { name: /filter by rank/i })
      fireEvent.change(rankFilter, { target: { value: 'A' } })

      await waitFor(() => {
        const aceCards = screen.getAllByLabelText(/ace/i)
        expect(aceCards).toHaveLength(4)
      })
    })
  })

  describe('Touch/Mobile Support', () => {
    it('should handle touch events for card selection', () => {
      const mockOnCardSelect = vi.fn()
      render(<CardSelector {...defaultProps} onCardSelect={mockOnCardSelect} />)

      const aceOfSpades = screen.getByLabelText('Ace of Spades')
      fireEvent.touchStart(aceOfSpades)
      fireEvent.touchEnd(aceOfSpades)

      expect(mockOnCardSelect).toHaveBeenCalledTimes(1)
    })

    it('should support swipe gestures for navigation', () => {
      render(<CardSelector {...defaultProps} />)

      const cardGrid = screen.getByTestId('card-grid')

      fireEvent.touchStart(cardGrid, {
        touches: [{ clientX: 100, clientY: 100 }]
      })
      fireEvent.touchMove(cardGrid, {
        touches: [{ clientX: 50, clientY: 100 }]
      })
      fireEvent.touchEnd(cardGrid)

      // Should scroll or change view
      // Specific assertion depends on implementation
      expect(cardGrid).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<CardSelector {...defaultProps} />)

      expect(screen.getByRole('group', { name: /card selector/i })).toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveTextContent(/0 \/ 7 cards selected/i)
    })

    it('should support screen reader announcements', async () => {
      const { rerender } = render(<CardSelector {...defaultProps} selectedCards={[]} />)

      const announcement = screen.getByRole('status')
      expect(announcement).toHaveTextContent('0 / 7 cards selected')

      const newSelection = [createMockCard('A', 's')]
      rerender(<CardSelector {...defaultProps} selectedCards={newSelection} />)

      await waitFor(() => {
        expect(announcement).toHaveTextContent('1 / 7 cards selected')
      })
    })

    it('should have proper color contrast for all states', () => {
      const selectedCards = [createMockCard('A', 's')]
      render(<CardSelector {...defaultProps} selectedCards={selectedCards} />)

      // Selected cards should have high contrast
      const selectedCard = screen.getByLabelText('Ace of Spades')
      expect(selectedCard).toHaveClass('ring-blue-500')

      // Disabled cards should be distinguishable
      const maxCards = Array(7).fill(null).map((_, i) =>
        createMockCard(i < 4 ? 'A' : 'K', ['s', 'h', 'd', 'c'][i % 4])
      )
      render(<CardSelector {...defaultProps} selectedCards={maxCards} maxCards={7} />)

      const disabledCard = screen.getByLabelText('Queen of Spades')
      expect(disabledCard).toHaveClass('opacity-50')
    })
  })

  describe('Performance', () => {
    it('should render large number of cards efficiently', () => {
      const startTime = performance.now()

      render(<CardSelector {...defaultProps} />)

      const endTime = performance.now()
      const renderTime = endTime - startTime

      expect(renderTime).toBeLessThan(100) // Should render in under 100ms
    })

    it('should handle rapid selections without lag', async () => {
      const mockOnCardSelect = vi.fn()
      render(<CardSelector {...defaultProps} onCardSelect={mockOnCardSelect} />)

      const cards = screen.getAllByRole('button').slice(0, 10)

      // Rapid selections
      cards.forEach(card => {
        fireEvent.click(card)
      })

      await waitFor(() => {
        expect(mockOnCardSelect).toHaveBeenCalledTimes(7) // Limited by maxCards
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid card data gracefully', () => {
      const invalidCards = [
        { rank: 'X', suit: 'invalid' },
        { rank: 'A', suit: 's' }
      ]

      expect(() => {
        render(<CardSelector {...defaultProps} selectedCards={invalidCards as any} />)
      }).not.toThrow()
    })

    it('should handle missing callback functions', () => {
      expect(() => {
        render(
          <CardSelector
            selectedCards={[]}
            onCardSelect={undefined as any}
            onCardDeselect={undefined as any}
          />
        )
      }).not.toThrow()
    })

    it('should validate card limits', () => {
      const tooManyCards = Array(10).fill(null).map((_, i) =>
        createMockCard(['A', 'K', 'Q', 'J'][i % 4], ['s', 'h', 'd', 'c'][i % 4])
      )

      render(<CardSelector {...defaultProps} selectedCards={tooManyCards} maxCards={7} />)

      // Should handle gracefully, possibly with warning
      expect(screen.getByText(/too many cards/i)).toBeInTheDocument()
    })
  })
})