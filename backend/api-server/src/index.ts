/**
 * MEVrebels API Server
 *
 * REST API and WebSocket server for MEVrebels Protocol
 * Serves strategy data, leaderboards, proposals, and real-time updates
 */

import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import pino from 'pino';
import dotenv from 'dotenv';

// Import routes
import { strategyRoutes } from './routes/strategies';
import { leaderboardRoutes } from './routes/leaderboard';
import { proposalRoutes } from './routes/proposals';
import { analyticsRoutes } from './routes/analytics';

// Import services
import { db } from './services/db';
import { redis } from './services/redis';
import { initWebSocketServer } from './services/websocket';

// Import middleware
import { errorHandler } from './middleware/error-handler';
import { rateLimiter } from './middleware/rate-limiter';

// Load environment variables
dotenv.config();

// Initialize logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
});

// Configuration
const PORT = parseInt(process.env.PORT || '3001', 10);
const WS_PORT = parseInt(process.env.WS_PORT || '3002', 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Initialize Express app
const app: Express = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(rateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// API Routes
app.use('/api/strategies', strategyRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown handler
async function shutdown(signal: string) {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  // Close database connections
  await db.end();
  logger.info('Database connections closed');

  // Close Redis connection
  await redis.quit();
  logger.info('Redis connection closed');

  // Exit process
  process.exit(0);
}

// Register shutdown handlers
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server
async function start() {
  try {
    // Test database connection
    await db.query('SELECT NOW()');
    logger.info('✅ Database connected');

    // Test Redis connection
    await redis.ping();
    logger.info('✅ Redis connected');

    // Start HTTP server
    const httpServer = createServer(app);
    httpServer.listen(PORT, () => {
      logger.info(`🚀 API Server listening on http://localhost:${PORT}`);
      logger.info(`📖 API Documentation: http://localhost:${PORT}/api/docs`);
    });

    // Start WebSocket server
    const wss = new WebSocketServer({ port: WS_PORT });
    initWebSocketServer(wss);
    logger.info(`🔌 WebSocket Server listening on ws://localhost:${WS_PORT}`);

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the application
start();
