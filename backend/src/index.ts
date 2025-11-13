import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { initializeDatabase, closeDatabase } from './config/database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { monitoringMiddleware, metricsHandler, healthCheckHandler } from './middleware/monitoring';
import { migrationManager } from './config/migrations';
import { initializeWebSocket } from './websocket/server';
import { logger } from './utils/logger';

// Import routes
import solverRoutes from './routes/solver';
import rangeRoutes from './routes/ranges';
import icmRoutes from './routes/icm';
import handRoutes from './routes/hands';
import chartsRoutes from './routes/charts';
import gtoRoutes from './routes/gto';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// General middleware
app.use(limiter);
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Monitoring middleware (should be after other middleware but before routes)
app.use(monitoringMiddleware);

// Health check endpoint
app.get('/health', healthCheckHandler);

// Metrics endpoint (for Prometheus)
if (process.env.ENABLE_METRICS === 'true') {
  app.get('/metrics', metricsHandler);
}

// API routes
app.use('/api/solve', solverRoutes);
app.use('/api/ranges', rangeRoutes);
app.use('/api/icm', icmRoutes);
app.use('/api/hands', handRoutes);
app.use('/api/charts', chartsRoutes);
app.use('/api/gto', gtoRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'MTT Poker Solver API',
    version: '1.0.0',
    description: 'Comprehensive Multi-Table Tournament poker solver with ICM calculations and GTO solutions',
    endpoints: {
      solver: {
        'POST /api/solve': 'Solve a specific tournament scenario',
        'POST /api/solve/push-fold': 'Calculate optimal push/fold decision',
        'POST /api/solve/multi-way': 'Solve multi-way scenarios'
      },
      ranges: {
        'GET /api/ranges/:position': 'Get optimal ranges for position',
        'POST /api/ranges/parse': 'Parse range string into hands',
        'POST /api/ranges/equity': 'Calculate range vs range equity'
      },
      icm: {
        'POST /api/icm/calculate': 'Calculate ICM equity',
        'POST /api/icm/bubble-factor': 'Calculate bubble factor',
        'POST /api/icm/push-fold-ev': 'Calculate push/fold expected value'
      },
      hands: {
        'POST /api/hands/analyze': 'Analyze specific hand',
        'POST /api/hands/evaluate': 'Evaluate hand strength',
        'POST /api/hands/equity': 'Calculate hand vs hand equity'
      },
      charts: {
        'GET /api/charts/push-fold': 'Generate push/fold charts',
        'POST /api/charts/custom': 'Generate custom strategy charts'
      }
    }
  });
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  server.close(async (err) => {
    if (err) {
      logger.error('Error during server shutdown:', err);
      process.exit(1);
    }

    try {
      await closeDatabase();
      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

// Start server
const server = app.listen(PORT, async () => {
  try {
    await initializeDatabase();
    
    // Run migrations in production
    if (process.env.NODE_ENV === 'production' || process.env.RUN_MIGRATIONS === 'true') {
      try {
        await migrationManager.migrate();
        logger.info('Database migrations completed');
      } catch (error) {
        logger.error('Migration failed, continuing anyway', { error });
      }
    }
    
    // Initialize WebSocket server
    initializeWebSocket(server);
    logger.info('WebSocket server initialized');
    
    logger.info(`MTT Poker Solver API server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
    logger.info(`API documentation: http://localhost:${PORT}/api`);
    logger.info(`WebSocket server: ws://localhost:${PORT}`);
    if (process.env.ENABLE_METRICS === 'true') {
      logger.info(`Metrics endpoint: http://localhost:${PORT}/metrics`);
    }
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
});

export default app;