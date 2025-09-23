import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ICMDashboard from '../pages/ICMDashboard';

// Mock the API calls
jest.mock('../services/api', () => ({
  calculateICM: jest.fn(),
  calculatePushFoldEquity: jest.fn(),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
    h1: ({ children, className, ...props }: any) => (
      <h1 className={className} {...props}>
        {children}
      </h1>
    ),
    button: ({ children, className, onClick, ...props }: any) => (
      <button className={className} onClick={onClick} {...props}>
        {children}
      </button>
    ),
  },
}));

// Mock useAnimations hook
jest.mock('../hooks/useAnimations', () => ({
  useAnimations: () => ({
    slideInUp: {
      initial: { opacity: 0, y: 50 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.5 }
    },
    staggerChildren: {
      animate: { transition: { staggerChildren: 0.1 } }
    }
  })
}));

import { calculateICM, calculatePushFoldEquity } from '../services/api';

const mockCalculateICM = calculateICM as jest.MockedFunction<typeof calculateICM>;
const mockCalculatePushFoldEquity = calculatePushFoldEquity as jest.MockedFunction<typeof calculatePushFoldEquity>;

describe('ICMDashboard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('renders ICM dashboard with all sections', () => {
    renderWithQueryClient(<ICMDashboard />);

    expect(screen.getByText('ICM Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Tournament Setup')).toBeInTheDocument();
    expect(screen.getByText('ICM Values')).toBeInTheDocument();
    expect(screen.getByText('Push/Fold Analysis')).toBeInTheDocument();
  });

  it('allows adding and removing players', () => {
    renderWithQueryClient(<ICMDashboard />);

    // Should start with default number of players
    const stackInputs = screen.getAllByPlaceholderText(/Player \d+ Stack/);
    expect(stackInputs).toHaveLength(4); // Default 4 players

    // Add player
    const addPlayerButton = screen.getByText('Add Player');
    fireEvent.click(addPlayerButton);

    const newStackInputs = screen.getAllByPlaceholderText(/Player \d+ Stack/);
    expect(newStackInputs).toHaveLength(5);

    // Remove player
    const removeButtons = screen.getAllByText('Remove');
    fireEvent.click(removeButtons[0]);

    const finalStackInputs = screen.getAllByPlaceholderText(/Player \d+ Stack/);
    expect(finalStackInputs).toHaveLength(4);
  });

  it('calculates ICM when calculate button is clicked', async () => {
    const mockICMResult = {
      icmValues: [350, 250, 200, 150],
      totalPrizePool: 950
    };

    mockCalculateICM.mockResolvedValue(mockICMResult);

    renderWithQueryClient(<ICMDashboard />);

    // Fill in tournament data
    const stackInputs = screen.getAllByPlaceholderText(/Player \d+ Stack/);
    fireEvent.change(stackInputs[0], { target: { value: '2000' } });
    fireEvent.change(stackInputs[1], { target: { value: '1500' } });
    fireEvent.change(stackInputs[2], { target: { value: '1000' } });
    fireEvent.change(stackInputs[3], { target: { value: '500' } });

    const payoutInputs = screen.getAllByPlaceholderText(/\$\d+/);
    fireEvent.change(payoutInputs[0], { target: { value: '400' } });
    fireEvent.change(payoutInputs[1], { target: { value: '250' } });
    fireEvent.change(payoutInputs[2], { target: { value: '150' } });
    fireEvent.change(payoutInputs[3], { target: { value: '50' } });

    // Click calculate
    const calculateButton = screen.getByText('Calculate ICM');
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(mockCalculateICM).toHaveBeenCalledWith({
        stacks: [2000, 1500, 1000, 500],
        payouts: [400, 250, 150, 50]
      });
    });

    // Check that results are displayed
    await waitFor(() => {
      expect(screen.getByText('$350')).toBeInTheDocument();
      expect(screen.getByText('$250')).toBeInTheDocument();
      expect(screen.getByText('$200')).toBeInTheDocument();
      expect(screen.getByText('$150')).toBeInTheDocument();
    });
  });

  it('calculates push/fold equity', async () => {
    const mockPushFoldResult = {
      pushEquity: 285,
      foldEquity: 250,
      recommendation: 'PUSH' as const
    };

    mockCalculatePushFoldEquity.mockResolvedValue(mockPushFoldResult);

    renderWithQueryClient(<ICMDashboard />);

    // Set up ICM first
    const mockICMResult = {
      icmValues: [350, 250, 200, 150],
      totalPrizePool: 950
    };
    mockCalculateICM.mockResolvedValue(mockICMResult);

    // Fill in basic tournament data and calculate ICM
    const stackInputs = screen.getAllByPlaceholderText(/Player \d+ Stack/);
    stackInputs.forEach((input, index) => {
      fireEvent.change(input, { target: { value: String((4 - index) * 500) } });
    });

    const calculateButton = screen.getByText('Calculate ICM');
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(screen.getByText('Push/Fold Analysis')).toBeInTheDocument();
    });

    // Fill in push/fold scenario
    const heroStackInput = screen.getByPlaceholderText('Your stack size');
    const villainStackInput = screen.getByPlaceholderText('Opponent stack size');
    const winRateInput = screen.getByPlaceholderText('Win rate vs opponent');

    fireEvent.change(heroStackInput, { target: { value: '800' } });
    fireEvent.change(villainStackInput, { target: { value: '1200' } });
    fireEvent.change(winRateInput, { target: { value: '0.65' } });

    // Calculate push/fold
    const analyzePushFoldButton = screen.getByText('Analyze Push/Fold');
    fireEvent.click(analyzePushFoldButton);

    await waitFor(() => {
      expect(mockCalculatePushFoldEquity).toHaveBeenCalled();
    });

    // Check results
    await waitFor(() => {
      expect(screen.getByText('PUSH')).toBeInTheDocument();
      expect(screen.getByText('$285')).toBeInTheDocument();
      expect(screen.getByText('$250')).toBeInTheDocument();
    });
  });

  it('handles ICM calculation errors gracefully', async () => {
    mockCalculateICM.mockRejectedValue(new Error('Calculation failed'));

    renderWithQueryClient(<ICMDashboard />);

    const calculateButton = screen.getByText('Calculate ICM');
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(screen.getByText(/Error calculating ICM/)).toBeInTheDocument();
    });
  });

  it('validates input data before calculation', () => {
    renderWithQueryClient(<ICMDashboard />);

    // Try to calculate with empty inputs
    const calculateButton = screen.getByText('Calculate ICM');
    fireEvent.click(calculateButton);

    // Should not call API with invalid data
    expect(mockCalculateICM).not.toHaveBeenCalled();
  });

  it('updates calculations in real-time when inputs change', async () => {
    renderWithQueryClient(<ICMDashboard />);

    const mockICMResult = {
      icmValues: [350, 250, 200, 150],
      totalPrizePool: 950
    };
    mockCalculateICM.mockResolvedValue(mockICMResult);

    // Fill in data
    const stackInputs = screen.getAllByPlaceholderText(/Player \d+ Stack/);
    fireEvent.change(stackInputs[0], { target: { value: '2000' } });

    // Should debounce and not calculate immediately
    expect(mockCalculateICM).not.toHaveBeenCalled();

    // Complete the form
    fireEvent.change(stackInputs[1], { target: { value: '1500' } });
    fireEvent.change(stackInputs[2], { target: { value: '1000' } });
    fireEvent.change(stackInputs[3], { target: { value: '500' } });

    const payoutInputs = screen.getAllByPlaceholderText(/\$\d+/);
    payoutInputs.forEach((input, index) => {
      fireEvent.change(input, { target: { value: String((5 - index) * 100) } });
    });

    // Now calculate
    const calculateButton = screen.getByText('Calculate ICM');
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(mockCalculateICM).toHaveBeenCalled();
    });
  });

  it('displays chip distribution visualization', async () => {
    renderWithQueryClient(<ICMDashboard />);

    const mockICMResult = {
      icmValues: [350, 250, 200, 150],
      totalPrizePool: 950
    };
    mockCalculateICM.mockResolvedValue(mockICMResult);

    // Set up and calculate
    const stackInputs = screen.getAllByPlaceholderText(/Player \d+ Stack/);
    stackInputs.forEach((input, index) => {
      fireEvent.change(input, { target: { value: String((4 - index) * 500) } });
    });

    const calculateButton = screen.getByText('Calculate ICM');
    fireEvent.click(calculateButton);

    await waitFor(() => {
      // Should display chip percentages
      expect(screen.getByText(/40%/)).toBeInTheDocument(); // Player 1 with 2000 chips
      expect(screen.getByText(/30%/)).toBeInTheDocument(); // Player 2 with 1500 chips
      expect(screen.getByText(/20%/)).toBeInTheDocument(); // Player 3 with 1000 chips
      expect(screen.getByText(/10%/)).toBeInTheDocument(); // Player 4 with 500 chips
    });
  });

  it('shows loading states during calculations', () => {
    renderWithQueryClient(<ICMDashboard />);

    const calculateButton = screen.getByText('Calculate ICM');
    fireEvent.click(calculateButton);

    // Should show loading indicator (assuming it's implemented)
    expect(calculateButton).toBeDisabled();
  });
});