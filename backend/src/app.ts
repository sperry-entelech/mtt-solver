import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'MTT Poker Solver API',
    version: '1.0.0'
  });
});

// API Routes placeholder
app.get('/api', (req, res) => {
  res.json({
    message: 'MTT Poker Solver API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      docs: '/api/docs',
      icm: '/api/icm',
      solver: '/api/solver',
      hands: '/api/hands',
      ranges: '/api/ranges'
    }
  });
});

// ICM endpoints
app.post('/api/icm/calculate', (req, res) => {
  // Placeholder ICM calculation
  const { stacks, payouts } = req.body;

  if (!stacks || !payouts) {
    return res.status(400).json({ error: 'Missing required parameters: stacks, payouts' });
  }

  // Simple ICM approximation for demo
  const totalChips = stacks.reduce((sum: number, stack: number) => sum + stack, 0);
  const totalPrizes = payouts.reduce((sum: number, payout: number) => sum + payout, 0);

  const icmValues = stacks.map((stack: number) => {
    const chipPercentage = stack / totalChips;
    return Math.round(chipPercentage * totalPrizes);
  });

  res.json({ icmValues, totalPrizePool: totalPrizes });
});

// Hand evaluation endpoint
app.post('/api/hands/evaluate', (req, res) => {
  const { cards } = req.body;

  if (!cards || !Array.isArray(cards)) {
    return res.status(400).json({ error: 'Missing required parameter: cards array' });
  }

  // Placeholder hand evaluation
  res.json({
    handType: 'HIGH_CARD',
    strength: 1000,
    cards: cards.slice(0, 5),
    description: 'High Card evaluation (demo mode)'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MTT Poker Solver API running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🃏 API docs: http://localhost:${PORT}/api`);
});

export { app };