import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';

describe('CORS and CSRF Protection', () => {
  let app: express.Application;
  const csrfTokens = new Map<string, { token: string; expiresAt: number }>();

  beforeEach(() => {
    app = express();
    csrfTokens.clear();

    // CORS Configuration
    const corsOptions = {
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin) {
          return callback(null, true);
        }

        const allowedOrigins = [
          'http://localhost:3000',
          'http://localhost:5173',
          'https://tikit.vercel.app',
        ];

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
      exposedHeaders: ['X-CSRF-Token'],
      maxAge: 86400,
    };

    app.use(cors(corsOptions));
    app.use(express.json());

    // CSRF token generation endpoint
    app.get('/api/csrf-token', (req, res) => {
      const token = crypto.randomBytes(32).toString('hex');
      const sessionId = req.headers['x-session-id'] as string || crypto.randomBytes(16).toString('hex');
      
      csrfTokens.set(sessionId, {
        token,
        expiresAt: Date.now() + 3600000,
      });

      res.json({ token, sessionId });
    });

    // CSRF validation middleware
    const validateCSRF = (req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
      }

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

    // Apply CSRF protection
    app.use((req, res, next) => {
      if (req.path === '/health' || req.path === '/api/csrf-token') {
        return next();
      }
      validateCSRF(req, res, next);
    });

    // Test routes
    app.get('/health', (_req, res) => {
      res.json({ status: 'ok' });
    });

    app.post('/api/test', (_req, res) => {
      res.json({ message: 'success' });
    });

    app.post('/api/ussd/webhook', (_req, res) => {
      res.json({ message: 'ussd success' });
    });
  });

  describe('CORS Protection', () => {
    it('should allow requests from whitelisted origins', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:5173');

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });

    it('should allow requests with no origin', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
    });

    it('should expose CSRF token header', async () => {
      const response = await request(app)
        .get('/api/csrf-token')
        .set('Origin', 'http://localhost:5173');

      expect(response.headers['access-control-expose-headers']).toContain('X-CSRF-Token');
    });
  });

  describe('CSRF Protection', () => {
    it('should generate CSRF token', async () => {
      const response = await request(app).get('/api/csrf-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('sessionId');
      expect(response.body.token).toHaveLength(64); // 32 bytes = 64 hex chars
    });

    it('should allow GET requests without CSRF token', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
    });

    it('should reject POST requests without CSRF token', async () => {
      const response = await request(app)
        .post('/api/test')
        .send({ data: 'test' });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('CSRF token missing');
    });

    it('should accept POST requests with valid CSRF token', async () => {
      // Get CSRF token
      const tokenResponse = await request(app).get('/api/csrf-token');
      const { token, sessionId } = tokenResponse.body;

      // Make POST request with token
      const response = await request(app)
        .post('/api/test')
        .set('X-CSRF-Token', token)
        .set('X-Session-ID', sessionId)
        .send({ data: 'test' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('success');
    });

    it('should reject POST requests with invalid CSRF token', async () => {
      const tokenResponse = await request(app).get('/api/csrf-token');
      const { sessionId } = tokenResponse.body;

      const response = await request(app)
        .post('/api/test')
        .set('X-CSRF-Token', 'invalid-token')
        .set('X-Session-ID', sessionId)
        .send({ data: 'test' });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Invalid CSRF token');
    });

    it('should reject POST requests with invalid session', async () => {
      const response = await request(app)
        .post('/api/test')
        .set('X-CSRF-Token', 'some-token')
        .set('X-Session-ID', 'invalid-session')
        .send({ data: 'test' });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Invalid session');
    });

    it('should reject expired CSRF tokens', async () => {
      const tokenResponse = await request(app).get('/api/csrf-token');
      const { token, sessionId } = tokenResponse.body;

      // Manually expire the token
      const storedData = csrfTokens.get(sessionId);
      if (storedData) {
        storedData.expiresAt = Date.now() - 1000; // Expired 1 second ago
      }

      const response = await request(app)
        .post('/api/test')
        .set('X-CSRF-Token', token)
        .set('X-Session-ID', sessionId)
        .send({ data: 'test' });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('CSRF token expired');
    });

    it('should exempt USSD webhooks from CSRF protection', async () => {
      const response = await request(app)
        .post('/api/ussd/webhook')
        .send({ sessionId: 'test', phoneNumber: '+2348012345678' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('ussd success');
    });

    it('should exempt health check from CSRF protection', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });
});
