import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import dotenv from 'dotenv';
import prisma from './lib/prisma.js';
import redisClient from './lib/redis.js';
import supabase from './lib/supabase.js';
import authRoutes from './routes/auth.routes.js';
import securityRoutes from './routes/security.routes.js';
import eventRoutes from './routes/event.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import ticketRoutes from './routes/ticket.routes.js';
import groupBuyRoutes from './routes/groupbuy.routes.js';
import recommendationRoutes from './routes/recommendation.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import ussdRoutes from './routes/ussd.routes.js';
import referralRoutes from './routes/referral.routes.js';
import adminRoutes from './routes/admin.routes.js';
import realtimeRoutes from './routes/realtime.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// CORS Configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    // Whitelist of allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://tikit.vercel.app',
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['X-CSRF-Token'],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));
app.use(express.json());

// CSRF Protection Middleware
// Generate and validate CSRF tokens for state-changing operations
const csrfTokens = new Map<string, { token: string; expiresAt: number }>();

// Generate CSRF token
app.get('/api/csrf-token', (req, res) => {
  const token = crypto.randomBytes(32).toString('hex');
  const sessionId = req.headers['x-session-id'] as string || crypto.randomBytes(16).toString('hex');
  
  // Store token with 1 hour expiration
  csrfTokens.set(sessionId, {
    token,
    expiresAt: Date.now() + 3600000, // 1 hour
  });

  // Clean up expired tokens
  for (const [id, data] of csrfTokens.entries()) {
    if (data.expiresAt < Date.now()) {
      csrfTokens.delete(id);
    }
  }

  res.json({ token, sessionId });
});

// CSRF validation middleware
const validateCSRF = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for USSD webhook (external service)
  if (req.path.startsWith('/api/ussd')) {
    return next();
  }

  const token = req.headers['x-csrf-token'] as string;
  const sessionId = req.headers['x-session-id'] as string;

  if (!token || !sessionId) {
    return res.status(403).json({ error: 'CSRF token missing' });
  }

  const storedData = csrfTokens.get(sessionId);

  if (!storedData) {
    return res.status(403).json({ error: 'Invalid session' });
  }

  if (storedData.expiresAt < Date.now()) {
    csrfTokens.delete(sessionId);
    return res.status(403).json({ error: 'CSRF token expired' });
  }

  if (storedData.token !== token) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
};

// Apply CSRF protection to all routes except health check and CSRF token endpoint
app.use((req, res, next) => {
  if (req.path === '/health' || req.path === '/api/csrf-token') {
    return next();
  }
  // Disable CSRF in development for easier testing
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    return next();
  }
  validateCSRF(req, res, next);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/group-buy', groupBuyRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ussd', ussdRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/realtime', realtimeRoutes);

app.get('/health', async (_req, res) => {
  const health = {
    status: 'ok',
    message: 'Tikit API is running',
    database: 'disconnected',
    redis: 'disconnected',
    supabase: 'disconnected',
    timestamp: new Date().toISOString(),
  };

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    health.database = 'connected';
  } catch (error) {
    console.error('Database health check failed:', error);
  }

  try {
    // Check Redis connection
    await redisClient.ping();
    health.redis = 'connected';
  } catch (error) {
    console.error('Redis health check failed:', error);
  }

  try {
    // Check Supabase connection using our service
    if (supabase) {
      // Try to get the current timestamp - this should always work
      const { data, error } = await supabase.rpc('now');
      
      if (!error) {
        health.supabase = 'connected';
      } else {
        // If RPC doesn't work, try a simple auth check
        const { data: authData, error: authError } = await supabase.auth.getSession();
        if (!authError) {
          health.supabase = 'connected';
        } else {
          console.error('Supabase health check failed:', error.message);
        }
      }
    } else {
      health.supabase = 'not_configured';
    }
  } catch (error) {
    console.error('Supabase health check failed:', error);
  }

  const statusCode =
    health.database === 'connected' &&
    health.redis === 'connected' &&
    health.supabase === 'connected'
      ? 200
      : 503;
  res.status(statusCode).json(health);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  await redisClient.quit();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default app;
