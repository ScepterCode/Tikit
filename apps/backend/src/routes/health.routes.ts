import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import redisClient from '../lib/redis.js';
import { supabase } from '../lib/supabase';
import { SupabaseService } from '../services/supabase.service';

const router = Router();

/**
 * Liveness probe - checks if application is running
 * Used by load balancers to determine if instance should receive traffic
 */
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: 'MB',
    },
  });
});

/**
 * Readiness probe - checks if application is ready to serve traffic
 * Verifies all dependencies are available
 */
router.get('/ready', async (req: Request, res: Response) => {
  const checks: Record<string, string> = {};
  let isReady = true;

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'connected';
  } catch (error) {
    checks.database = 'disconnected';
    isReady = false;
  }

  try {
    // Check Redis connection
    await redisClient.ping();
    checks.redis = 'connected';
  } catch (error) {
    checks.redis = 'disconnected';
    isReady = false;
  }

  try {
    // Check Supabase connection
    if (supabase) {
      const supabaseConnected = await SupabaseService.testConnection();
      checks.supabase = supabaseConnected ? 'connected' : 'disconnected';
      if (!supabaseConnected) {
        isReady = false;
      }
    } else {
      checks.supabase = 'not_configured';
    }
  } catch (error) {
    checks.supabase = 'error';
    isReady = false;
  }

  // Check if Firebase is configured (optional)
  if (process.env.FIREBASE_PROJECT_ID) {
    checks.firebase = 'configured';
  }

  const status = isReady ? 200 : 503;
  res.status(status).json({
    status: isReady ? 'ready' : 'not ready',
    timestamp: new Date().toISOString(),
    checks,
  });
});

/**
 * Metrics endpoint - provides application metrics for monitoring
 * Can be scraped by Prometheus or similar tools
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    // Get database connection pool stats
    const dbMetrics = await prisma.$metrics.json();

    // Get Redis info
    const redisInfo = await redisClient.info('stats');
    const redisStats = redisInfo.split('\r\n').reduce((acc, line) => {
      const [key, value] = line.split(':');
      if (key && value) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, string>);

    // Get process metrics
    const processMetrics = {
      uptime: process.uptime(),
      memory: {
        heapUsed: process.memoryUsage().heapUsed,
        heapTotal: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external,
        rss: process.memoryUsage().rss,
      },
      cpu: process.cpuUsage(),
    };

    res.status(200).json({
      timestamp: new Date().toISOString(),
      process: processMetrics,
      database: dbMetrics,
      redis: {
        keyspaceHits: parseInt(redisStats.keyspace_hits || '0'),
        keyspaceMisses: parseInt(redisStats.keyspace_misses || '0'),
        connectedClients: parseInt(redisStats.connected_clients || '0'),
        usedMemory: redisStats.used_memory_human || '0',
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to collect metrics',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Version endpoint - returns application version and build info
 */
router.get('/version', (req: Request, res: Response) => {
  res.status(200).json({
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    buildDate: process.env.BUILD_DATE || new Date().toISOString(),
  });
});

export default router;
