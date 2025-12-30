import session from 'express-session';
import RedisStore from 'connect-redis';
import redisClient from '../lib/redis.js';

export const sessionMiddleware = session({
  store: new RedisStore({
    client: redisClient,
    prefix: 'tikit:sess:',
  }),
  secret: process.env.SESSION_SECRET || 'tikit-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    sameSite: 'lax',
  },
});
