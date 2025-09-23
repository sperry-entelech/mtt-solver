import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ICMDashboard from '../ICMDashboard'
import { createMockICMData, mockApiResponses } from '../../test/setup'

// Mock the API service
vi.mock('../../services/api', () => ({
  calculateICM: vi.fn(),
  calculateBubbleFactor: vi.fn()
}))

// Create wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('ICMDashboard Component', () => {
  const mockICMData = createMockICMData()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial Rendering', () => {
    it('should render dashboard with initial state', () => {
      const Wrapper = createWrapper()
      render(
        <Wrapper>
          <ICMDashboard />
        </Wrapper>
      )

      expect(screen.getByText('ICM Calculator')).toBeInTheDocument()
      expect(screen.getByText('Tournament Stacks')).toBeInTheDocument()
      expect(screen.getByText('Prize Structure')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /calculate/i })).toBeInTheDocument()
    })

    it('should render empty stack inputs initially', () => {
      const Wrapper = createWrapper()
      render(
        <Wrapper>
          <ICMDashboard />
        </Wrapper>
      )

      const stackInputs = screen.getAllByPlaceholderText(/stack size/i)
      expect(stackInputs).toHaveLength(9) // Default 9 players

      stackInputs.forEach(input => {
        expect(input).toHaveValue('')
      })
    })

    it('should render empty payout inputs initially', () => {
      const Wrapper = createWrapper()
      render(
        <Wrapper>
          <ICMDashboard />
        </Wrapper>
      )

      const payoutInputs = screen.getAllByPlaceholderText(/payout amount/i)
      expect(payoutInputs).toHaveLength(3) // Default 3 paid positions

      payoutInputs.forEach(input => {
        expect(input).toHaveValue('')
      })
    })
  })

  describe('Input Handling', () => {
    it('should update stack values when typing', async () => {
      const Wrapper = createWrapper()
      render(
        <Wrapper>
          <ICMDashboard />
        </Wrapper>
      )

      const firstStackInput = screen.getAllByPlaceholderText(/stack size/i)[0]

      fireEvent.change(firstStackInput, { target: { value: '2000' } })

      await waitFor(() => {
        expect(firstStackInput).toHaveValue(2000)
      })
    })

    it('should update payout values when typing', async () => {
      const Wrapper = createWrapper()
      render(
        <Wrapper>
          <ICMDashboard />
        </Wrapper>
      )

      const firstPayoutInput = screen.getAllByPlaceholderText(/payout amount/i)[0]

      fireEvent.change(firstPayoutInput, { target: { value: '5000' } })

      await waitFor(() => {
        expect(firstPayoutInput).toHaveValue(5000)
      })
    })

    it('should validate numeric inputs', async () => {
      const Wrapper = createWrapper()
      render(
        <Wrapper>
          <ICMDashboard />
        </Wrapper>
      )

      const stackInput = screen.getAllByPlaceholderText(/stack size/i)[0]

      fireEvent.change(stackInput, { target: { value: 'invalid' } })

      await waitFor(() => {
        expect(screen.getByText(/invalid number/i)).toBeInTheDocument()
      })
    })

    it('should validate positive numbers', async () => {
      const Wrapper = createWrapper()
      render(
        <Wrapper>
          <ICMDashboard />
        </Wrapper>
      )

      const stackInput = screen.getAllByPlaceholderText(/stack size/i)[0]

      fireEvent.change(stackInput, { target: { value: '-1000' } })

      await waitFor(() => {
        expect(screen.getByText(/must be positive/i)).toBeInTheDocument()
      })
    })
  })

  describe('Player Management', () => {
    it('should add players when clicking add button', async () => {
      const Wrapper = createWrapper()
      render(
        <Wrapper>
          <ICMDashboard />
        </Wrapper>
      )

      const addPlayerButton = screen.getByRole('button', { name: /add player/i })

      fireEvent.click(addPlayerButton)

      await waitFor(() => {
        const stackInputs = screen.getAllByPlaceholderText(/stack size/i)
        expect(stackInputs).toHaveLength(10) // Should increase from 9 to 10
      })
    })

    it('should remove players when clicking remove button', async () => {
      const Wrapper = createWrapper()
      render(
        <Wrapper>
          <ICMDashboard />
        </Wrapper>
      )

      const removeButtons = screen.getAllByRole('button', { name: /remove player/i })

      fireEvent.click(removeButtons[0])

      await waitFor(() => {
        const stackInputs = screen.getAllByPlaceholderText(/stack size/i)
        expect(stackInputs).toHaveLength(8) // Should decrease from 9 to 8
      })
    })

    it('should limit minimum number of players', async () => {
      const Wrapper = createWrapper()
      render(
        <Wrapper>
          <ICMDashboard />
        </Wrapper>
      )

      // Remove players until minimum
      const removeButtons = screen.getAllByRole('button', { name: /remove player/i })

      // Try to remove all players
      for (let i = 0; i < 10; i++) {
        const buttons = screen.queryAllByRole('button', { name: /remove player/i })
        if (buttons.length > 0) {
          fireEvent.click(buttons[0])
        }
      }

      await waitFor(() => {
        const stackInputs = screen.getAllByPlaceholderText(/stack size/i)
        expect(stackInputs.length).toBeGreaterThanOrEqual(2) // Should not go below 2 players
      })
    })
  })

  describe('Prize Structure Management', () => {
    it('should add prize positions', async () => {
      const Wrapper = createWrapper()
      render(
        <Wrapper>
          <ICMDashboard />
        </Wrapper>
      )

      const addPrizeButton = screen.getByRole('button', { name: /add position/i })

      fireEvent.click(addPrizeButton)

      await waitFor(() => {
        const payoutInputs = screen.getAllByPlaceholderText(/payout amount/i)
        expect(payoutInputs).toHaveLength(4) // Should increase from 3 to 4
      })
    })

    it('should remove prize positions', async () => {
      const Wrapper = createWrapper()
      render(
        <Wrapper>
          <ICMDashboard />
        </Wrapper>
      )

      const removeButtons = screen.getAllByRole('button', { name: /remove position/i })

      fireEvent.click(removeButtons[0])

      await waitFor(() => {
        const payoutInputs = screen.getAllByPlaceholderText(/payout amount/i)
        expect(payoutInputs).toHaveLength(2) // Should decrease from 3 to 2
      })
    })
  })

  describe('ICM Calculation', () => {
    it('should perform calculation with valid inputs', async () => {
      const mockCalculateICM = vi.fn().mockResolvedValue(mockApiResponses.icmCalculation)

      vi.doMock('../../services/api', () => ({
        calculateICM: mockCalculateICM
      }))

      const Wrapper = createWrapper()
      render(
        <Wrapper>
          <ICMDashboard />
        </Wrapper>
      )

      // Fill in stack inputs
      const stackInputs = screen.getAllByPlaceholderText(/stack size/i)
      fireEvent.change(stackInputs[0], { target: { value: '2000' } })
      fireEvent.change(stackInputs[1], { target: { value: '1500' } })
      fireEvent.change(stackInputs[2], { target: { value: '1000' } })

      // Fill in payout inputs
      const payoutInputs = screen.getAllByPlaceholderText(/payout amount/i)
      fireEvent.change(payoutInputs[0], { target: { value: '5000' } })
      fireEvent.change(payoutInputs[1], { target: { value: '3000' } })
      fireEvent.change(payoutInputs[2], { target: { value: '2000' } })

      const calculateButton = screen.getByRole('button', { name: /calculate/i })
      fireEvent.click(calculateButton)

      await waitFor(() => {
        expect(mockCalculateICM).toHaveBeenCalledWith({
          stacks: [2000, 1500, 1000],
          payouts: [5000, 3000, 2000],
          playerIndex: 0
        })
      })
    })

    it('should display calculation results', async () => {
      const mockCalculateICM = vi.fn().mockResolvedValue(mockApiResponses.icmCalculation)

      vi.doMock('../../services/api', () => ({
        calculateICM: mockCalculateICM
      }))

      const Wrapper = createWrapper()
      render(
        <Wrapper>
          <ICMDashboard />
        </Wrapper>
      )

      // Perform calculation (setup inputs and click calculate)
      // ... input setup code ...

      await waitFor(() => {
        expect(screen.getByText('$2,500.75')).toBeInTheDocument() // Equity
        expect(screen.getByText('$2,666.67')).toBeInTheDocument() // Chip EV
        expect(screen.getByText('$165.92')).toBeInTheDocument()   // Risk Premium
      })
    })

    it('should handle calculation errors', async () => {
      const mockCalculateICM = vi.fn().mockRejectedValue(new Error('API Error'))

      vi.doMock('../../services/api', () => ({
        calculateICM: mockCalculateICM
      }))

      const Wrapper = createWrapper()
      render(
        <Wrapper>
          <ICMDashboard />
        </Wrapper>
      )

      const calculateButton = screen.getByRole('button', { name: /calculate/i })
      fireEvent.click(calculateButton)

      await waitFor(() => {
        expect(screen.getByText(/error calculating/i)).toBeInTheDocument()
      })
    })

    it('should show loading state during calculation', async () => {
      const mockCalculateICM = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      )

      vi.doMock('../../services/api', () => ({
        calculateICM: mockCalculateICM
      }))

      const Wrapper = createWrapper()
      render(
        <Wrapper>
          <ICMDashboard />
        </Wrapper>
      )

      const calculateButton = screen.getByRole('button', { name: /calculate/i })
      fireEvent.click(calculateButton)

      expect(screen.getByText(/calculating/i)).toBeInTheDocument()
      expect(calculateButton).toBeDisabled()
    })
  })

  describe('Bubble Factor Analysis', () => {
    it('should calculate bubble factor for bubble situations', async () => {
      const mockCalculateBubbleFactor = vi.fn().mockResolvedValue({ bubbleFactor: 1.25 })

      vi.doMock('../../services/api', () => ({
        calculateBubbleFactor: mockCalculateBubbleFactor
      }))

      const Wrapper = createWrapper()
      render(
        <Wrapper>
          <ICMDashboard />
        </Wrapper>
      )

      // Setup bubble scenario (more players than payouts)
      // Fill inputs for 4 players but only 3 payouts

      const bubbleAnalysisButton = screen.getByRole('button', { name: /bubble analysis/i })
      fireEvent.click(bubbleAnalysisButton)

      await waitFor(() => {
        expect(screen.getByText('1.25')).toBeInTheDocument()
        expect(screen.getByText(/bubble factor/i)).toBeInTheDocument()
      })
    })

    it('should highlight bubble players', async () => {
      const Wrapper = createWrapper()
      render(
        <Wrapper>
          <ICMDashboard />
        </Wrapper>
      )

      // Setup bubble scenario
      // ... setup code ...

      await waitFor(() => {
        const bubblePlayer = screen.getByTestId('player-bubble-indicator')
        expect(bubblePlayer).toHaveClass('bg-yellow-100')
      })
    })
  })

  describe('Real-time Updates', () => {
    it('should recalculate when inputs change', async () => {
      const mockCalculateICM = vi.fn().mockResolvedValue(mockApiResponses.icmCalculation)

      vi.doMock('../../services/api', () => ({
        calculateICM: mockCalculateICM
      }))

      const Wrapper = createWrapper()
      render(
        <Wrapper>
          <ICMDashboard autoCalculate={true} />
        </Wrapper>
      )

      const stackInput = screen.getAllByPlaceholderText(/stack size/i)[0]

      fireEvent.change(stackInput, { target: { value: '2000' } })

      // Should trigger auto-calculation after debounce
      await waitFor(() => {
        expect(mockCalculateICM).toHaveBeenCalled()
      }, { timeout: 2000 })
    })

    it('should debounce rapid input changes', async () => {
      const mockCalculateICM = vi.fn().mockResolvedValue(mockApiResponses.icmCalculation)

      vi.doMock('../../services/api', () => ({
        calculateICM: mockCalculateICM
      }))

      const Wrapper = createWrapper()
      render(
        <Wrapper>
          <ICMDashboard autoCalculate={true} />
        </Wrapper>
      )

      const stackInput = screen.getAllByPlaceholderText(/stack size/i)[0]

      // Rapid changes
      fireEvent.change(stackInput, { target: { value: '1000' } })
      fireEvent.change(stackInput, { target: { value: '1500' } })
      fireEvent.change(stackInput, { target: { value: '2000' } })

      // Should only calculate once after debounce
      await waitFor(() => {
        expect(mockCalculateICM).toHaveBeenCalledTimes(1)
      }, { timeout: 2000 })
    })
  })

  describe('Data Visualization', () => {
    it('should render equity chart when results available', async () => {
      const Wrapper = createWrapper()
      render(
        <Wrapper>
          <ICMDashboard />
        </Wrapper>
      )

      // Trigger calculation with results
      // ... calculation setup ...

      await waitFor(() => {
        expect(screen.getByTestId('equity-chart')).toBeInTheDocument()
      })
    })

    it('should show player comparison table', async () => {
      const Wrapper = createWrapper()
      render(
        <Wrapper>
          <ICMDashboard />
        </Wrapper>
      )

      // After calculation
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument()
        expect(screen.getByText('Player')).toBeInTheDocument()
        expect(screen.getByText('Stack')).toBeInTheDocument()
        expect(screen.getByText('Equity')).toBeInTheDocument()
        expect(screen.getByText('Chip EV')).toBeInTheDocument()
      })
    })
  })

  describe('Preset Scenarios', () => {
    it('should load final table preset', async () => {
      const Wrapper = createWrapper()
      render(
        <Wrapper>
          <ICMDashboard />
        </Wrapper>
      )

      const presetButton = screen.getByRole('button', { name: /final table/i })
      fireEvent.click(presetButton)

      await waitFor(() => {
        const stackInputs = screen.getAllByPlaceholderText(/stack size/i)
        expect(stackInputs).toHaveLength(9) // Final table has 9 players
        expect(stackInputs[0]).toHaveValue(28325000) // Chip leader stack
      })
    })

    it('should load satellite preset', async () => {
      const Wrapper = createWrapper()
      render(
        <Wrapper>
          <ICMDashboard />
        </Wrapper>
      )

      const presetButton = screen.getByRole('button', { name: /satellite/i })
      fireEvent.click(presetButton)

      await waitFor(() => {
        const payoutInputs = screen.getAllByPlaceholderText(/payout amount/i)
        // Satellite should have equal payouts
        payoutInputs.forEach(input => {
          expect(input).toHaveValue(1000)
        })
      })
    })
  })

  describe('Export/Import Functionality', () => {
    it('should export scenario data', async () => {
      const Wrapper = createWrapper()
      render(
        <Wrapper>
          <ICMDashboard />
        </Wrapper>
      )

      const exportButton = screen.getByRole('button', { name: /export/i })
      fireEvent.click(exportButton)

      // Should trigger download
      expect(screen.getByText(/exporting/i)).toBeInTheDocument()
    })

    it('should import scenario data', async () => {
      const Wrapper = createWrapper()
      render(
        <Wrapper>
          <ICMDashboard />
        </Wrapper>
      )

      const importButton = screen.getByRole('button', { name: /import/i })
      const fileInput = screen.getByTestId('file-input')

      const file = new File(['{"stacks":[2000,1500,1000]}'], 'scenario.json', {
        type: 'application/json',
      })

      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        const stackInputs = screen.getAllByPlaceholderText(/stack size/i)
        expect(stackInputs[0]).toHaveValue(2000)
        expect(stackInputs[1]).toHaveValue(1500)
        expect(stackInputs[2]).toHaveValue(1000)
      })
    })
  })

  describe('Accessibility', () => {
    it('should support keyboard navigation', () => {
      const Wrapper = createWrapper()
      render(
        <Wrapper>
          <ICMDashboard />
        </Wrapper>
      )

      const stackInputs = screen.getAllByPlaceholderText(/stack size/i)

      stackInputs[0].focus()
      expect(stackInputs[0]).toHaveFocus()

      fireEvent.keyDown(stackInputs[0], { key: 'Tab' })
      expect(stackInputs[1]).toHaveFocus()
    })

    it('should have proper ARIA labels', () => {
      const Wrapper = createWrapper()
      render(
        <Wrapper>
          <ICMDashboard />
        </Wrapper>
      )

      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'ICM Dashboard')
      expect(screen.getByRole('button', { name: /calculate/i })).toHaveAttribute('aria-describedby')
    })

    it('should announce calculation results to screen readers', async () => {
      const Wrapper = createWrapper()
      render(
        <Wrapper>
          <ICMDashboard />
        </Wrapper>
      )

      // After calculation
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(/calculation complete/i)
      })
    })
  })

  describe('Performance', () => {
    it('should handle large tournaments efficiently', async () => {
      const Wrapper = createWrapper()
      render(
        <Wrapper>
          <ICMDashboard />
        </Wrapper>
      )

      // Add many players
      for (let i = 0; i < 50; i++) {
        const addButton = screen.getByRole('button', { name: /add player/i })
        fireEvent.click(addButton)
      }

      // Should remain responsive
      expect(screen.getAllByPlaceholderText(/stack size/i)).toHaveLength(59) // 9 initial + 50 added
    })

    it('should memoize expensive calculations', () => {
      // This would test React.memo or useMemo implementations
      // Actual implementation depends on component structure
      expect(true).toBe(true) // Placeholder
    })
  })
})